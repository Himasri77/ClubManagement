const { run, get, all } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

// Days a student must wait after a rejection before requesting the same club again
const REAPPLY_COOLDOWN_DAYS = 7;

// Helper: is req.user allowed to manage requests for this club?
const canManageClub = (req, club) => {
  return req.user.role === 'admin' || club.club_lead_id === req.user.id;
};

// 1. Student requests to join a club
exports.requestToJoin = async (req, res, next) => {
  try {
    const { id: clubId } = req.params;
    const userId = req.user.id;

    const club = await get('SELECT * FROM clubs WHERE id = ?', [clubId]);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }
    if (club.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This club is not currently accepting members.' });
    }

    // Already a member?
    const existingMember = await get(
      'SELECT id FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this club.' });
    }

    // Already have a pending request?
    const existingPending = await get(
      `SELECT id FROM membership_requests WHERE club_id = ? AND user_id = ? AND status = 'pending'`,
      [clubId, userId]
    );
    if (existingPending) {
      return res.status(400).json({ success: false, message: 'You already have a pending request for this club.' });
    }

    // Reapply cooldown after a rejection
    const lastRejected = await get(
      `SELECT reviewed_at FROM membership_requests
       WHERE club_id = ? AND user_id = ? AND status = 'rejected'
       ORDER BY reviewed_at DESC LIMIT 1`,
      [clubId, userId]
    );
    if (lastRejected && lastRejected.reviewed_at) {
      const reviewedAt = new Date(lastRejected.reviewed_at + 'Z'); // SQLite CURRENT_TIMESTAMP is UTC
      const cooldownEnds = new Date(reviewedAt.getTime() + REAPPLY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
      const now = new Date();
      if (now < cooldownEnds) {
        const msRemaining = cooldownEnds - now;
        const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
        return res.status(400).json({
          success: false,
          message: `Your previous request was rejected. You can reapply in ${daysRemaining} day(s).`,
          cooldown_ends_at: cooldownEnds.toISOString()
        });
      }
    }

    const result = await run(
      `INSERT INTO membership_requests (club_id, user_id, status) VALUES (?, ?, 'pending')`,
      [clubId, userId]
    );

    return res.status(201).json({
      success: true,
      message: 'Membership request submitted. Awaiting approval.',
      request_id: result.lastID
    });
  } catch (err) {
    next(err);
  }
};

// 2. Get the logged-in student's request/membership status for a specific club
// (used by the frontend to render the right button — Join / Pending / Member / Rejected)
exports.getMyRequestStatus = async (req, res, next) => {
  try {
    const { id: clubId } = req.params;
    const userId = req.user.id;

    const membership = await get(
      'SELECT role, joined_at FROM club_members WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );
    if (membership) {
      return res.status(200).json({ success: true, status: 'member', membership });
    }

    const latestRequest = await get(
      `SELECT id, status, rejection_reason, requested_at, reviewed_at
       FROM membership_requests WHERE club_id = ? AND user_id = ?
       ORDER BY requested_at DESC LIMIT 1`,
      [clubId, userId]
    );

    if (!latestRequest) {
      return res.status(200).json({ success: true, status: 'none' });
    }

    return res.status(200).json({ success: true, status: latestRequest.status, request: latestRequest });
  } catch (err) {
    next(err);
  }
};

// 3. Get all requests for a specific club (admin, or that club's lead)
exports.getClubRequests = async (req, res, next) => {
  try {
    const { id: clubId } = req.params;
    const { status } = req.query;

    const club = await get('SELECT id, club_lead_id FROM clubs WHERE id = ?', [clubId]);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }
    if (!canManageClub(req, club)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view requests for this club.' });
    }

    let query = `
      SELECT r.*, u.full_name, u.email, u.roll_number, u.department
      FROM membership_requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.club_id = ?
    `;
    const params = [clubId];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    query += ' ORDER BY r.requested_at DESC';

    const requests = await all(query, params);
    return res.status(200).json({ success: true, requests });
  } catch (err) {
    next(err);
  }
};

// 4. Admin: get all pending requests across every club (global approvals queue)
exports.getAllRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT r.*, u.full_name, u.email, u.roll_number, u.department,
             c.name as club_name, c.code as club_code
      FROM membership_requests r
      JOIN users u ON r.user_id = u.id
      JOIN clubs c ON r.club_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND r.status = ?';
      params.push(status);
    } else if (!status) {
      query += ` AND r.status = 'pending'`;
    }
    // status === 'all' -> no filter, return every request
    query += ' ORDER BY r.requested_at ASC';

    const requests = await all(query, params);
    return res.status(200).json({ success: true, requests });
  } catch (err) {
    next(err);
  }
};

// 5. Approve or reject a membership request (admin, or that club's lead)
exports.reviewRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'approved' or 'rejected'." });
    }

    const request = await get('SELECT * FROM membership_requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed.' });
    }

    const club = await get('SELECT id, name, club_lead_id FROM clubs WHERE id = ?', [request.club_id]);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Associated club not found.' });
    }
    if (!canManageClub(req, club)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to review this request.' });
    }

    await run(
      `UPDATE membership_requests SET status = ?, rejection_reason = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, status === 'rejected' ? (rejection_reason || null) : null, id]
    );

    if (status === 'approved') {
      // INSERT OR IGNORE guards against a race where the user is somehow
      // already in club_members (unique constraint on club_id, user_id)
      await run(
        `INSERT OR IGNORE INTO club_members (club_id, user_id, role) VALUES (?, ?, 'Member')`,
        [request.club_id, request.user_id]
      );
    }

    // Notify the student either way — the notifications table already
    // exists in the schema and was sitting unused.
    const notifTitle = status === 'approved' ? 'Membership Approved' : 'Membership Request Update';
    const notifMessage = status === 'approved'
      ? `Your request to join ${club.name} has been approved.`
      : `Your request to join ${club.name} was rejected.${rejection_reason ? ' Reason: ' + rejection_reason : ''}`;
    await run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [request.user_id, notifTitle, notifMessage, status === 'approved' ? 'success' : 'info']
    );

    await logActivity(
      req.user.id, status === 'approved' ? 'approve' : 'reject', 'membership_request', id,
      `Request from user #${request.user_id} to join "${club.name}" was ${status}`
    );

    return res.status(200).json({ success: true, message: `Request ${status}.` });
  } catch (err) {
    next(err);
  }
};
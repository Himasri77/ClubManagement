const { run, get, all } = require('../config/db');

// 1. Get All Clubs (with filtering & search)
exports.getAllClubs = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;
    let query = `
      SELECT c.*, u.full_name as lead_name, u.email as lead_email,
             (SELECT COUNT(*) FROM memberships m WHERE m.club_id = c.id AND m.status = 'approved') as member_count
      FROM clubs c
      LEFT JOIN users u ON c.lead_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by status (default to active for students unless specified)
    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    } else if (req.user?.role !== 'admin') {
      query += ` AND c.status = 'active'`;
    }

    if (category) {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (c.name LIKE ? OR c.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY c.created_at DESC`;

    const clubs = await all(query, params);
    return res.status(200).json({ success: true, clubs });
  } catch (err) {
    next(err);
  }
};

// 2. Get Single Club Details
exports.getClubById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const club = await get(
      `SELECT c.*, u.full_name as lead_name, u.email as lead_email, u.phone as lead_phone
       FROM clubs c
       LEFT JOIN users u ON c.lead_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    // Get active members count
    const memberStats = await get(
      `SELECT COUNT(*) as total FROM memberships WHERE club_id = ? AND status = 'approved'`,
      [id]
    );

    club.member_count = memberStats ? memberStats.total : 0;

    return res.status(200).json({ success: true, club });
  } catch (err) {
    next(err);
  }
};

// 3. Create New Club (Admin Direct Creation or Student Request)
exports.createClub = async (req, res, next) => {
  try {
    const { name, code, category, description, lead_id, logo_url, banner_url } = req.body;

    if (!name || !code || !category || !description) {
      return res.status(400).json({ success: false, message: 'Name, code, category, and description are required.' });
    }

    // Check unique code
    const existing = await get('SELECT id FROM clubs WHERE code = ?', [code.toUpperCase().trim()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A club with this code already exists.' });
    }

    const isAdmin = req.user.role === 'admin';
    const initialStatus = isAdmin ? 'active' : 'pending';
    const assignedLeadId = lead_id || (isAdmin ? null : req.user.id);

    const result = await run(
      `INSERT INTO clubs (name, code, category, description, lead_id, logo_url, banner_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), code.toUpperCase().trim(), category, description, assignedLeadId, logo_url || null, banner_url || null, initialStatus]
    );

    // If student requested, also auto-add as lead in memberships
    if (!isAdmin && assignedLeadId) {
      await run(
        `INSERT INTO memberships (user_id, club_id, role, status) VALUES (?, ?, 'lead', 'approved')`,
        [assignedLeadId, result.lastID]
      );
    }

    return res.status(201).json({
      success: true,
      message: isAdmin ? 'Club created successfully!' : 'Club creation proposal submitted for Admin review.',
      club_id: result.lastID
    });
  } catch (err) {
    next(err);
  }
};

// 4. Update Club Details (Admin or Club Lead)
exports.updateClub = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description, lead_id, status, logo_url, banner_url } = req.body;

    const club = await get('SELECT * FROM clubs WHERE id = ?', [id]);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    // Permission check
    if (req.user.role !== 'admin' && club.lead_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this club.' });
    }

    await run(
      `UPDATE clubs SET 
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        lead_id = COALESCE(?, lead_id),
        status = COALESCE(?, status),
        logo_url = COALESCE(?, logo_url),
        banner_url = COALESCE(?, banner_url),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, description, lead_id, status, logo_url, banner_url, id]
    );

    return res.status(200).json({ success: true, message: 'Club updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// 5. Admin Approve/Reject Club Request
exports.reviewClubStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'rejected'

    if (!['active', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status specified.' });
    }

    await run('UPDATE clubs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

    return res.status(200).json({
      success: true,
      message: `Club status updated to ${status}.`
    });
  } catch (err) {
    next(err);
  }
};
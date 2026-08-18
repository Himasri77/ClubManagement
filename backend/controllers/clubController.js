const { run, get, all } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

// 1. Get All Clubs (with filtering & search)
exports.getAllClubs = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;
    const userId = req.user?.id || null;
    let query = `
      SELECT c.*, u.full_name as lead_name, u.email as lead_email,
             (SELECT COUNT(*) FROM club_members m WHERE m.club_id = c.id) as member_count,
             (SELECT 1 FROM club_members m WHERE m.club_id = c.id AND m.user_id = ?) as is_member,
             (SELECT r.status FROM membership_requests r
                WHERE r.club_id = c.id AND r.user_id = ?
                ORDER BY r.requested_at DESC LIMIT 1) as request_status
      FROM clubs c
      LEFT JOIN users u ON c.club_lead_id = u.id
      WHERE 1=1
    `;
    const params = [userId, userId];

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
       LEFT JOIN users u ON c.club_lead_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    // Get member count
    const memberStats = await get(
      `SELECT COUNT(*) as total FROM club_members WHERE club_id = ?`,
      [id]
    );

    club.member_count = memberStats ? memberStats.total : 0;

    return res.status(200).json({ success: true, club });
  } catch (err) {
    next(err);
  }
};

// 3. Create New Club (Admin only — matches schema's NOT NULL columns)
exports.createClub = async (req, res, next) => {
  try {
    const {
      name, code, category, description,
      faculty_coordinator, contact_email, contact_phone,
      club_lead_id, logo
    } = req.body;

    // Required by schema.sql: name, code, description, category,
    // faculty_coordinator, contact_email are all NOT NULL
    if (!name || !code || !category || !description || !faculty_coordinator || !contact_email) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, category, description, faculty coordinator, and contact email are required.'
      });
    }

    // Only admins can create clubs directly in this schema (clubs.status
    // only supports 'active'/'inactive' — there's no pending/review state)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create clubs.' });
    }

    // Check unique name/code
    const existingCode = await get('SELECT id FROM clubs WHERE code = ?', [code.toUpperCase().trim()]);
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'A club with this code already exists.' });
    }
    const existingName = await get('SELECT id FROM clubs WHERE name = ?', [name.trim()]);
    if (existingName) {
      return res.status(400).json({ success: false, message: 'A club with this name already exists.' });
    }

    const result = await run(
      `INSERT INTO clubs (name, code, description, category, logo, faculty_coordinator, club_lead_id, contact_email, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(), code.toUpperCase().trim(), description.trim(), category,
        logo || null, faculty_coordinator.trim(), club_lead_id || null,
        contact_email.trim(), contact_phone || null
      ]
    );

    // If a lead was assigned at creation, add them to club_members
    if (club_lead_id) {
      await run(
        `INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, 'Club Lead')`,
        [result.lastID, club_lead_id]
      );
    }

    await logActivity(req.user.id, 'create', 'club', result.lastID, `Club "${name.trim()}" was created`);

    return res.status(201).json({
      success: true,
      message: 'Club created successfully!',
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
    const {
      name, category, description, club_lead_id, status,
      logo, faculty_coordinator, contact_email, contact_phone
    } = req.body;

    const club = await get('SELECT * FROM clubs WHERE id = ?', [id]);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    // Permission check
    if (req.user.role !== 'admin' && club.club_lead_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this club.' });
    }

    await run(
      `UPDATE clubs SET 
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        club_lead_id = COALESCE(?, club_lead_id),
        status = COALESCE(?, status),
        logo = COALESCE(?, logo),
        faculty_coordinator = COALESCE(?, faculty_coordinator),
        contact_email = COALESCE(?, contact_email),
        contact_phone = COALESCE(?, contact_phone),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category, description, club_lead_id, status, logo, faculty_coordinator, contact_email, contact_phone, id]
    );

    return res.status(200).json({ success: true, message: 'Club updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// 5. Admin Activate/Deactivate a Club
// Note: schema.sql's clubs.status CHECK constraint only allows 'active' | 'inactive'.
// There is no pending/rejected state for club creation — only admins create clubs,
// so there's nothing to "review". This endpoint just toggles visibility.
exports.reviewClubStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'inactive'

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Must be 'active' or 'inactive'." });
    }

    const club = await get('SELECT id FROM clubs WHERE id = ?', [id]);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found.' });
    }

    await run('UPDATE clubs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

    await logActivity(req.user.id, 'update', 'club', id, `Club status changed to ${status}`);

    return res.status(200).json({
      success: true,
      message: `Club status updated to ${status}.`
    });
  } catch (err) {
    next(err);
  }
};
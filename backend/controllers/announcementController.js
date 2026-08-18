const { run, get, all } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');

// Helper: can this user manage announcements for this club (or global)?
const canManage = (req, club) => {
  if (req.user.role === 'admin') return true;
  if (club && club.club_lead_id === req.user.id) return true;
  return false;
};

// 1. Get All Announcements (feed) — excludes expired ones by default
exports.getAllAnnouncements = async (req, res, next) => {
  try {
    const { club_id, scope, include_expired } = req.query;

    let query = `
      SELECT a.*, c.name as club_name, c.code as club_code, u.full_name as published_by_name
      FROM announcements a
      LEFT JOIN clubs c ON a.club_id = c.id
      LEFT JOIN users u ON a.published_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (include_expired !== 'true') {
      query += ` AND (a.expiry_date IS NULL OR a.expiry_date >= date('now'))`;
    }
    if (club_id) {
      query += ' AND a.club_id = ?';
      params.push(club_id);
    }
    if (scope) {
      query += ' AND a.scope = ?';
      params.push(scope);
    }

    // Urgent first, then important, then normal; newest within each tier
    query += `
      ORDER BY CASE a.priority WHEN 'urgent' THEN 0 WHEN 'important' THEN 1 ELSE 2 END,
               a.created_at DESC
    `;

    const announcements = await all(query, params);
    return res.status(200).json({ success: true, announcements });
  } catch (err) {
    next(err);
  }
};

// 2. Get Single Announcement
exports.getAnnouncementById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await get(
      `SELECT a.*, c.name as club_name, u.full_name as published_by_name
       FROM announcements a
       LEFT JOIN clubs c ON a.club_id = c.id
       LEFT JOIN users u ON a.published_by = u.id
       WHERE a.id = ?`,
      [id]
    );
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }
    return res.status(200).json({ success: true, announcement });
  } catch (err) {
    next(err);
  }
};

// 3. Create Announcement (admin for global, admin or club lead for club-scoped)
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, scope, club_id, priority, expiry_date } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const announcementScope = scope === 'club' ? 'club' : 'global';

    if (announcementScope === 'global') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only admins can post global announcements.' });
      }
    } else {
      if (!club_id) {
        return res.status(400).json({ success: false, message: 'club_id is required for a club-scoped announcement.' });
      }
      const club = await get('SELECT id, club_lead_id FROM clubs WHERE id = ?', [club_id]);
      if (!club) {
        return res.status(404).json({ success: false, message: 'Club not found.' });
      }
      if (!canManage(req, club)) {
        return res.status(403).json({ success: false, message: 'Only admins or this club\'s lead can post announcements for it.' });
      }
    }

    const validPriorities = ['normal', 'important', 'urgent'];
    const announcementPriority = validPriorities.includes(priority) ? priority : 'normal';

    const result = await run(
      `INSERT INTO announcements (title, content, scope, club_id, priority, published_by, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(), content.trim(), announcementScope,
        announcementScope === 'global' ? null : club_id,
        announcementPriority, req.user.id, expiry_date || null
      ]
    );

    await logActivity(req.user.id, 'create', 'announcement', result.lastID, `Announcement "${title.trim()}" was posted`);

    return res.status(201).json({ success: true, message: 'Announcement posted successfully!', announcement_id: result.lastID });
  } catch (err) {
    next(err);
  }
};

// 4. Update Announcement
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, priority, expiry_date } = req.body;

    const announcement = await get('SELECT * FROM announcements WHERE id = ?', [id]);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const club = announcement.club_id ? await get('SELECT id, club_lead_id FROM clubs WHERE id = ?', [announcement.club_id]) : null;
    if (!canManage(req, club)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this announcement.' });
    }

    const validPriorities = ['normal', 'important', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority value.' });
    }

    await run(
      `UPDATE announcements SET
        title = COALESCE(?, title), content = COALESCE(?, content),
        priority = COALESCE(?, priority), expiry_date = COALESCE(?, expiry_date)
       WHERE id = ?`,
      [title, content, priority, expiry_date, id]
    );

    return res.status(200).json({ success: true, message: 'Announcement updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// 5. Delete Announcement
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const announcement = await get('SELECT * FROM announcements WHERE id = ?', [id]);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const club = announcement.club_id ? await get('SELECT id, club_lead_id FROM clubs WHERE id = ?', [announcement.club_id]) : null;
    if (!canManage(req, club)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this announcement.' });
    }

    await run('DELETE FROM announcements WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    next(err);
  }
};

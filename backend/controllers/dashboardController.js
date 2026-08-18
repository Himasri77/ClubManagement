const { get, all } = require('../config/db');

// Admin dashboard: system-wide counts + recent activity feed
exports.getAdminStats = async (req, res, next) => {
  try {
    const totalClubs = await get(`SELECT COUNT(*) as count FROM clubs WHERE status = 'active'`);
    const totalStudents = await get(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`);
    const pendingRequests = await get(`SELECT COUNT(*) as count FROM membership_requests WHERE status = 'pending'`);
    const totalMembers = await get(`SELECT COUNT(*) as count FROM club_members`);

    const recentActivity = await all(
      `SELECT a.action, a.entity_type, a.description, a.timestamp, u.full_name
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.timestamp DESC LIMIT 10`
    );

    return res.status(200).json({
      success: true,
      stats: {
        total_clubs: totalClubs.count,
        total_students: totalStudents.count,
        pending_requests: pendingRequests.count,
        total_memberships: totalMembers.count
      },
      recent_activity: recentActivity
    });
  } catch (err) {
    next(err);
  }
};

// Student dashboard: their own clubs, request status, and notifications
exports.getStudentStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const myClubs = await all(
      `SELECT c.id, c.name, c.category, c.logo, m.role, m.joined_at
       FROM club_members m
       JOIN clubs c ON m.club_id = c.id
       WHERE m.user_id = ?
       ORDER BY m.joined_at DESC`,
      [userId]
    );

    const pendingRequests = await all(
      `SELECT r.id, r.requested_at, c.name as club_name
       FROM membership_requests r
       JOIN clubs c ON r.club_id = c.id
       WHERE r.user_id = ? AND r.status = 'pending'
       ORDER BY r.requested_at DESC`,
      [userId]
    );

    const notifications = await all(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );

    const unreadCount = await get(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      stats: {
        clubs_joined: myClubs.length,
        pending_requests: pendingRequests.length,
        unread_notifications: unreadCount.count
      },
      my_clubs: myClubs,
      pending_requests: pendingRequests,
      notifications
    });
  } catch (err) {
    next(err);
  }
};
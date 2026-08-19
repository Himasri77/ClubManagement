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

// Admin analytics: charts for member growth, event trends, top clubs, category split
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. Member growth — new memberships per month, last 6 months
    const memberGrowth = await all(
      `SELECT strftime('%Y-%m', joined_at) as month, COUNT(*) as count
       FROM club_members
       WHERE joined_at >= date('now', '-6 months')
       GROUP BY month ORDER BY month ASC`
    );

    // 2. Event trends — events created + total registrations per month, last 6 months
    const eventTrends = await all(
      `SELECT strftime('%Y-%m', e.event_date) as month,
              COUNT(DISTINCT e.id) as events_count,
              (SELECT COUNT(*) FROM event_registrations r
                 JOIN events e2 ON r.event_id = e2.id
                 WHERE strftime('%Y-%m', e2.event_date) = strftime('%Y-%m', e.event_date)
                   AND r.status IN ('registered', 'attended')) as registrations
       FROM events e
       WHERE e.event_date >= date('now', '-6 months')
       GROUP BY month ORDER BY month ASC`
    );

    // 3. Top 5 most active clubs by member count
    const topClubs = await all(
      `SELECT c.name, COUNT(m.id) as member_count
       FROM clubs c LEFT JOIN club_members m ON m.club_id = c.id
       WHERE c.status = 'active'
       GROUP BY c.id ORDER BY member_count DESC LIMIT 5`
    );

    // 4. Club category distribution
    const categoryDistribution = await all(
      `SELECT category, COUNT(*) as count FROM clubs WHERE status = 'active' GROUP BY category`
    );

    // 5. Event attendance rate (attended vs registered, all-time)
    const attendanceStats = await get(
      `SELECT
         (SELECT COUNT(*) FROM event_registrations WHERE status = 'attended') as attended,
         (SELECT COUNT(*) FROM event_registrations WHERE status IN ('registered', 'attended')) as total`
    );

    return res.status(200).json({
      success: true,
      member_growth: memberGrowth,
      event_trends: eventTrends,
      top_clubs: topClubs,
      category_distribution: categoryDistribution,
      attendance_stats: attendanceStats
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
const { run, get, all } = require('../config/db');

// 1. Get logged-in user's notifications (most recent first)
exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit } = req.query;

    const notifications = await all(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit ? parseInt(limit, 10) : 30]
    );

    return res.status(200).json({ success: true, notifications });
  } catch (err) {
    next(err);
  }
};

// 2. Get unread count (lightweight — polled frequently by the bell icon)
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const row = await get(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return res.status(200).json({ success: true, count: row ? row.count : 0 });
  } catch (err) {
    next(err);
  }
};

// 3. Mark a single notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notif = await get('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    next(err);
  }
};

// 4. Mark all as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await run('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};

// 5. Delete a notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notif = await get('SELECT id FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await run('DELETE FROM notifications WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
};

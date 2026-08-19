const { run, all } = require('../config/db');

/**
 * Insert the same notification for many users at once.
 * @param {number[]} userIds
 * @param {string} title
 * @param {string} message
 * @param {string} type - 'info' | 'success' | 'warning'
 */
async function notifyUsers(userIds, title, message, type = 'info') {
  for (const userId of userIds) {
    await run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, title, message, type]
    );
  }
}

/** Notify every member of a specific club. */
async function notifyClubMembers(clubId, title, message, type = 'info') {
  const members = await all('SELECT user_id FROM club_members WHERE club_id = ?', [clubId]);
  await notifyUsers(members.map((m) => m.user_id), title, message, type);
}

/** Notify every student in the system (used for global events/announcements). */
async function notifyAllStudents(title, message, type = 'info') {
  const students = await all(`SELECT id FROM users WHERE role = 'student'`);
  await notifyUsers(students.map((s) => s.id), title, message, type);
}

module.exports = { notifyUsers, notifyClubMembers, notifyAllStudents };

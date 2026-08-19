const { run, get, all } = require('../config/db');
const { logActivity } = require('../utils/activityLogger');
const { notifyClubMembers, notifyAllStudents } = require('../utils/notifier');

// Helper: can this user manage events for this club (or global events)?
const canManageEvents = (req, club) => {
  if (req.user.role === 'admin') return true;
  if (club && club.club_lead_id === req.user.id) return true;
  return false;
};

// 1. Get All Events (with filtering)
exports.getAllEvents = async (req, res, next) => {
  try {
    const { club_id, scope, status, upcoming } = req.query;
    const userId = req.user?.id || null;

    let query = `
      SELECT e.*, c.name as club_name, c.code as club_code, u.full_name as created_by_name,
             (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'registered') as registered_count,
             (SELECT 1 FROM event_registrations r WHERE r.event_id = e.id AND r.user_id = ? AND r.status = 'registered') as is_registered
      FROM events e
      LEFT JOIN clubs c ON e.club_id = c.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [userId];

    if (club_id) {
      query += ' AND e.club_id = ?';
      params.push(club_id);
    }
    if (scope) {
      query += ' AND e.scope = ?';
      params.push(scope);
    }
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }
    if (upcoming === 'true') {
      query += ` AND e.event_date >= date('now')`;
    }

    query += ' ORDER BY e.event_date ASC, e.start_time ASC';

    const events = await all(query, params);
    return res.status(200).json({ success: true, events });
  } catch (err) {
    next(err);
  }
};

// 2. Get Single Event
exports.getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    const event = await get(
      `SELECT e.*, c.name as club_name, c.code as club_code, u.full_name as created_by_name,
              (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'registered') as registered_count,
              (SELECT 1 FROM event_registrations r WHERE r.event_id = e.id AND r.user_id = ? AND r.status = 'registered') as is_registered
       FROM events e
       LEFT JOIN clubs c ON e.club_id = c.id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [userId, id]
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.status(200).json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// 3. Create Event (admin for global events, admin or club lead for club events)
exports.createEvent = async (req, res, next) => {
  try {
    const {
      title, description, event_type, scope, club_id,
      event_date, start_time, end_time, venue,
      max_participants, registration_deadline, image
    } = req.body;

    if (!title || !description || !event_type || !event_date || !start_time || !end_time || !venue || !registration_deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, event type, date, start/end time, venue, and registration deadline are required.'
      });
    }

    const eventScope = scope === 'global' ? 'global' : 'club';

    if (eventScope === 'global') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only admins can create global events.' });
      }
    } else {
      if (!club_id) {
        return res.status(400).json({ success: false, message: 'club_id is required for a club-scoped event.' });
      }
      const club = await get('SELECT id, club_lead_id FROM clubs WHERE id = ?', [club_id]);
      if (!club) {
        return res.status(404).json({ success: false, message: 'Club not found.' });
      }
      if (!canManageEvents(req, club)) {
        return res.status(403).json({ success: false, message: 'Only admins or this club\'s lead can create events for it.' });
      }
    }

    const result = await run(
      `INSERT INTO events (title, description, event_type, scope, club_id, event_date, start_time, end_time, venue, max_participants, registration_deadline, image, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(), description.trim(), event_type, eventScope, eventScope === 'global' ? null : club_id,
        event_date, start_time, end_time, venue.trim(),
        max_participants || 0, registration_deadline, image || null, req.user.id
      ]
    );

    await logActivity(req.user.id, 'create', 'event', result.lastID, `Event "${title.trim()}" was created`);

    // Notify the relevant audience — club members for a club event, everyone for a global one
    const eventDateLabel = new Date(event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (eventScope === 'club') {
      await notifyClubMembers(
        club_id,
        'New Event Announced',
        `"${title.trim()}" is happening on ${eventDateLabel} at ${venue.trim()}.`,
        'info'
      );
    } else {
      await notifyAllStudents(
        'New Campus Event',
        `"${title.trim()}" is happening on ${eventDateLabel} at ${venue.trim()}.`,
        'info'
      );
    }

    return res.status(201).json({ success: true, message: 'Event created successfully!', event_id: result.lastID });
  } catch (err) {
    next(err);
  }
};

// 4. Update Event
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, description, event_type, event_date, start_time, end_time,
      venue, max_participants, registration_deadline, image, status
    } = req.body;

    const event = await get('SELECT * FROM events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const club = event.club_id ? await get('SELECT id, club_lead_id FROM clubs WHERE id = ?', [event.club_id]) : null;
    if (!canManageEvents(req, club)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this event.' });
    }

    const validStatuses = ['draft', 'upcoming', 'registration_open', 'registration_closed', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    await run(
      `UPDATE events SET
        title = COALESCE(?, title), description = COALESCE(?, description), event_type = COALESCE(?, event_type),
        event_date = COALESCE(?, event_date), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time),
        venue = COALESCE(?, venue), max_participants = COALESCE(?, max_participants),
        registration_deadline = COALESCE(?, registration_deadline), image = COALESCE(?, image), status = COALESCE(?, status)
       WHERE id = ?`,
      [title, description, event_type, event_date, start_time, end_time, venue, max_participants, registration_deadline, image, status, id]
    );

    return res.status(200).json({ success: true, message: 'Event updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// 5. Register for an Event (capacity + deadline enforced)
exports.registerForEvent = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    const event = await get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    if (['cancelled', 'completed'].includes(event.status)) {
      return res.status(400).json({ success: false, message: `Registration is closed — this event is ${event.status}.` });
    }

    // Deadline check — registration_deadline is a DATETIME string
    const deadline = new Date(event.registration_deadline);
    if (new Date() > deadline) {
      return res.status(400).json({ success: false, message: 'The registration deadline for this event has passed.' });
    }

    // Already registered?
    const existing = await get(
      `SELECT id, status FROM event_registrations WHERE event_id = ? AND user_id = ?`,
      [eventId, userId]
    );
    if (existing && existing.status === 'registered') {
      return res.status(400).json({ success: false, message: 'You are already registered for this event.' });
    }

    // Capacity check (0 = unlimited)
    if (event.max_participants && event.max_participants > 0) {
      const countRow = await get(
        `SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ? AND status = 'registered'`,
        [eventId]
      );
      if (countRow.count >= event.max_participants) {
        return res.status(400).json({ success: false, message: 'This event has reached its maximum capacity.' });
      }
    }

    if (existing) {
      // They previously cancelled — re-register instead of inserting a duplicate row
      await run(`UPDATE event_registrations SET status = 'registered', registered_at = CURRENT_TIMESTAMP WHERE id = ?`, [existing.id]);
    } else {
      await run(`INSERT INTO event_registrations (event_id, user_id, status) VALUES (?, ?, 'registered')`, [eventId, userId]);
    }

    return res.status(201).json({ success: true, message: 'Successfully registered for the event!' });
  } catch (err) {
    next(err);
  }
};

// 6. Cancel Registration
exports.cancelRegistration = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    const existing = await get(
      `SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ? AND status = 'registered'`,
      [eventId, userId]
    );
    if (!existing) {
      return res.status(400).json({ success: false, message: 'You are not registered for this event.' });
    }

    await run(`UPDATE event_registrations SET status = 'cancelled' WHERE id = ?`, [existing.id]);

    return res.status(200).json({ success: true, message: 'Registration cancelled.' });
  } catch (err) {
    next(err);
  }
};

// 8. Mark a registrant's attendance (admin or that club's lead)
exports.markAttendance = async (req, res, next) => {
  try {
    const { id: eventId, regId } = req.params;
    const { attended } = req.body; // true -> 'attended', false -> back to 'registered'

    const event = await get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const club = event.club_id ? await get('SELECT id, club_lead_id FROM clubs WHERE id = ?', [event.club_id]) : null;
    if (!canManageEvents(req, club)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to mark attendance for this event.' });
    }

    const registration = await get(
      `SELECT id FROM event_registrations WHERE id = ? AND event_id = ?`,
      [regId, eventId]
    );
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    await run(
      `UPDATE event_registrations SET status = ? WHERE id = ?`,
      [attended ? 'attended' : 'registered', regId]
    );

    return res.status(200).json({ success: true, message: `Attendance ${attended ? 'marked' : 'unmarked'}.` });
  } catch (err) {
    next(err);
  }
};

exports.getEventRegistrations = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;

    const event = await get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    const club = event.club_id ? await get('SELECT id, club_lead_id FROM clubs WHERE id = ?', [event.club_id]) : null;
    if (!canManageEvents(req, club)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view registrations for this event.' });
    }

    const registrations = await all(
      `SELECT r.id, r.status, r.registered_at, u.full_name, u.email, u.roll_number, u.department
       FROM event_registrations r JOIN users u ON r.user_id = u.id
       WHERE r.event_id = ? ORDER BY r.registered_at ASC`,
      [eventId]
    );

    return res.status(200).json({ success: true, registrations });
  } catch (err) {
    next(err);
  }
};

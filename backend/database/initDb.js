const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { run, get } = require('../config/db');

async function initializeDatabase() {
  try {
    console.log('Initializing Database Schema...');
    
    // Read and run schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute SQL statements split by semicolon
    const statements = schemaSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const stmt of statements) {
      await run(stmt);
    }

    console.log('Database Schema created successfully.');

    // Seed Data Setup
    const adminCheck = await get('SELECT * FROM users WHERE role = ?', ['admin']);
    if (!adminCheck) {
      console.log('Seeding Initial Data...');
      
      const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
      const studentPasswordHash = await bcrypt.hash('StudentPass123!', 10);

      // Insert Admin User
      const adminRes = await run(
        `INSERT INTO users (full_name, email, password, role, phone, department) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['System Administrator', 'admin@university.edu', adminPasswordHash, 'admin', '9876543210', 'Administration']
      );
      const adminId = adminRes.lastID;

      // Insert Sample Students
      const student1Res = await run(
        `INSERT INTO users (full_name, email, password, role, roll_number, department, year, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Rahul Sharma', 'rahul@student.edu', studentPasswordHash, 'student', '2023CS101', 'Computer Science', '3rd Year', '9876543211']
      );

      const student2Res = await run(
        `INSERT INTO users (full_name, email, password, role, roll_number, department, year, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Ananya Verma', 'ananya@student.edu', studentPasswordHash, 'student', '2023EC102', 'Electronics', '2nd Year', '9876543212']
      );

      const student3Res = await run(
        `INSERT INTO users (full_name, email, password, role, roll_number, department, year, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Aarav Patel', 'aarav@student.edu', studentPasswordHash, 'student', '2022ME103', 'Mechanical', '4th Year', '9876543213']
      );

      // Insert Sample Clubs
      const club1 = await run(
        `INSERT INTO clubs (name, code, description, category, faculty_coordinator, club_lead_id, contact_email, contact_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Coding & Algorithms Club',
          'CODING',
          'Empowering students with competitive programming, web development, and open-source software contributions.',
          'Technology',
          'Dr. K. S. Raman',
          student1Res.lastID,
          'codingclub@university.edu',
          '040-23456789'
        ]
      );

      const club2 = await run(
        `INSERT INTO clubs (name, code, description, category, faculty_coordinator, club_lead_id, contact_email, contact_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Photography & Fine Arts Society',
          'PHOTO',
          'A creative sanctuary for visual storytelling, digital photography, design, and fine arts.',
          'Arts & Culture',
          'Prof. M. Anita',
          student3Res.lastID,
          'photography@university.edu',
          '040-23456790'
        ]
      );

      // Add Memberships
      await run(
        `INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)`,
        [club1.lastID, student1Res.lastID, 'Club Lead']
      );
      await run(
        `INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)`,
        [club2.lastID, student3Res.lastID, 'Club Lead']
      );

      // Insert Sample Events
      await run(
        `INSERT INTO events (title, description, event_type, scope, club_id, event_date, start_time, end_time, venue, max_participants, registration_deadline, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'Annual University Hackathon 2026',
          '36-hour intense hackathon to build SaaS, AI, and IoT solutions for real-world campus problems.',
          'Technical',
          'global',
          null,
          '2026-09-15',
          '09:00',
          '21:00',
          'Main Auditorium',
          150,
          '2026-09-10 23:59:59',
          'registration_open',
          adminId
        ]
      );

      await run(
        `INSERT INTO events (title, description, event_type, scope, club_id, event_date, start_time, end_time, venue, max_participants, registration_deadline, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'AI & ML Hands-on Workshop',
          'Learn modern deep learning frameworks, Model deployment, and prompt engineering hands-on.',
          'Workshop',
          'club',
          club1.lastID,
          '2026-09-20',
          '14:00',
          '17:00',
          'CS Lab 3',
          50,
          '2026-09-18 23:59:59',
          'upcoming',
          student1Res.lastID
        ]
      );

      // Insert Sample Announcements
      await run(
        `INSERT INTO announcements (title, content, scope, priority, published_by)
         VALUES (?, ?, ?, ?, ?)`,
        [
          'Welcome to Fall 2026 Club Registrations!',
          'All official student clubs are now accepting membership applications. Browse clubs and apply directly from your dashboard.',
          'global',
          'urgent',
          adminId
        ]
      );

      // Activity log
      await run(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
         VALUES (?, ?, ?, ?, ?)`,
        [adminId, 'INITIALIZE', 'SYSTEM', 1, 'System database seeded with initial administrator, students, and clubs.']
      );

      console.log('Initial Database Seed Completed Successfully.');
      console.log('--- DEFAULT CREDENTIALS ---');
      console.log('Admin Email: admin@university.edu | Password: AdminPass123!');
      console.log('Student Email: rahul@student.edu  | Password: StudentPass123!');
      console.log('---------------------------');
    }
  } catch (err) {
    console.error('Database Initialization Failed:', err);
  }
}

module.exports = initializeDatabase;
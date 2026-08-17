-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'student')) DEFAULT 'student',
    roll_number TEXT UNIQUE,
    department TEXT,
    year TEXT,
    phone TEXT,
    profile_pic TEXT,
    status TEXT CHECK(status IN ('active', 'disabled')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Clubs Table
CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    logo TEXT,
    faculty_coordinator TEXT NOT NULL,
    club_lead_id INTEGER,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_lead_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Club Members Table
CREATE TABLE IF NOT EXISTS club_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'Member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, user_id),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Membership Requests Table
CREATE TABLE IF NOT EXISTS membership_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Events Table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_type TEXT NOT NULL,
    scope TEXT CHECK(scope IN ('global', 'club')) DEFAULT 'club',
    club_id INTEGER,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT NOT NULL,
    max_participants INTEGER DEFAULT 0,
    registration_deadline DATETIME NOT NULL,
    image TEXT,
    status TEXT CHECK(status IN ('draft', 'upcoming', 'registration_open', 'registration_closed', 'completed', 'cancelled')) DEFAULT 'upcoming',
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Event Registrations Table
CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('registered', 'cancelled', 'attended')) DEFAULT 'registered',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    scope TEXT CHECK(scope IN ('global', 'club')) DEFAULT 'global',
    club_id INTEGER,
    priority TEXT CHECK(priority IN ('normal', 'important', 'urgent')) DEFAULT 'normal',
    published_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Password Resets Table
CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    description TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_roll ON users(roll_number);
CREATE INDEX IF NOT EXISTS idx_membership_req ON membership_requests(user_id, club_id);
CREATE INDEX IF NOT EXISTS idx_event_reg ON event_registrations(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
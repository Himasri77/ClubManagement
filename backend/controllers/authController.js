const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../config/db');

// Register Controller
exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, role, department, student_id, roll_number } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Full Name, Email, and Password are required.' 
      });
    }

    // Force lowercasing and trim whitespace
    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate user
    const existingUser = await get('SELECT id FROM users WHERE lower(email) = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email address already exists.' 
      });
    }

    // Hash password with 10 salt rounds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    const userRole = (role === 'admin' || role === 'student') ? role : 'student';
    const assignedDept = department ? department.trim() : null;
    const assignedId = student_id || roll_number || null;

    // Save into database
    const result = await run(
      `INSERT INTO users (full_name, email, password, role, department, student_id, roll_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name.trim(), cleanEmail, hashedPassword, userRole, assignedDept, assignedId, assignedId]
    );

    // Create JWT
    const token = jwt.sign(
      { id: result.lastID, role: userRole },
      process.env.JWT_SECRET || 'super_secret_jwt_key_123',
      { expiresIn: '7d' }
    );

    const user = {
      id: result.lastID,
      full_name: full_name.trim(),
      email: cleanEmail,
      role: userRole,
      department: assignedDept,
      student_id: assignedId,
      roll_number: assignedId
    };

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: err.message || 'Server error during registration.' 
    });
  }
};

// Login Controller
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required.' 
      });
    }

    // Force lowercasing and trim whitespace
    const cleanEmail = email.toLowerCase().trim();

    // Fetch user record
    const user = await get('SELECT * FROM users WHERE lower(email) = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials. User not found.' 
      });
    }

    // Compare plain password with stored hash
    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials. Incorrect password.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'super_secret_jwt_key_123',
      { expiresIn: '7d' }
    );

    delete user.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during login.' 
    });
  }
};
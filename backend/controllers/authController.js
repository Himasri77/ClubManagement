const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { run, get } = require('../config/db');
const { sendOTPEmail } = require('../utils/mailer');

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// Register Controller
exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, role, department, roll_number, year, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Full Name, Email, and Password are required.' 
      });
    }

    // Force lowercasing and trim whitespace
    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate user (email)
    const existingUser = await get('SELECT id FROM users WHERE lower(email) = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email address already exists.' 
      });
    }

    const userRole = (role === 'admin' || role === 'student') ? role : 'student';
    const assignedRollNumber = roll_number ? roll_number.trim() : null;

    // roll_number is UNIQUE in the schema — check separately so we can return
    // a clear message instead of a raw SQLITE_CONSTRAINT error
    if (assignedRollNumber) {
      const existingRoll = await get('SELECT id FROM users WHERE roll_number = ?', [assignedRollNumber]);
      if (existingRoll) {
        return res.status(400).json({
          success: false,
          message: 'An account with this roll number already exists.'
        });
      }
    }

    // Hash password with 10 salt rounds
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    const assignedDept = department ? department.trim() : null;
    const assignedYear = year ? year.trim() : null;
    const assignedPhone = phone ? phone.trim() : null;

    // Save into database
    const result = await run(
      `INSERT INTO users (full_name, email, password, role, roll_number, department, year, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name.trim(), cleanEmail, hashedPassword, userRole, assignedRollNumber, assignedDept, assignedYear, assignedPhone]
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
      roll_number: assignedRollNumber,
      department: assignedDept,
      year: assignedYear,
      phone: assignedPhone
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

// Forgot Password — Step 1: request an OTP
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    const cleanEmail = email.toLowerCase().trim();

    const user = await get('SELECT id, email FROM users WHERE lower(email) = ?', [cleanEmail]);

    // Always respond the same way whether or not the account exists —
    // this avoids leaking which emails are registered.
    const genericResponse = {
      success: true,
      message: 'If an account exists with that email, a password reset OTP has been sent.'
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Invalidate any previous unused OTPs for this email
    await run('DELETE FROM password_resets WHERE email = ?', [cleanEmail]);

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    await run(
      'INSERT INTO password_resets (email, otp_hash, expires_at) VALUES (?, ?, ?)',
      [cleanEmail, otpHash, expiresAt]
    );

    const emailSent = await sendOTPEmail(cleanEmail, otp);

    // If SMTP isn't configured, surface the OTP directly in the response
    // so the flow is fully testable in local development without email setup.
    if (!emailSent) {
      genericResponse.dev_otp_note = `Email sending is not configured on this server. For local testing, your OTP is: ${otp} (expires in ${OTP_EXPIRY_MINUTES} minutes).`;
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    next(err);
  }
};

// Forgot Password — Step 2: verify OTP and set a new password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, new_password, confirm_password } = req.body;

    if (!email || !otp || !new_password || !confirm_password) {
      return res.status(400).json({ success: false, message: 'Email, OTP, new password, and confirmation are all required.' });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const resetRow = await get(
      'SELECT * FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [cleanEmail]
    );

    if (!resetRow) {
      return res.status(400).json({ success: false, message: 'No pending reset request found. Please request a new OTP.' });
    }
    if (new Date() > new Date(resetRow.expires_at)) {
      await run('DELETE FROM password_resets WHERE id = ?', [resetRow.id]);
      return res.status(400).json({ success: false, message: 'This OTP has expired. Please request a new one.' });
    }
    if (resetRow.attempts >= MAX_OTP_ATTEMPTS) {
      await run('DELETE FROM password_resets WHERE id = ?', [resetRow.id]);
      return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    const otpMatches = await bcrypt.compare(otp.trim(), resetRow.otp_hash);
    if (!otpMatches) {
      await run('UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?', [resetRow.id]);
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    const user = await get('SELECT id FROM users WHERE lower(email) = ?', [cleanEmail]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    const hashedPassword = await bcrypt.hash(new_password.trim(), 10);
    await run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    // OTP is single-use
    await run('DELETE FROM password_resets WHERE id = ?', [resetRow.id]);

    return res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    next(err);
  }
};
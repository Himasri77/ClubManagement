const nodemailer = require('nodemailer');

// Returns a configured transporter, or null if SMTP env vars aren't set.
// This lets the app run fully offline in local dev (OTP shown on-screen
// instead of emailed) while still supporting real email once configured.
function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

// Returns true if an email was actually sent, false if SMTP isn't configured
// (caller should fall back to showing the OTP on-screen in that case).
async function sendOTPEmail(toEmail, otp) {
  const transporter = getTransporter();
  if (!transporter) {
    return false;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: 'Your Club Portal Password Reset OTP',
    text: `Your OTP is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p><p>If you did not request this, ignore this email.</p>`
  });
  return true;
}

module.exports = { sendOTPEmail };

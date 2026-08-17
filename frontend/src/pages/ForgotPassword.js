import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP + New Pass
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devNote, setDevNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
      if (res.data.dev_otp_note) {
        setDevNote(res.data.dev_otp_note);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setMessage(res.data.message);
      setStep(3); // Success
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: '#eff6ff', borderRadius: '12px', color: '#2563eb', marginBottom: '12px' }}>
            <KeyRound size={28} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>Reset Password</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Securely reset your campus portal credentials</p>
        </div>

        {error && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}
        {message && <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' }}>{message}</div>}
        {devNote && <div style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>{devNote}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Email Address</label>
              <input
                type="email"
                required
                placeholder="your.email@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: '600' }}>
              {loading ? 'Generating OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>6-Digit OTP</label>
              <input type="text" required placeholder="123456" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>New Password</label>
              <input type="password" required placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>Confirm New Password</label>
              <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', padding: '12px', borderRadius: '8px', fontWeight: '600' }}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={48} color="#10b981" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '15px', color: '#334155', fontWeight: '600' }}>Your password has been successfully updated.</p>
            <Link to="/login" style={{ display: 'inline-block', marginTop: '16px', backgroundColor: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
              Proceed to Sign In
            </Link>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
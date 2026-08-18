import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.user, res.data.token);
        if (res.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: '#eff6ff', borderRadius: '12px', color: '#2563eb', marginBottom: '12px' }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>Campus Club Portal</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Sign in to access your clubs, events & activities</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="email"
                required
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 38px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', padding: 0 }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', color: '#2563eb', fontWeight: '500' }}>Forgot Password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', fontSize: '14px', color: '#64748b' }}>
          Don't have an account? <Link to="/register" style={{ color: '#2563eb', fontWeight: '600' }}>Register Student Account</Link>
        </div>
      </div>
    </div>
  );
}
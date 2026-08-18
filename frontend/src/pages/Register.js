import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    roll_number: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        login(res.data.user, res.data.token);
        // Redirect based on the registered role
        if (res.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '440px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Create Account</h2>
        <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>Register as a Student or Administrator.</p>

        {error && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role Selection Dropdown */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Register As *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: '500' }}
            >
              <option value="student">Student</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Full Name *</label>
            <input type="text" required placeholder="Full Name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Email Address *</label>
            <input type="email" required placeholder="name@university.edu" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Password *</label>
            <input type="password" required placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: formData.role === 'student' ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Department</label>
              <input type="text" placeholder="CSE / ECE / Management" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>

            {formData.role === 'student' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Roll Number</label>
                <input type="text" placeholder="23B01A42..." value={formData.roll_number} onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', padding: '10px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>
            {loading ? 'Creating Account...' : `Register as ${formData.role === 'admin' ? 'Admin' : 'Student'}`}
          </button>
        </form>

        <p style={{ textAlign: 'center', margin: '20px 0 0 0', fontSize: '14px', color: '#64748b' }}>
          Already have an account? <Link to="/login" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>Log In</Link>
        </p>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' };

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
    <AuthLayout title="Create your account" subtitle="Register as a Student or Administrator">
      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Register As *</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="input-field"
            style={{ ...inputStyle, backgroundColor: '#fff', fontWeight: '500' }}
          >
            <option value="student">Student</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Full Name *</label>
          <input type="text" required placeholder="Full Name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="input-field" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Email Address *</label>
          <input type="email" required placeholder="name@university.edu" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" style={inputStyle} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Password *</label>
          <input type="password" required placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: formData.role === 'student' ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '22px' }}>
          <div>
            <label style={labelStyle}>Department</label>
            <input type="text" placeholder="CSE / ECE / Management" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="input-field" style={inputStyle} />
          </div>

          {formData.role === 'student' && (
            <div>
              <label style={labelStyle}>Roll Number</label>
              <input type="text" placeholder="23B01A42..." value={formData.roll_number} onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })} className="input-field" style={inputStyle} />
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
          <UserPlus size={17} />
          {loading ? 'Creating Account...' : `Register as ${formData.role === 'admin' ? 'Admin' : 'Student'}`}
        </button>
      </form>

      <p style={{ textAlign: 'center', margin: '22px 0 0 0', fontSize: '14px', color: '#64748b' }}>
        Already have an account? <Link to="/login" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>Log In</Link>
      </p>
    </AuthLayout>
  );
}

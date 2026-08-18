import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Layers, Users, Clock, UserCheck, Activity } from 'lucide-react';

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#64748b' }}>{label}</div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        if (res.data.success) {
          setStats(res.data.stats);
          setActivity(res.data.recent_activity);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading dashboard...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Admin Overview Dashboard</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
          Manage all club submissions, approvals, events and memberships.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard icon={<Layers size={22} color="#2563eb" />} label="Active Clubs" value={stats.total_clubs} color="#2563eb" />
        <StatCard icon={<Users size={22} color="#16a34a" />} label="Registered Students" value={stats.total_students} color="#16a34a" />
        <Link to="/admin/approvals" style={{ textDecoration: 'none' }}>
          <StatCard icon={<Clock size={22} color="#d97706" />} label="Pending Approvals" value={stats.pending_requests} color="#d97706" />
        </Link>
        <StatCard icon={<UserCheck size={22} color="#7c3aed" />} label="Total Memberships" value={stats.total_memberships} color="#7c3aed" />
      </div>

      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Activity size={18} color="#334155" />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Recent Activity</h3>
        </div>
        {activity.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>No activity recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: i < activity.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: '8px' }}>
                <span style={{ color: '#334155' }}>{a.description}</span>
                <span style={{ color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  {new Date(a.timestamp + 'Z').toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
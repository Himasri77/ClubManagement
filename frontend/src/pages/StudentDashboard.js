import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Layers, Clock, Bell, ArrowRight } from 'lucide-react';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/student');
        if (res.data.success) {
          setData(res.data);
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
        <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Student Home Dashboard</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
          Welcome back! Browse campus clubs and register for upcoming events.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#2563eb' }}>{data.stats.clubs_joined}</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Clubs Joined</div>
        </div>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#d97706' }}>{data.stats.pending_requests}</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Pending Requests</div>
        </div>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#7c3aed' }}>{data.stats.unread_notifications}</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Unread Notifications</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* My Clubs */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>My Clubs</h3>
            </div>
            <Link to="/student/clubs" style={{ fontSize: '12px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
              Browse all <ArrowRight size={12} />
            </Link>
          </div>
          {data.my_clubs.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>You haven't joined any clubs yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.my_clubs.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{c.name}</span>
                  <span style={{ color: '#64748b' }}>{c.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Bell size={18} color="#7c3aed" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Recent Notifications</h3>
          </div>
          {data.notifications.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>No notifications yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.notifications.map((n) => (
                <div key={n.id} style={{ fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <div style={{ fontWeight: n.is_read ? '400' : '700', color: '#0f172a' }}>{n.title}</div>
                  <div style={{ color: '#64748b' }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.pending_requests.length > 0 && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px 20px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} color="#92400e" />
          <span style={{ fontSize: '13px', color: '#92400e' }}>
            You have {data.pending_requests.length} pending club request{data.pending_requests.length > 1 ? 's' : ''} awaiting review.
          </span>
        </div>
      )}
    </div>
  );
}
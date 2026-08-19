import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { X, CheckCircle, Circle, Mail } from 'lucide-react';

export default function RegistrantsModal({ event, onClose }) {
  const [registrants, setRegistrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchRegistrants = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${event.id}/registrations`);
      if (res.data.success) {
        setRegistrants(res.data.registrations.filter((r) => r.status !== 'cancelled'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const toggleAttendance = async (reg) => {
    setBusyId(reg.id);
    const nowAttended = reg.status !== 'attended';
    try {
      await api.patch(`/events/${event.id}/registrations/${reg.id}/attendance`, { attended: nowAttended });
      setRegistrants((prev) =>
        prev.map((r) => (r.id === reg.id ? { ...r, status: nowAttended ? 'attended' : 'registered' } : r))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update attendance.');
    } finally {
      setBusyId(null);
    }
  };

  const attendedCount = registrants.filter((r) => r.status === 'attended').length;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{event.title}</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              {registrants.length} registered &middot; {attendedCount} attended
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>Loading registrants...</div>
          ) : registrants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>No registrants yet.</div>
          ) : (
            registrants.map((r) => (
              <div
                key={r.id}
                onClick={() => toggleAttendance(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px',
                  cursor: busyId === r.id ? 'wait' : 'pointer', opacity: busyId === r.id ? 0.6 : 1,
                  borderBottom: '1px solid #f8fafc'
                }}
              >
                {r.status === 'attended' ? (
                  <CheckCircle size={18} color="#16a34a" />
                ) : (
                  <Circle size={18} color="#cbd5e1" />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{r.full_name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={10} /> {r.email} {r.department ? `• ${r.department}` : ''}
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px',
                  backgroundColor: r.status === 'attended' ? '#dcfce7' : '#f1f5f9',
                  color: r.status === 'attended' ? '#166534' : '#64748b'
                }}>
                  {r.status}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#94a3b8' }}>
          Click a registrant to toggle attended / not attended.
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Megaphone, AlertTriangle, Plus, Trash2, Layers } from 'lucide-react';

const PRIORITY_STYLE = {
  urgent: { bg: '#fef2f2', border: '#fecaca', badge: '#dc2626', badgeBg: '#fee2e2' },
  important: { bg: '#fffbeb', border: '#fde68a', badge: '#d97706', badgeBg: '#fef3c7' },
  normal: { bg: '#fff', border: '#e2e8f0', badge: '#64748b', badgeBg: '#f1f5f9' }
};

export default function Announcements() {
  const { activeRole, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '', content: '', scope: 'global', club_id: '', priority: 'normal', expiry_date: ''
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      if (res.data.success) setAnnouncements(res.data.announcements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const res = await api.get('/clubs');
      if (res.data.success) setClubs(res.data.clubs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchClubs();
  }, []);

  const manageableClubs = activeRole === 'admin' ? clubs : clubs.filter((c) => user && c.club_lead_id === user.id);
  const canPost = activeRole === 'admin' || manageableClubs.length > 0;

  const canDelete = (a) => {
    if (activeRole === 'admin') return true;
    if (!a.club_id) return false;
    const club = clubs.find((c) => c.id === a.club_id);
    return club && user && club.club_lead_id === user.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { ...formData, club_id: formData.scope === 'global' ? null : formData.club_id, expiry_date: formData.expiry_date || null };
      await api.post('/announcements', payload);
      setShowModal(false);
      setFormData({ title: '', content: '', scope: 'global', club_id: '', priority: 'normal', expiry_date: '' });
      fetchAnnouncements();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to post announcement.');
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Announcements</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Campus-wide and club updates.</p>
        </div>
        {canPost && (
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Post Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          No announcements yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {announcements.map((a) => {
            const style = PRIORITY_STYLE[a.priority] || PRIORITY_STYLE.normal;
            return (
              <div key={a.id} style={{ backgroundColor: style.bg, border: `1px solid ${style.border}`, borderRadius: '10px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      {a.priority === 'urgent' ? <AlertTriangle size={16} color={style.badge} /> : <Megaphone size={16} color={style.badge} />}
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{a.title}</h3>
                      <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: style.badge, backgroundColor: style.badgeBg, padding: '2px 8px', borderRadius: '4px' }}>
                        {a.priority}
                      </span>
                      {a.scope === 'club' && (
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Layers size={12} /> {a.club_name}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>{a.content}</p>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      By {a.published_by_name || 'Admin'} • {new Date(a.created_at + 'Z').toLocaleString()}
                      {a.expiry_date && ` • Expires ${a.expiry_date}`}
                    </div>
                  </div>
                  {canDelete(a) && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deletingId === a.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                      title="Delete announcement"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Post Announcement</h3>

            {formError && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Content *</label>
                <textarea required rows={4} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Scope *</label>
                  <select value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value, club_id: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                    {activeRole === 'admin' && <option value="global">Global (All Students)</option>}
                    <option value="club">Club Announcement</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {formData.scope === 'club' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Club *</label>
                  <select required value={formData.club_id} onChange={(e) => setFormData({ ...formData, club_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                    <option value="">Select a club...</option>
                    {manageableClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Expiry Date (optional)</label>
                <input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

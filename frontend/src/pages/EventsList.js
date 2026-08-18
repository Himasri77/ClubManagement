import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Users, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

const EVENT_TYPES = ['Workshop', 'Seminar', 'Competition', 'Cultural', 'Sports', 'Social'];

export default function EventsList() {
  const { activeRole, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionMsg, setActionMsg] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '', description: '', event_type: 'Workshop', scope: 'club', club_id: '',
    event_date: '', start_time: '', end_time: '', venue: '',
    max_participants: 0, registration_deadline: ''
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      if (res.data.success) setEvents(res.data.events);
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
    fetchEvents();
    fetchClubs();
  }, []);

  // Clubs this user is allowed to create events for: admin sees all,
  // a student sees only clubs where they're the lead
  const manageableClubs = activeRole === 'admin' ? clubs : clubs.filter((c) => user && c.club_lead_id === user.id);
  const canCreateEvent = activeRole === 'admin' || manageableClubs.length > 0;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { ...formData, club_id: formData.scope === 'global' ? null : formData.club_id };
      await api.post('/events', payload);
      setShowModal(false);
      setFormData({ title: '', description: '', event_type: 'Workshop', scope: 'club', club_id: '', event_date: '', start_time: '', end_time: '', venue: '', max_participants: 0, registration_deadline: '' });
      fetchEvents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create event.');
    }
  };

  const handleRegister = async (eventId) => {
    setProcessingId(eventId);
    setActionMsg((prev) => ({ ...prev, [eventId]: '' }));
    try {
      const res = await api.post(`/events/${eventId}/register`);
      setActionMsg((prev) => ({ ...prev, [eventId]: res.data.message }));
      fetchEvents();
    } catch (err) {
      setActionMsg((prev) => ({ ...prev, [eventId]: err.response?.data?.message || 'Failed to register.' }));
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (eventId) => {
    setProcessingId(eventId);
    setActionMsg((prev) => ({ ...prev, [eventId]: '' }));
    try {
      const res = await api.post(`/events/${eventId}/cancel`);
      setActionMsg((prev) => ({ ...prev, [eventId]: res.data.message }));
      fetchEvents();
    } catch (err) {
      setActionMsg((prev) => ({ ...prev, [eventId]: err.response?.data?.message || 'Failed to cancel.' }));
    } finally {
      setProcessingId(null);
    }
  };

  const isPastDeadline = (event) => new Date() > new Date(event.registration_deadline);
  const isFull = (event) => event.max_participants > 0 && event.registered_count >= event.max_participants;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Events</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Campus workshops, competitions, and club activities.</p>
        </div>
        {canCreateEvent && (
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Create Event
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          No events yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {events.map((event) => (
            <div key={event.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
                  {event.event_type}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{event.scope === 'global' ? 'Global' : event.club_name}</span>
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a' }}>{event.title}</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{event.description}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#334155', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="#94a3b8" /> {event.event_date} • {event.start_time}–{event.end_time}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#94a3b8" /> {event.venue}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="#94a3b8" /> {event.registered_count} registered{event.max_participants > 0 ? ` / ${event.max_participants} max` : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="#94a3b8" /> Register by {new Date(event.registration_deadline).toLocaleString()}
                </div>
              </div>

              {activeRole === 'student' && (
                <>
                  {event.is_registered ? (
                    <button
                      onClick={() => handleCancel(event.id)}
                      disabled={processingId === event.id}
                      style={{ width: '100%', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <XCircle size={14} /> Cancel Registration
                    </button>
                  ) : isPastDeadline(event) ? (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '8px' }}>Registration closed</div>
                  ) : isFull(event) ? (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '8px' }}>Event full</div>
                  ) : (
                    <button
                      onClick={() => handleRegister(event.id)}
                      disabled={processingId === event.id}
                      style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <CheckCircle size={14} /> {processingId === event.id ? 'Registering...' : 'Register'}
                    </button>
                  )}
                  {actionMsg[event.id] && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>{actionMsg[event.id]}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Create Event</h3>

            {formError && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{formError}</div>}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description *</label>
                <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Event Type *</label>
                  <select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Scope *</label>
                  <select value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value, club_id: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                    <option value="club">Club Event</option>
                    {activeRole === 'admin' && <option value="global">Global (All Students)</option>}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Date *</label>
                  <input type="date" required value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Start Time *</label>
                  <input type="time" required value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>End Time *</label>
                  <input type="time" required value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Venue *</label>
                <input type="text" required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Max Participants (0 = unlimited)</label>
                  <input type="number" min="0" value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Registration Deadline *</label>
                  <input type="datetime-local" required value={formData.registration_deadline} onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

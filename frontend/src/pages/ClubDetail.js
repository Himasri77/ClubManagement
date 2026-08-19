import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Users, Mail, Phone, User, Calendar, MapPin,
  Megaphone, CheckCircle, Clock, UserPlus, Crown, Shield
} from 'lucide-react';

const CATEGORY_COLORS = {
  Technical: { bg: '#eff6ff', text: '#2563eb' },
  Cultural: { bg: '#fdf2f8', text: '#db2777' },
  Sports: { bg: '#f0fdf4', text: '#16a34a' },
  Literary: { bg: '#fefce8', text: '#ca8a04' },
  'Social Service': { bg: '#fff7ed', text: '#ea580c' },
};

function Avatar({ name, size = 40 }) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', backgroundColor: '#dbeafe',
        color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: size * 0.4, flexShrink: 0
      }}
    >
      {initials}
    </div>
  );
}

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeRole, user } = useAuth();

  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('about');
  const [joinMsg, setJoinMsg] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [clubRes, membersRes, eventsRes, announcementsRes] = await Promise.all([
        api.get(`/clubs/${id}`),
        api.get(`/clubs/${id}/members`),
        api.get('/events', { params: { club_id: id, upcoming: 'true' } }),
        api.get('/announcements', { params: { club_id: id } }),
      ]);
      if (clubRes.data.success) setClub(clubRes.data.club);
      if (membersRes.data.success) setMembers(membersRes.data.members);
      if (eventsRes.data.success) setEvents(eventsRes.data.events);
      if (announcementsRes.data.success) setAnnouncements(announcementsRes.data.announcements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isMember = user && members.some((m) => m.user_id === user.id);

  const handleJoin = async () => {
    setJoining(true);
    setJoinMsg('');
    try {
      const res = await api.post(`/clubs/${id}/join`);
      setJoinMsg(res.data.message);
      fetchAll();
    } catch (err) {
      setJoinMsg(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading club profile...</div>;
  }

  if (!club) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
        Club not found.
        <div style={{ marginTop: '16px' }}>
          <button onClick={() => navigate(-1)} style={backLinkStyle}>Go back</button>
        </div>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[club.category] || { bg: '#f1f5f9', text: '#475569' };

  return (
    <div>
      <button onClick={() => navigate(-1)} style={backLinkStyle}>
        <ArrowLeft size={16} /> Back to Clubs
      </button>

      {/* Banner / header */}
      <div style={{
        background: `linear-gradient(135deg, ${catColor.text} 0%, #0f172a 130%)`,
        borderRadius: '16px', padding: '32px', color: '#fff', marginTop: '16px', marginBottom: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px'
      }}>
        <div>
          <span style={{
            backgroundColor: 'rgba(255,255,255,0.18)', padding: '4px 12px', borderRadius: '12px',
            fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            {club.category}
          </span>
          <h1 style={{ margin: '12px 0 6px 0', fontSize: '30px' }}>{club.name}</h1>
          <div style={{ display: 'flex', gap: '18px', fontSize: '14px', opacity: 0.9, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} /> {club.member_count} Members
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} /> Led by {club.lead_name || 'Unassigned'}
            </span>
            <span style={{
              padding: '2px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', backgroundColor: club.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'
            }}>
              {club.status}
            </span>
          </div>
        </div>

        {activeRole === 'student' && (
          <div style={{ textAlign: 'right' }}>
            {isMember ? (
              <div style={pillStyle('rgba(34,197,94,0.2)', '#fff')}>
                <CheckCircle size={16} /> You're a Member
              </div>
            ) : (
              <button onClick={handleJoin} disabled={joining} style={joinBtnStyle}>
                <UserPlus size={16} /> {joining ? 'Sending...' : 'Join Club'}
              </button>
            )}
            {joinMsg && <div style={{ fontSize: '12px', marginTop: '8px', maxWidth: '220px' }}>{joinMsg}</div>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        {[
          { key: 'about', label: 'About' },
          { key: 'members', label: `Members (${members.length})` },
          { key: 'events', label: `Upcoming Events (${events.length})` },
          { key: 'announcements', label: `Announcements (${announcements.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 600,
              color: tab === t.key ? '#2563eb' : '#64748b',
              borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'about' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div style={cardStyle}>
            <h3 style={sectionTitleStyle}>About the Club</h3>
            <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '14px' }}>{club.description}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={sectionTitleStyle}>Contact Info</h3>
            <InfoRow icon={<User size={15} />} label="Faculty Coordinator" value={club.faculty_coordinator} />
            <InfoRow icon={<Mail size={15} />} label="Email" value={club.contact_email} />
            {club.contact_phone && <InfoRow icon={<Phone size={15} />} label="Phone" value={club.contact_phone} />}
            <InfoRow icon={<Crown size={15} />} label="Club Lead" value={club.lead_name || 'Unassigned'} />
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div style={cardStyle}>
          {members.length === 0 ? (
            <EmptyState text="No members have joined this club yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {members.map((m) => (
                <div key={m.membership_id} style={memberRowStyle}>
                  <Avatar name={m.full_name} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {m.full_name}
                      {m.role === 'Club Lead' && <Shield size={13} color="#2563eb" />}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {m.department || 'Dept N/A'} {m.year ? `• Year ${m.year}` : ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '10px',
                    backgroundColor: m.role === 'Club Lead' ? '#eff6ff' : '#f1f5f9',
                    color: m.role === 'Club Lead' ? '#2563eb' : '#475569'
                  }}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'events' && (
        <div style={cardStyle}>
          {events.length === 0 ? (
            <EmptyState text="No upcoming events scheduled for this club." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map((e) => (
                <div key={e.id} style={eventRowStyle}>
                  <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '13px', minWidth: '90px' }}>
                    <Calendar size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                    {new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{e.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '10px', marginTop: '2px' }}>
                      <span><MapPin size={11} style={{ verticalAlign: '-1px' }} /> {e.venue}</span>
                      <span><Users size={11} style={{ verticalAlign: '-1px' }} /> {e.registered_count} registered</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'announcements' && (
        <div style={cardStyle}>
          {announcements.length === 0 ? (
            <EmptyState text="No announcements posted by this club yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map((a) => (
                <div key={a.id} style={announcementRowStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Megaphone size={14} color="#2563eb" /> {a.title}
                    </span>
                    {a.priority !== 'normal' && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                        textTransform: 'uppercase',
                        backgroundColor: a.priority === 'urgent' ? '#fee2e2' : '#fef3c7',
                        color: a.priority === 'urgent' ? '#991b1b' : '#92400e'
                      }}>
                        {a.priority}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0' }}>{a.content}</p>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    <Clock size={11} style={{ verticalAlign: '-1px' }} /> {new Date(a.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', fontSize: '13px' }}>
      <div style={{ color: '#94a3b8', marginTop: '2px' }}>{icon}</div>
      <div>
        <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
        <div style={{ color: '#0f172a', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '14px' }}>{text}</div>;
}

const backLinkStyle = {
  display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
  color: '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '4px 0'
};

const cardStyle = {
  backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px'
};

const sectionTitleStyle = {
  margin: '0 0 14px 0', fontSize: '15px', color: '#0f172a', fontWeight: 700
};

const memberRowStyle = {
  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 4px', borderBottom: '1px solid #f1f5f9'
};

const eventRowStyle = {
  display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px'
};

const announcementRowStyle = {
  padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #2563eb'
};

const pillStyle = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: bg, color,
  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700
});

const joinBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', color: '#2563eb',
  border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
};
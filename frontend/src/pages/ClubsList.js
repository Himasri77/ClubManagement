import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Layers, Search, Plus, CheckCircle, XCircle, Users, Clock, UserPlus, Eye } from 'lucide-react';

export default function ClubsList() {
  const { activeRole, user } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [joinMsg, setJoinMsg] = useState({});
  const [joiningId, setJoiningId] = useState(null);
  const [editingClub, setEditingClub] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [editMsg, setEditMsg] = useState({ error: '', success: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Technical',
    description: '',
    faculty_coordinator: '',
    contact_email: ''
  });
  const [formMsg, setFormMsg] = useState({ error: '', success: '' });

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clubs', {
        params: { search, category, status: activeRole === 'admin' ? '' : 'active' }
      });
      if (res.data.success) {
        setClubs(res.data.clubs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [search, category, activeRole]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormMsg({ error: '', success: '' });

    try {
      const res = await api.post('/clubs', formData);
      setFormMsg({ error: '', success: res.data.message });
      setFormData({ name: '', code: '', category: 'Technical', description: '', faculty_coordinator: '', contact_email: '' });
      fetchClubs();
      setTimeout(() => setShowModal(false), 1500);
    } catch (err) {
      setFormMsg({ error: err.response?.data?.message || 'Action failed.', success: '' });
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/clubs/${id}/status`, { status });
      fetchClubs();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleJoin = async (clubId) => {
    setJoiningId(clubId);
    setJoinMsg((prev) => ({ ...prev, [clubId]: '' }));
    try {
      const res = await api.post(`/clubs/${clubId}/join`);
      setJoinMsg((prev) => ({ ...prev, [clubId]: res.data.message }));
      fetchClubs();
    } catch (err) {
      setJoinMsg((prev) => ({ ...prev, [clubId]: err.response?.data?.message || 'Failed to send request.' }));
    } finally {
      setJoiningId(null);
    }
  };

  // Admins can edit any club; a club's own lead can edit theirs — mirrors
  // the permission check already enforced server-side in updateClub.
  const canEdit = (club) => activeRole === 'admin' || (user && club.club_lead_id === user.id);

  const openEditModal = (club) => {
    setEditingClub(club);
    setEditMsg({ error: '', success: '' });
    setEditFormData({
      name: club.name || '',
      category: club.category || 'Technical',
      description: club.description || '',
      faculty_coordinator: club.faculty_coordinator || '',
      contact_email: club.contact_email || '',
      contact_phone: club.contact_phone || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditMsg({ error: '', success: '' });
    try {
      const res = await api.put(`/clubs/${editingClub.id}`, editFormData);
      setEditMsg({ error: '', success: res.data.message });
      fetchClubs();
      setTimeout(() => {
        setEditingClub(null);
        setEditFormData(null);
      }, 1200);
    } catch (err) {
      setEditMsg({ error: err.response?.data?.message || 'Failed to update club.', success: '' });
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Campus Clubs & Societies</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Discover active campus societies, request new clubs, and join communities.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          {activeRole === 'admin' ? 'Create New Club' : 'Propose New Club'}
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search clubs by name or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}
        >
          <option value="">All Categories</option>
          <option value="Technical">Technical</option>
          <option value="Cultural">Cultural</option>
          <option value="Sports">Sports</option>
          <option value="Literary">Literary</option>
          <option value="Social Service">Social Service</option>
        </select>
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading clubs directory...</div>
      ) : clubs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          No clubs found matching your criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {clubs.map((club) => (
            <div key={club.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                    {club.category}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    backgroundColor: club.status === 'active' ? '#dcfce7' : '#fee2e2',
                    color: club.status === 'active' ? '#166534' : '#991b1b'
                  }}>
                    {club.status}
                  </span>
                </div>

                <h3
                  onClick={() => navigate(`/clubs/${club.id}`)}
                  style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0f172a', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                >
                  {club.name}
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                  {club.description.length > 110 ? club.description.substring(0, 110) + '...' : club.description}
                </p>
              </div>

              <div>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} color="#3b82f6" /> {club.member_count} Members
                  </span>
                  <span>Lead: {club.lead_name || 'Unassigned'}</span>
                </div>

                <button
                  onClick={() => navigate(`/clubs/${club.id}`)}
                  style={{
                    width: '100%', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0',
                    padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Eye size={14} /> View Club Profile
                </button>

                {canEdit(club) && (
                  <button
                    onClick={() => openEditModal(club)}
                    style={{
                      width: '100%', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                      padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      marginBottom: '8px'
                    }}
                  >
                    Edit Club Details
                  </button>
                )}

                {activeRole === 'admin' && (
                  <button
                    onClick={() => handleStatusUpdate(club.id, club.status === 'active' ? 'inactive' : 'active')}
                    style={{
                      width: '100%',
                      backgroundColor: club.status === 'active' ? '#fee2e2' : '#dcfce7',
                      color: club.status === 'active' ? '#991b1b' : '#166534',
                      border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                    }}
                  >
                    {club.status === 'active' ? <><XCircle size={14} /> Deactivate Club</> : <><CheckCircle size={14} /> Activate Club</>}
                  </button>
                )}

                {activeRole === 'student' && (
                  <>
                    {club.is_member ? (
                      <div style={{ width: '100%', textAlign: 'center', backgroundColor: '#dcfce7', color: '#166534', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> You're a Member
                      </div>
                    ) : club.request_status === 'pending' ? (
                      <div style={{ width: '100%', textAlign: 'center', backgroundColor: '#fef3c7', color: '#92400e', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Clock size={14} /> Request Pending
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoin(club.id)}
                        disabled={joiningId === club.id}
                        style={{
                          width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px',
                          borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                          opacity: joiningId === club.id ? 0.7 : 1
                        }}
                      >
                        <UserPlus size={14} /> {joiningId === club.id ? 'Sending...' : club.request_status === 'rejected' ? 'Reapply to Join' : 'Join Club'}
                      </button>
                    )}
                    {joinMsg[club.id] && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>{joinMsg[club.id]}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>{activeRole === 'admin' ? 'Create New Campus Club' : 'Propose New Club'}</h3>

            {formMsg.error && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{formMsg.error}</div>}
            {formMsg.success && <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{formMsg.success}</div>}

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Club Name *</label>
                <input type="text" required placeholder="e.g. AI & Robotics Club" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Club Code *</label>
                  <input type="text" required placeholder="e.g. AIRC" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Literary">Literary</option>
                    <option value="Social Service">Social Service</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description *</label>
                <textarea required rows={4} placeholder="Describe the mission and activities of the club..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Faculty Coordinator *</label>
                  <input type="text" required placeholder="e.g. Dr. K. S. Raman" value={formData.faculty_coordinator} onChange={(e) => setFormData({ ...formData, faculty_coordinator: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Contact Email *</label>
                  <input type="email" required placeholder="club@university.edu" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingClub && editFormData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Edit {editingClub.name}</h3>

            {editMsg.error && <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{editMsg.error}</div>}
            {editMsg.success && <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>{editMsg.success}</div>}

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Club Name *</label>
                  <input type="text" required value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Category *</label>
                  <select value={editFormData.category} onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Literary">Literary</option>
                    <option value="Social Service">Social Service</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description *</label>
                <textarea required rows={4} value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Faculty Coordinator *</label>
                  <input type="text" required value={editFormData.faculty_coordinator} onChange={(e) => setEditFormData({ ...editFormData, faculty_coordinator: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Contact Email *</label>
                  <input type="email" required value={editFormData.contact_email} onChange={(e) => setEditFormData({ ...editFormData, contact_email: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Contact Phone</label>
                <input type="text" value={editFormData.contact_phone} onChange={(e) => setEditFormData({ ...editFormData, contact_phone: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => { setEditingClub(null); setEditFormData(null); }} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
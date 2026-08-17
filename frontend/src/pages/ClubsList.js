import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Layers, Search, Plus, CheckCircle, XCircle, Users } from 'lucide-react';

export default function ClubsList() {
  const { activeRole } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Technical',
    description: ''
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
      setFormData({ name: '', code: '', category: 'Technical', description: '' });
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
                    backgroundColor: club.status === 'active' ? '#dcfce7' : club.status === 'pending' ? '#fef3c7' : '#fee2e2',
                    color: club.status === 'active' ? '#166534' : club.status === 'pending' ? '#92400e' : '#991b1b'
                  }}>
                    {club.status}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#0f172a' }}>{club.name}</h3>
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

                {activeRole === 'admin' && club.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleStatusUpdate(club.id, 'active')}
                      style={{ flex: 1, backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(club.id, 'rejected')}
                      style={{ flex: 1, backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
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
    </div>
  );
}
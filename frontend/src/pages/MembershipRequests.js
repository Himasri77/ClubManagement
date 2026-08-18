import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CheckCircle, XCircle, User, Layers } from 'lucide-react';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' }
];

export default function MembershipRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/requests', { params: { status: statusFilter } });
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    setError('');
    try {
      await api.patch(`/requests/${id}`, { status: 'approved' });
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    setError('');
    try {
      await api.patch(`/requests/${id}`, { status: 'rejected', rejection_reason: rejectReason || null });
      setRejectingId(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setProcessingId(null);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      approved: { bg: '#dcfce7', color: '#166534' },
      rejected: { bg: '#fee2e2', color: '#991b1b' }
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Membership Approvals</h2>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
          Review and act on student requests to join campus clubs.
        </p>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: statusFilter === tab.key ? '700' : '500',
              color: statusFilter === tab.key ? '#2563eb' : '#64748b',
              borderBottom: statusFilter === tab.key ? '2px solid #2563eb' : '2px solid transparent',
              fontSize: '14px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
          No {statusFilter !== 'all' ? statusFilter : ''} requests found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map((r) => (
            <div key={r.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <User size={16} color="#2563eb" />
                    <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{r.full_name}</span>
                    {statusBadge(r.status)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>
                    {r.email} {r.roll_number ? `• ${r.roll_number}` : ''} {r.department ? `• ${r.department}` : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155', marginTop: '6px' }}>
                    <Layers size={14} color="#3b82f6" />
                    Requesting to join <strong>{r.club_name}</strong> ({r.club_code})
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    Requested {new Date(r.requested_at + 'Z').toLocaleString()}
                    {r.reviewed_at && ` • Reviewed ${new Date(r.reviewed_at + 'Z').toLocaleString()}`}
                  </div>
                  {r.status === 'rejected' && r.rejection_reason && (
                    <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px', fontStyle: 'italic' }}>
                      Reason: {r.rejection_reason}
                    </div>
                  )}
                </div>

                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={processingId === r.id}
                      style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: processingId === r.id ? 0.6 : 1 }}
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => { setRejectingId(rejectingId === r.id ? null : r.id); setRejectReason(''); }}
                      disabled={processingId === r.id}
                      style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: processingId === r.id ? 0.6 : 1 }}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>

              {rejectingId === r.id && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Optional reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={processingId === r.id}
                    style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {processingId === r.id ? 'Submitting...' : 'Confirm Reject'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
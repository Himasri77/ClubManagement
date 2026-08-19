import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Award, PieChart as PieIcon, Download } from 'lucide-react';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#0891b2'];

function monthLabel(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

const ChartCard = ({ icon, title, children, action }) => (
  <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>{title}</h3>
      </div>
      {action}
    </div>
    {children}
  </div>
);

export default function AnalyticsCharts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/dashboard/admin/analytics');
        if (res.data.success) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const exportTopClubsCSV = () => {
    if (!data || !data.top_clubs.length) return;
    const rows = [['Club Name', 'Member Count'], ...data.top_clubs.map((c) => [c.name, c.member_count])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'top_clubs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading analytics...</div>;
  }
  if (!data) return null;

  const memberGrowth = data.member_growth.map((d) => ({ month: monthLabel(d.month), Members: d.count }));
  const eventTrends = data.event_trends.map((d) => ({
    month: monthLabel(d.month), Events: d.events_count, Registrations: d.registrations
  }));
  const topClubs = data.top_clubs.map((c) => ({ name: c.name, Members: c.member_count }));
  const categoryData = data.category_distribution.map((c) => ({ name: c.category, value: c.count }));

  const attendanceRate = data.attendance_stats.total > 0
    ? Math.round((data.attendance_stats.attended / data.attendance_stats.total) * 100)
    : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
      <ChartCard icon={<TrendingUp size={17} color="#2563eb" />} title="Member Growth (Last 6 Months)">
        {memberGrowth.length === 0 ? (
          <EmptyChart text="No new memberships in this period yet." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="Members" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard icon={<TrendingUp size={17} color="#16a34a" />} title="Event Activity & Registrations">
        {eventTrends.length === 0 ? (
          <EmptyChart text="No events scheduled in this period yet." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eventTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Events" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Registrations" fill="#86efac" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        icon={<Award size={17} color="#d97706" />}
        title="Top 5 Most Active Clubs"
        action={
          <button onClick={exportTopClubsCSV} style={exportBtnStyle} title="Export CSV">
            <Download size={13} /> CSV
          </button>
        }
      >
        {topClubs.length === 0 ? (
          <EmptyChart text="No club membership data yet." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topClubs} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="Members" fill="#d97706" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard icon={<PieIcon size={17} color="#7c3aed" />} title="Clubs by Category">
        {categoryData.length === 0 ? (
          <EmptyChart text="No active clubs yet." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={{ fontSize: 11 }}>
                {categoryData.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div style={{ gridColumn: '1 / -1' }}>
        <ChartCard icon={<Award size={17} color="#2563eb" />} title="Overall Event Attendance Rate">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a' }}>{attendanceRate}%</div>
            <div style={{ flex: 1, height: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${attendanceRate}%`, height: '100%', backgroundColor: '#2563eb' }} />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
              {data.attendance_stats.attended} of {data.attendance_stats.total} registrants attended
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
      {text}
    </div>
  );
}

const exportBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #e2e8f0',
  borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: '#334155', cursor: 'pointer'
};

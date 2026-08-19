import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(dateStr) {
  // event_date comes back as 'YYYY-MM-DD' (or similar) from the API
  return dateStr.slice(0, 10);
}

export default function EventsCalendar({ events, onSelectEvent }) {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const key = toDateKey(e.event_date);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayKey = toDateKey(new Date().toISOString());

  const changeMonth = (delta) => {
    setCursor(new Date(year, month + delta, 1));
    setSelectedDay(null);
  };

  const dayKey = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => changeMonth(-1)} style={navBtnStyle}><ChevronLeft size={16} /></button>
          <button onClick={() => setCursor(new Date())} style={{ ...navBtnStyle, width: 'auto', padding: '0 10px', fontSize: '12px', fontWeight: 600 }}>Today</button>
          <button onClick={() => changeMonth(1)} style={navBtnStyle}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{w}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />;
          const key = dayKey(d);
          const dayEvents = eventsByDate[key] || [];
          const isToday = key === todayKey;
          const isSelected = selectedDay === key;

          return (
            <div
              key={key}
              onClick={() => dayEvents.length > 0 && setSelectedDay(isSelected ? null : key)}
              style={{
                minHeight: '68px', borderRadius: '8px', padding: '6px',
                border: isToday ? '1.5px solid #2563eb' : '1px solid #f1f5f9',
                backgroundColor: isSelected ? '#eff6ff' : '#fff',
                cursor: dayEvents.length > 0 ? 'pointer' : 'default'
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: isToday ? 700 : 500, color: isToday ? '#2563eb' : '#334155' }}>{d}</div>
              {dayEvents.slice(0, 2).map((e) => (
                <div
                  key={e.id}
                  style={{
                    fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '4px',
                    padding: '1px 4px', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}
                >
                  {e.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>+{dayEvents.length - 2} more</div>
              )}
            </div>
          );
        })}
      </div>

      {selectedDay && eventsByDate[selectedDay] && (
        <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
            Events on {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {eventsByDate[selectedDay].map((e) => (
              <div
                key={e.id}
                onClick={() => onSelectEvent && onSelectEvent(e)}
                style={{
                  padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px',
                  cursor: onSelectEvent ? 'pointer' : 'default'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{e.title}</div>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '10px', marginTop: '3px' }}>
                  <span><MapPin size={10} style={{ verticalAlign: '-1px' }} /> {e.venue}</span>
                  <span><Users size={10} style={{ verticalAlign: '-1px' }} /> {e.registered_count} registered</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle = {
  width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155'
};

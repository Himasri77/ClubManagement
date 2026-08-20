import React from 'react';
import { Users, Calendar, Megaphone, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: Users, text: 'Join clubs and track your membership in one place' },
  { icon: Calendar, text: 'Register for events with real-time capacity tracking' },
  { icon: Megaphone, text: 'Never miss an announcement with instant notifications' },
  { icon: BarChart3, text: 'Admins get full analytics on engagement and growth' },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      {/* Branded left panel — real campus photo with a color-graded overlay */}
      <div className="auth-left-panel">
        <div className="auth-photo-layer" />
        <div className="auth-overlay-layer" />

        <div className="auth-left-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '52px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '18px', border: '1px solid rgba(255,255,255,0.2)'
            }}>
              C
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.2px' }}>Campus Club Portal</span>
          </div>

          <h1 style={{ fontSize: '36px', lineHeight: 1.22, fontWeight: 800, maxWidth: '440px', margin: 0 }}>
            One platform for every club, event, and announcement on campus.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', marginTop: '16px', maxWidth: '400px' }}>
            Built for students and club leads to organize, engage, and grow — without another spreadsheet.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '48px' }}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '9px', backgroundColor: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, border: '1px solid rgba(255,255,255,0.18)'
                }}>
                  <Icon size={16} color="#fff" />
                </div>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="auth-right-panel">
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</h2>
            {subtitle && <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>

      <style>{`
        .auth-shell {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
        }

        .auth-left-panel {
          position: relative;
          flex: 1 1 48%;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          color: #fff;
        }

        .auth-photo-layer {
          position: absolute;
          inset: 0;
          background-image: url('/images/campus-hero.jpg');
          background-size: cover;
          background-position: center;
          animation: authKenBurns 24s ease-in-out infinite alternate;
        }

        /* Color-graded gradient so text stays readable over any photo */
        .auth-overlay-layer {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(160deg, rgba(15, 23, 42, 0.88) 0%, rgba(30, 41, 99, 0.82) 45%, rgba(37, 99, 235, 0.55) 100%);
        }

        .auth-left-content {
          position: relative;
          z-index: 2;
          padding: 56px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 100%;
        }

        .auth-right-panel {
          flex: 1 1 52%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          background-color: #f8fafc;
        }

        @keyframes authKenBurns {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.08) translate(-1%, -1%); }
        }

        @media (max-width: 860px) {
          .auth-shell { display: block; }
          .auth-left-panel { display: none; }
          .auth-right-panel { min-height: 100vh; }
        }
      `}</style>
    </div>
  );
}

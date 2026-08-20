import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, Megaphone, BarChart3, ChevronDown, ArrowRight,
  UserPlus, Search, PartyPopper, ShieldCheck
} from 'lucide-react';

const FEATURES = [
  { icon: Users, title: 'Club Membership', text: 'Browse every club on campus, view rich profile pages, and request to join with one click.' },
  { icon: Calendar, title: 'Event Registration', text: 'Register for events with live capacity tracking, deadlines, and a full calendar view.' },
  { icon: Megaphone, title: 'Instant Announcements', text: 'Club leads post updates that reach members immediately through in-app notifications.' },
  { icon: BarChart3, title: 'Admin Analytics', text: 'Track member growth, event trends, and engagement with real-time dashboards.' },
];

const STEPS = [
  { icon: UserPlus, title: 'Create an Account', text: 'Sign up as a student in seconds with your college email.' },
  { icon: Search, title: 'Discover Clubs', text: 'Explore clubs by category and request to join the ones you love.' },
  { icon: PartyPopper, title: 'Get Involved', text: 'Register for events, get notified, and track everything in one dashboard.' },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: '#fff' }}>
      {/* Sticky nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            backgroundColor: scrolled ? '#2563eb' : 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '15px', color: '#fff',
            border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.3)'
          }}>
            C
          </div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: scrolled ? '#0f172a' : '#fff' }}>
            Campus Club Portal
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/login"
            style={{
              fontSize: '13px', fontWeight: 600, padding: '9px 16px', borderRadius: '8px',
              color: scrolled ? '#334155' : '#fff'
            }}
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="btn-primary"
            style={{
              fontSize: '13px', fontWeight: 700, padding: '9px 18px', borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="home-hero">
        <div className="home-hero-photo" />
        <div className="home-hero-overlay" />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: '780px' }}>
          <span style={{
            display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', fontSize: '12px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px',
            letterSpacing: '0.4px', marginBottom: '22px', backdropFilter: 'blur(4px)'
          }}>
            YOUR CAMPUS, ONE PLATFORM
          </span>
          <h1 style={{ color: '#fff', fontSize: '46px', fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
            Discover clubs. Attend events.<br />Stay connected.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', marginTop: '18px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            The all-in-one hub for managing club memberships, events, and announcements — built for students and club leads alike.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{
              padding: '13px 26px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}>
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link to="/login" style={{
              padding: '13px 26px', borderRadius: '10px', fontWeight: 700, fontSize: '14px',
              backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(4px)'
            }}>
              Log In
            </Link>
          </div>
        </div>

        <button
          onClick={scrollToFeatures}
          aria-label="Scroll to features"
          style={{
            position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%',
            width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'bounceDown 2s ease-in-out infinite'
          }}
        >
          <ChevronDown size={18} color="#fff" />
        </button>
      </header>

      {/* Features */}
      <section id="features" style={{ padding: '90px 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '13px', letterSpacing: '0.5px' }}>FEATURES</span>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '10px 0 0 0' }}>
            Everything your club needs
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px' }}>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card-hover" style={{
              backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '26px'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px'
              }}>
                <Icon size={20} color="#2563eb" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ backgroundColor: '#f8fafc', padding: '90px 40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '13px', letterSpacing: '0.5px' }}>HOW IT WORKS</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '10px 0 0 0' }}>
              Get started in three steps
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
                  boxShadow: '0 8px 20px rgba(37,99,235,0.25)'
                }}>
                  <Icon size={26} color="#fff" />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#2563eb', marginBottom: '6px' }}>STEP {i + 1}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{title}</h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: 0, maxWidth: '240px', marginLeft: 'auto', marginRight: 'auto' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section style={{
        background: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
        padding: '70px 40px', textAlign: 'center'
      }}>
        <ShieldCheck size={32} color="#93c5fd" style={{ marginBottom: '18px' }} />
        <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, margin: 0 }}>
          Ready to get involved on campus?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', marginTop: '10px', marginBottom: '28px' }}>
          Join in less than a minute — it's free for every student.
        </p>
        <Link to="/register" className="btn-primary" style={{
          padding: '13px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', display: 'inline-block'
        }}>
          Create Your Account
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 40px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
          © {new Date().getFullYear()} Campus Club Portal. Built as a student project.
        </p>
      </footer>

      <style>{`
        .home-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .home-hero-photo {
          position: absolute;
          inset: 0;
          background-image: url('/images/campus-hero.jpeg');
          background-size: cover;
          background-position: center;
          animation: homeKenBurns 26s ease-in-out infinite alternate;
        }
        .home-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(170deg, rgba(15,23,42,0.86) 0%, rgba(30,41,99,0.78) 50%, rgba(37,99,235,0.55) 100%);
        }
        @keyframes homeKenBurns {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.09) translate(-1.5%, -1.5%); }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </div>
  );
}

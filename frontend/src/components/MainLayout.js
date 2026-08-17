import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  FileCheck2,
  Bell,
  LogOut,
  UserCheck,
  Eye,
  Menu,
  X
} from 'lucide-react';

export default function MainLayout({ children }) {
  const { user, activeRole, isViewingAsStudent, toggleStudentView, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = activeRole === 'admin' 
    ? [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Manage Clubs', path: '/admin/clubs', icon: Layers },
        { label: 'Events & RSVPs', path: '/admin/events', icon: Calendar },
        { label: 'Memberships', path: '/admin/memberships', icon: Users },
        { label: 'Approvals', path: '/admin/approvals', icon: FileCheck2 },
      ]
    : [
        { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
        { label: 'Explore Clubs', path: '/student/clubs', icon: Layers },
        { label: 'My Clubs', path: '/student/my-clubs', icon: Users },
        { label: 'Events Calendar', path: '/student/events', icon: Calendar },
        { label: 'Notifications', path: '/student/notifications', icon: Bell },
      ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '250px' : '70px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        transition: 'width 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          borderBottom: '1px solid #1e293b'
        }}>
          {sidebarOpen && (
            <span style={{ fontWeight: '700', fontSize: '18px', color: '#38bdf8' }}>
              Campus Hub
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: '16px 8px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  marginBottom: '6px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}
              >
                <Icon size={20} />
                {sidebarOpen && <span style={{ fontSize: '14px' }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e293b' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#1e293b',
              color: '#f87171',
              fontWeight: '500',
              cursor: 'pointer',
              justifyContent: sidebarOpen ? 'flex-start' : 'center'
            }}
          >
            <LogOut size={18} />
            {sidebarOpen && <span style={{ fontSize: '14px' }}>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Admin Student Preview Banner */}
        {user?.role === 'admin' && (
          <div style={{
            backgroundColor: isViewingAsStudent ? '#f59e0b' : '#3b82f6',
            color: '#ffffff',
            padding: '8px 24px',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} />
              <span>
                {isViewingAsStudent
                  ? 'Currently viewing system as a Student.'
                  : 'Administrator Mode active.'}
              </span>
            </div>
            <button
              onClick={toggleStudentView}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '12px'
              }}
            >
              {isViewingAsStudent ? 'Switch Back to Admin' : 'View as Student'}
            </button>
          </div>
        )}

        {/* Top Header Bar */}
        <header style={{
          backgroundColor: '#ffffff',
          padding: '16px 32px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Campus Club & Society Portal
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              backgroundColor: '#f1f5f9',
              borderRadius: '20px'
            }}>
              <UserCheck size={18} color="#2563eb" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                {user?.full_name} ({activeRole})
              </span>
            </div>
          </div>
        </header>

        {/* Main Content View */}
        <main style={{ padding: '32px', flex: 1 }}>
          {children}
        </main>
      </div>

    </div>
  );
}
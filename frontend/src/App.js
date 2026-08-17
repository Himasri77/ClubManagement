import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import ClubsList from './pages/ClubsList';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ margin: 0, color: '#0f172a' }}>Admin Overview Dashboard</h2>
                    <p style={{ color: '#64748b', marginTop: '8px' }}>Manage all club submissions, approvals, events and memberships.</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clubs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <ClubsList />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ margin: 0, color: '#0f172a' }}>Student Home Dashboard</h2>
                    <p style={{ color: '#64748b', marginTop: '8px' }}>Welcome back! Browse campus clubs and register for upcoming events.</p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/clubs"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <ClubsList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
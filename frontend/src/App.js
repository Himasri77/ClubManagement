import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import ClubsList from './pages/ClubsList';
import MembershipRequests from './pages/MembershipRequests';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import EventsList from './pages/EventsList';
import Announcements from './pages/Announcements';
import ClubDetail from './pages/ClubDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Shared Route: Club Profile Page (accessible to any logged-in user) */}
          <Route
            path="/clubs/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ClubDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <AdminDashboard />
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
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <MembershipRequests />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <EventsList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout>
                  <Announcements />
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
                  <StudentDashboard />
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
          <Route
            path="/student/events"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <EventsList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/announcements"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MainLayout>
                  <Announcements />
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
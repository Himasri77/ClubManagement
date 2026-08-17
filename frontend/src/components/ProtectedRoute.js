import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, activeRole, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading application session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    return <Navigate to={activeRole === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
}
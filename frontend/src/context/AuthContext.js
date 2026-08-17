import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('activeRole') || (user ? user.role : 'student');
  });

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('activeRole', userData.role);
    setUser(userData);
    setActiveRole(userData.role);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setActiveRole('student');
  };

  const switchRole = (newRole) => {
    localStorage.setItem('activeRole', newRole);
    setActiveRole(newRole);
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
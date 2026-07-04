// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, notificationService } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  // Check dark mode on mount
  useEffect(() => {
    const isDark = localStorage.getItem('kcet_dark_mode') === 'true' ||
      (!('kcet_dark_mode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, []);

  // Check auth token on mount
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('kcet_od_token');
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          // Fetch notifications
          await fetchNotifications();
        } catch (error) {
          console.error('Failed to restore authentication session:', error.message);
          localStorage.removeItem('kcet_od_token');
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  // Poll notifications periodically if user is logged in
  useEffect(() => {
    let interval;
    if (user) {
      fetchNotifications();
      interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    }
    return () => clearInterval(interval);
  }, [user]);

  async function fetchNotifications() {
    try {
      const list = await notificationService.getNotifications();
      setNotifications(list);
      setUnreadNotifCount(list.filter(n => !n.isRead).length);
    } catch (err) {
      console.warn('Failed to poll notifications feed.');
    }
  }

  async function markNotificationsAsRead() {
    try {
      await notificationService.markAllRead();
      setUnreadNotifCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  }

  async function login(email, password) {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('kcet_od_token', data.token);
      setUser(data.user);
      await fetchNotifications();
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('kcet_od_token');
    setUser(null);
    setNotifications([]);
    setUnreadNotifCount(0);
  }

  function toggleDarkMode() {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('kcet_dark_mode', String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.colorScheme = nextDark ? 'dark' : 'light';
  }

  const value = {
    user,
    loading,
    login,
    logout,
    notifications,
    unreadNotifCount,
    fetchNotifications,
    markNotificationsAsRead,
    darkMode,
    toggleDarkMode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be utilized within an AuthProvider.');
  }
  return context;
}

// client/src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle2, XCircle, ArrowRightLeft, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell({ onNotificationClick }) {
  const { user, notifications, unreadNotifCount, markNotificationsAsRead } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadNotifCount > 0) {
      // Mark as read when opening
      markNotificationsAsRead();
    }
  };

  const handleNotificationClick = (notif) => {
    setIsOpen(false);
    
    // If a callback was provided (e.g. from StaffDashboard), pass the full notification object
    if (onNotificationClick) {
      onNotificationClick(notif);
      return;
    }

    // Fallback redirect logic depending on role
    if (notif.odId) {
      if (user.role === 'student') {
        navigate(`/student/request/${notif.odId}`);
      } else if (['mentor', 'chairperson', 'hod'].includes(user.role)) {
        // Staff can go to dashboard
        navigate('/staff');
      } else if (user.role === 'admin') {
        navigate('/admin');
      }
    }
  };

  // Helper to format date
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to pick icons
  const getNotifIcon = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('approved') || msg.includes('congratulations')) {
      return <CheckCircle2 className="h-4 w-4 text-olive shrink-0" />;
    }
    if (msg.includes('rejected')) {
      return <XCircle className="h-4 w-4 text-rust shrink-0" />;
    }
    if (msg.includes('forwarded')) {
      return <ArrowRightLeft className="h-4 w-4 text-terra shrink-0" />;
    }
    return <FileSpreadsheet className="h-4 w-4 text-gold shrink-0" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-parchment bg-cream-dark text-brown-700 hover:bg-parchment hover:text-terra transition-all duration-300 dark:border-dark-border dark:bg-dark-card dark:text-brown-300 dark:hover:bg-dark-surface dark:hover:text-terra-light"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-terra text-[10px] font-bold text-white ring-2 ring-cream dark:ring-dark-bg animate-pulse">
            {unreadNotifCount}
          </span>
        )}
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-cream/95 backdrop-blur-sm dark:bg-dark-bg/95 animate-fade-in p-4 sm:p-6 md:p-12 lg:p-24">
          <div 
            className="flex flex-col w-full h-full max-w-4xl mx-auto bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden border border-parchment dark:border-dark-border relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-parchment px-6 py-5 dark:border-dark-border bg-cream-dark/50 dark:bg-dark-surface/50">
              <h2 className="text-xl sm:text-2xl font-bold text-brown-800 dark:text-cream-dark flex items-center gap-3">
                <Bell className="h-6 w-6 text-terra" />
                Notifications
              </h2>
              <div className="flex items-center gap-4">
                {unreadNotifCount > 0 && (
                  <span className="rounded-full bg-terra/10 px-3 py-1 text-sm font-bold text-terra dark:text-terra-light">
                    {unreadNotifCount} New
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="rounded-full p-2 text-brown-500 hover:bg-parchment hover:text-brown-800 dark:text-brown-400 dark:hover:bg-dark-surface dark:hover:text-cream-dark transition-colors"
                  aria-label="Close notifications"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-parchment/50 dark:divide-dark-border/50 bg-white dark:bg-dark-card">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4 py-20 text-center">
                  <div className="h-20 w-20 rounded-full bg-cream-dark dark:bg-dark-surface flex items-center justify-center mb-6 shadow-inner">
                    <Bell className="h-10 w-10 text-brown-300 dark:text-brown-500" />
                  </div>
                  <h3 className="text-lg font-bold text-brown-700 dark:text-brown-300 mb-2">You are all caught up!</h3>
                  <p className="text-sm font-medium text-brown-400 dark:text-brown-400 max-w-xs">There are no new notifications for you right now.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex w-full text-left px-6 py-5 hover:bg-cream dark:hover:bg-dark-surface/80 transition-colors group ${!notif.isRead ? 'bg-cream/40 dark:bg-dark-surface/40' : ''}`}
                  >
                    <div className="flex gap-4 sm:gap-6 w-full items-start">
                      <div className="mt-1 shrink-0 p-2 rounded-full bg-white dark:bg-dark-bg shadow-sm border border-parchment/50 dark:border-dark-border/50 group-hover:scale-110 transition-transform">
                        {getNotifIcon(notif.message)}
                      </div>
                      <div className="flex flex-col flex-1">
                        <p className={`text-sm sm:text-base leading-relaxed ${!notif.isRead ? 'font-semibold text-brown-800 dark:text-cream-dark' : 'text-brown-600 dark:text-brown-400'}`}>
                          {notif.message}
                        </p>
                        <span className="mt-2 text-xs font-medium text-brown-400 dark:text-brown-500 flex items-center gap-1.5">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <div className="shrink-0 h-2.5 w-2.5 rounded-full bg-terra mt-2 shadow-sm shadow-terra/30"></div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

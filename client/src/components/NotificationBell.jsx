// client/src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, CheckCircle2, XCircle, ArrowRightLeft, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
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
    
    // Redirect logic depending on role
    if (notif.odId) {
      if (user.role === 'student') {
        navigate(`/student/request/${notif.odId}`);
      } else if (['mentor', 'chairperson', 'hod', 'principal'].includes(user.role)) {
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
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    }
    if (msg.includes('rejected')) {
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    }
    if (msg.includes('forwarded')) {
      return <ArrowRightLeft className="h-4 w-4 text-blue-500 shrink-0" />;
    }
    return <FileSpreadsheet className="h-4 w-4 text-amber-500 shrink-0" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 focus:outline-none dark:bg-navy-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors shadow-sm"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-navy-950 animate-bounce">
            {unreadNotifCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 md:w-96 origin-top-right rounded-xl bg-white p-2 shadow-2xl ring-1 ring-black/5 focus:outline-none dark:bg-navy-900 dark:ring-slate-800 z-50 transition-all duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
            {unreadNotifCount > 0 && (
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
                {unreadNotifCount} New
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/40">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">You are all caught up! No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex w-full text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${!notif.isRead ? 'bg-slate-50/50 dark:bg-slate-800/20 font-medium' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0">{getNotifIcon(notif.message)}</div>
                    <div className="flex flex-col">
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {notif.message}
                      </p>
                      <span className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

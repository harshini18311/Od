// client/src/components/RoleGuard.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

/**
 * Route protection guard checking user auth role.
 * @param {string[]} allowedRoles - Roles permitted to view this route
 */
export default function RoleGuard({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cream dark:bg-dark-bg">
        <div className="flex flex-col items-center space-y-5">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2 border-parchment dark:border-dark-border"></div>
            <div className="absolute inset-0 rounded-full border-2 border-terra border-t-transparent animate-spin"></div>
            <div className="absolute inset-3 rounded-full border-2 border-olive border-b-transparent animate-spin-slow"></div>
          </div>
          <p className="text-sm font-semibold tracking-wide text-brown-500 dark:text-brown-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-cream px-4 text-center dark:bg-dark-bg">
        <div className="card-warm p-10 max-w-md w-full text-center">
          <div className="rounded-full bg-rust/10 p-5 w-20 h-20 mx-auto flex items-center justify-center mb-6">
            <ShieldAlert className="h-10 w-10 text-rust" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-brown-900 dark:text-cream mb-3">Access Restricted</h1>
          <p className="text-sm text-brown-500 dark:text-brown-400 mb-8 leading-relaxed">
            Your current role <strong className="text-terra">({user.role.toUpperCase()})</strong> does not have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn-terra w-full py-3"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
}

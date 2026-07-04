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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-navy-950">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-950/30">
          <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-500" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Permission Denied</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Your current account role <strong>({user.role.toUpperCase()})</strong> does not have permission to access this administrative dashboard.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20"
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
}

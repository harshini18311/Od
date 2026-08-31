// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Component Guards
import RoleGuard from './components/RoleGuard';

// Pages
import Landing from './pages/Landing';
import StudentDashboard from './pages/StudentDashboard';
import NewOdRequest from './pages/NewOdRequest';
import OdStatus from './pages/OdStatus';
import StaffDashboard from './pages/StaffDashboard';
import AdminPanel from './pages/AdminPanel';
import VerifyOD from './pages/VerifyOD';
import StaffPasswordReset from './pages/StaffPasswordReset';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Entrance */}
          <Route path="/" element={<Landing />} />
          <Route path="/staff/reset-password" element={<StaffPasswordReset />} />

          {/* Student Protected Portal */}
          <Route
            path="/student"
            element={
              <RoleGuard allowedRoles={['student']}>
                <StudentDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/student/request/new"
            element={
              <RoleGuard allowedRoles={['student']}>
                <NewOdRequest />
              </RoleGuard>
            }
          />
          <Route
            path="/student/request/:id"
            element={
              <RoleGuard allowedRoles={['student']}>
                <OdStatus />
              </RoleGuard>
            }
          />

          {/* Faculty Approval Queue */}
          <Route
            path="/staff"
            element={
              <RoleGuard allowedRoles={['mentor', 'chairperson', 'hod']}>
                <StaffDashboard />
              </RoleGuard>
            }
          />

          {/* System Control Admin Board */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={['admin']}>
                <AdminPanel />
              </RoleGuard>
            }
          />

          {/* Secure Public QR Verification */}
          <Route path="/verify/:odCode" element={<VerifyOD />} />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      {/* Toast popup notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: 'text-xs font-semibold rounded-xl bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/60 shadow-lg',
          duration: 4000,
        }}
      />
    </AuthProvider>
  );
}

// client/src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, User, FileText, CheckCircle, Clock, XCircle, LogOut, ArrowRight, GraduationCap } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import StatusBadge from '../components/StatusBadge';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const result = await studentService.getDashboard();
        setData(result);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load student dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading student profile...</p>
        </div>
      </div>
    );
  }

  const { student, stats, recentRequests } = data || {};
  const mentorName = student?.mentorName || 'Unassigned';
  const chairpersonName = student?.chairpersonName || 'Unassigned';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-300">
      {/* Dashboard Top Header */}
      <nav className="sticky top-0 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500 text-white p-1.5 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">KCET Student</span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:bg-navy-900 dark:text-slate-400 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors shadow-sm"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Student Profile Info Summary Card */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
            <GraduationCap className="h-64 w-64" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold uppercase tracking-wider">
                {student?.type?.replace('_', ' ')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Hello, {user?.name}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Welcome to your On-Duty leave portal. Use this hub to submit new requests, upload event brochures, and monitor authorization stages in real-time.
              </p>
            </div>
            {/* Metadata Badges Column */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs sm:text-sm bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Reg. No:</span>
                <span className="font-semibold text-slate-200">{student?.regNo}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Department:</span>
                <span className="font-semibold text-slate-200">{student?.department?.code}</span>
              </div>
              <div className="mt-2">
                <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Year & Section:</span>
                <span className="font-semibold text-slate-200">Year {student?.year} - Sec {student?.section}</span>
              </div>
              <div className="mt-2">
                <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Academic Mentor:</span>
                <span className="font-semibold text-slate-200">{mentorName}</span>
              </div>
              <div className="mt-2">
                <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Chairperson:</span>
                <span className="font-semibold text-slate-200">{chairpersonName}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Counter Stats Cards Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Stat 1: Total */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 dark:bg-slate-800 dark:text-slate-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Total ODs</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{stats?.total || 0}</span>
            </div>
          </div>

          {/* Stat 2: Approved */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Approved</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{stats?.approved || 0}</span>
            </div>
          </div>

          {/* Stat 3: Pending */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 dark:bg-amber-950/20 dark:text-amber-400">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Pending</span>
              <span className="text-2xl font-black text-amber-500 mt-1 block">{stats?.pending || 0}</span>
            </div>
          </div>

          {/* Stat 4: Rejected */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 dark:bg-red-950/20 dark:text-red-400">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Rejected</span>
              <span className="text-2xl font-black text-red-500 mt-1 block">{stats?.rejected || 0}</span>
            </div>
          </div>
        </section>

        {/* Requests Table Area */}
        <section className="bg-white rounded-3xl border border-slate-200/50 shadow-sm dark:bg-navy-900 dark:border-slate-800/60 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent OD Requests</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Timeline and verification status of your latest submissions.</p>
            </div>
            <Link
              to="/student/request/new"
              className="inline-flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 hover:shadow-lg transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              New Request
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentRequests?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">No requests submitted yet</h3>
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                  You haven't requested any On-Duty permissions for the current academic term. Use the creation panel to initiate one.
                </p>
                <Link
                  to="/student/request/new"
                  className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Create your first request
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 dark:bg-navy-950 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/40">
                    <th className="px-6 py-4">Ref Code</th>
                    <th className="px-6 py-4">Event Details</th>
                    <th className="px-6 py-4">Hosting Institution</th>
                    <th className="px-6 py-4">Dates</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                  {recentRequests?.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-450 dark:text-slate-500">
                        {req.odCode}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200">
                        {req.eventName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {req.collegeName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {new Date(req.fromDate).toLocaleDateString('en-IN')} - {new Date(req.toDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} currentStage={req.currentStage} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/student/request/${req.id}`)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                          Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

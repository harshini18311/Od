import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, User, FileText, CheckCircle, Clock, XCircle, LogOut, ArrowRight, GraduationCap, LayoutDashboard } from 'lucide-react';
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
      <div className="flex h-screen w-full items-center justify-center bg-cream dark:bg-dark-bg font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-terra border-t-transparent"></div>
          <p className="text-sm font-medium text-brown-600 dark:text-brown-300">Loading student profile...</p>
        </div>
      </div>
    );
  }

  const { student, stats, recentRequests } = data || {};
  const mentorName = student?.mentorName || 'Unassigned';
  const chairpersonName = student?.chairpersonName || 'Unassigned';

  return (
    <div className="min-h-screen bg-cream dark:bg-dark-bg font-sans transition-colors duration-300 flex">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar-nav fixed top-0 left-0 h-screen w-[260px] hidden md:flex flex-col z-40 bg-brown-900 dark:bg-dark-surface border-r border-brown-800 dark:border-dark-border">
        <div className="p-6 border-b border-brown-700/50">
          <div className="flex items-center gap-3">
            <div className="bg-parchment/10 text-cream p-2 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-cream tracking-wide">KCET CSE</h2>
              <p className="text-brown-200 text-xs tracking-wider uppercase mt-0.5">Student Portal</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-brown-700/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brown-800 flex items-center justify-center text-cream shrink-0 border border-brown-600">
              <User className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-cream truncate">{user?.name}</p>
              <span className="inline-flex items-center justify-center px-2 py-0.5 mt-1 rounded text-[9px] font-bold uppercase tracking-wider bg-terra/20 text-terra-light border border-terra/30">
                {student?.type?.replace('_', ' ') || 'Student'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link to="/student" className="sidebar-nav-item active flex items-center gap-3">
             <LayoutDashboard className="h-5 w-5" />
             Dashboard
          </Link>
          <Link to="/student/request/new" className="sidebar-nav-item flex items-center gap-3">
             <Plus className="h-5 w-5" />
             New Request
          </Link>
        </nav>

        <div className="p-4 border-t border-brown-700/50 flex items-center justify-between">
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-brown-300 hover:text-cream hover:bg-brown-800 transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-[260px] flex flex-col min-h-screen w-full">
        {/* Top bar */}
        <header className="sticky top-0 bg-cream/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-brown-100 dark:border-dark-border z-30">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-bold text-brown-900 dark:text-cream">
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="md:hidden">
                <NotificationBell />
              </div>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-brown-600 dark:text-brown-300 hover:bg-brown-100 dark:hover:bg-dark-surface transition-colors"
                title="Logout"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
          {/* Profile summary section */}
          <section className="card-warm relative overflow-hidden p-6 md:p-8">
            <div className="absolute right-0 top-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none translate-x-8 -translate-y-8">
              <GraduationCap className="h-64 w-64 text-brown-900 dark:text-white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-serif font-bold text-brown-900 dark:text-cream">
                  Academic Profile
                </h2>
                <p className="text-sm text-brown-700 dark:text-brown-300 max-w-xl leading-relaxed">
                  Manage your On-Duty requests for departmental activities, technical events, hackathons, and academic programs. Submit supporting documents and track each approval in real time.
                </p>
                <Link
                  to="/student/request/new"
                  className="btn-terra inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Create OD Request
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm bg-parchment/50 dark:bg-dark-surface/50 rounded-2xl p-5 border border-brown-100 dark:border-dark-border shrink-0 min-w-[300px]">
                <div>
                  <span className="text-brown-500 dark:text-brown-400 block mb-1 text-[10px] font-bold uppercase tracking-wider">Reg. No:</span>
                  <span className="font-semibold text-brown-900 dark:text-cream">{student?.regNo}</span>
                </div>
                <div>
                  <span className="text-brown-500 dark:text-brown-400 block mb-1 text-[10px] font-bold uppercase tracking-wider">Department:</span>
                  <span className="font-semibold text-brown-900 dark:text-cream">{student?.department?.code}</span>
                </div>
                <div>
                  <span className="text-brown-500 dark:text-brown-400 block mb-1 text-[10px] font-bold uppercase tracking-wider">Year & Section:</span>
                  <span className="font-semibold text-brown-900 dark:text-cream">Year {student?.year} - Sec {student?.section}</span>
                </div>
                <div>
                  <span className="text-brown-500 dark:text-brown-400 block mb-1 text-[10px] font-bold uppercase tracking-wider">Academic Mentor:</span>
                  <span className="font-semibold text-brown-900 dark:text-cream">{mentorName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-brown-500 dark:text-brown-400 block mb-1 text-[10px] font-bold uppercase tracking-wider">Chairperson:</span>
                  <span className="font-semibold text-brown-900 dark:text-cream">{chairpersonName}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Stats grid */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="card-warm p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-brown-100 dark:bg-dark-surface flex items-center justify-center text-brown-600 dark:text-brown-400 shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-brown-500 dark:text-brown-400 block text-[10px] font-bold uppercase tracking-wider">Total ODs</span>
                <span className="text-2xl font-serif font-black text-brown-900 dark:text-cream mt-0.5 block">{stats?.total || 0}</span>
              </div>
            </div>

            <div className="card-warm p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-olive-light/20 dark:bg-olive-dark/20 flex items-center justify-center text-olive dark:text-olive-light shrink-0">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-brown-500 dark:text-brown-400 block text-[10px] font-bold uppercase tracking-wider">Approved</span>
                <span className="text-2xl font-serif font-black text-olive dark:text-olive-light mt-0.5 block">{stats?.approved || 0}</span>
              </div>
            </div>

            <div className="card-warm p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gold-light/20 dark:bg-gold-dark/20 flex items-center justify-center text-gold dark:text-gold-light shrink-0">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <span className="text-brown-500 dark:text-brown-400 block text-[10px] font-bold uppercase tracking-wider">Pending</span>
                <span className="text-2xl font-serif font-black text-gold dark:text-gold-light mt-0.5 block">{stats?.pending || 0}</span>
              </div>
            </div>

            <div className="card-warm p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-rust-light/20 dark:bg-rust/20 flex items-center justify-center text-rust dark:text-rust-light shrink-0">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-brown-500 dark:text-brown-400 block text-[10px] font-bold uppercase tracking-wider">Rejected</span>
                <span className="text-2xl font-serif font-black text-rust dark:text-rust-light mt-0.5 block">{stats?.rejected || 0}</span>
              </div>
            </div>
          </section>

          {/* Recent OD Requests */}
          <section className="card-warm overflow-hidden">
            <div className="px-6 py-5 border-b border-brown-100 dark:border-dark-border flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-serif font-bold text-brown-900 dark:text-cream">Recent OD Requests</h2>
                <p className="text-xs text-brown-500 dark:text-brown-400">Timeline and verification status of your latest submissions.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {recentRequests?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <FileText className="h-12 w-12 text-brown-300 dark:text-brown-600" />
                  <h3 className="mt-4 text-sm font-bold text-brown-800 dark:text-brown-200">No requests submitted yet</h3>
                  <p className="mt-2 text-xs text-brown-500 dark:text-brown-400 max-w-xs leading-relaxed">
                    You haven't requested any On-Duty permissions for the current academic term.
                  </p>
                  <Link
                    to="/student/request/new"
                    className="btn-terra mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Create your first request
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <table className="table-warm w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-6 py-4">Ref Code</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Event / Activity</th>
                      <th className="px-6 py-4">Date / Period</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests?.map((req) => (
                      <tr key={req.id}>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-brown-600 dark:text-brown-400">
                          {req.odCode}
                        </td>
                        <td className="px-6 py-4">
                          {req.odType === 'INTERNAL' ? (
                            <span className="inline-flex items-center rounded-full bg-parchment dark:bg-dark-surface px-2.5 py-1 text-[10px] font-bold text-brown-700 dark:text-brown-300 ring-1 ring-inset ring-brown-200 dark:ring-dark-border whitespace-nowrap">
                              Internal
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gold-light/20 dark:bg-gold-dark/20 px-2.5 py-1 text-[10px] font-bold text-gold-dark dark:text-gold ring-1 ring-inset ring-gold/20 whitespace-nowrap">
                              External
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-brown-900 dark:text-cream">
                          {req.odType === 'INTERNAL' ? 'Internal Activity' : req.eventName}
                        </td>
                        <td className="px-6 py-4 text-brown-600 dark:text-brown-400 font-medium whitespace-nowrap text-sm">
                          {req.odType === 'INTERNAL'
                            ? (
                              <span className="flex items-center gap-2">
                                {new Date(req.eventDate).toLocaleDateString('en-IN')}
                                <span className="text-[10px] font-bold text-brown-800 dark:text-brown-200 bg-brown-100 dark:bg-dark-surface px-1.5 py-0.5 rounded">
                                  P{req.fromPeriod}–P{req.toPeriod}
                               </span>
                              </span>
                            )
                            : `${new Date(req.fromDate).toLocaleDateString('en-IN')} – ${new Date(req.toDate).toLocaleDateString('en-IN')}`
                          }
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={req.status} currentStage={req.currentStage} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/student/request/${req.id}`)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-terra hover:text-terra-dark dark:text-terra-light dark:hover:text-terra transition-colors"
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
        </div>
      </main>
    </div>
  );
}

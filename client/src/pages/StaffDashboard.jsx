// client/src/pages/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { staffService } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Briefcase, LogOut, Check, X, Clock, HelpCircle, FileText, Calendar, School, User, AlertCircle, ChevronRight } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import StatusBadge from '../components/StatusBadge';

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'
  
  // Data lists
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);

  // Modal Control
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const pendingQueue = await staffService.getQueue();
      const pastHistory = await staffService.getHistory();
      setQueue(pendingQueue);
      setHistory(pastHistory);
    } catch (err) {
      toast.error('Failed to synchronize dashboard queues.');
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const handleOpenEvaluateModal = (req) => {
    setSelectedRequest(req);
    setRemarks('');
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
  };

  const handleAction = async (isApprove) => {
    if (!selectedRequest) return;
    
    if (!isApprove && (!remarks || remarks.trim() === '')) {
      return toast.error('Rejection remarks explaining the cause are mandatory.');
    }

    setActionLoading(true);
    const toastId = toast.loading(isApprove ? 'Approving and forwarding request...' : 'Rejecting request...');

    try {
      if (isApprove) {
        await staffService.approveRequest(selectedRequest.id, remarks);
        toast.success('OD Request approved successfully!', { id: toastId });
      } else {
        await staffService.rejectRequest(selectedRequest.id, remarks);
        toast.success('OD Request rejected successfully.', { id: toastId });
      }
      handleCloseModal();
      await fetchData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to complete evaluation.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading authority profile...</p>
        </div>
      </div>
    );
  }

  const roleLabels = {
    mentor: 'Academic Mentor',
    chairperson: 'Program Chairperson',
    hod: 'Head of Department',
    principal: 'College Principal'
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="sticky top-0 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500 text-white p-1.5 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">
              KCET Administrative
            </span>
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

      {/* Main Content container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Card Banner */}
        <section className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
            <Briefcase className="h-64 w-64" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-widest">
                {roleLabels[user?.role] || 'Authority'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {user?.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                Evaluating leaves for the computer science department. Verify event credentials, check previous signature remarks, and approve or reject submissions in your queue.
              </p>
            </div>
            {/* Dept badge */}
            {user?.deptId && (
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 text-center md:text-right">
                <span className="text-slate-400 block mb-0.5 text-[10px] font-bold uppercase">Assigned Dept:</span>
                <span className="font-semibold text-slate-200">Computer Science & Engineering (CSE)</span>
              </div>
            )}
          </div>
        </section>

        {/* Action Tabs Area */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-250 dark:border-slate-800 pb-px">
            <button
              onClick={() => setActiveTab('queue')}
              className={`py-3 px-1 text-sm font-bold border-b-2 transition-all relative ${activeTab === 'queue' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              Pending Reviews ({queue.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-1 text-sm font-bold border-b-2 transition-all relative ${activeTab === 'history' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              Your History Log ({history.length})
            </button>
          </div>

          {activeTab === 'queue' ? (
            <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm dark:bg-navy-900 dark:border-slate-800/60 overflow-hidden">
              <div className="overflow-x-auto">
                {queue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Clock className="h-12 w-12 text-slate-350 dark:text-slate-700" />
                    <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">Clean Queue!</h3>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                      No student On-Duty leave requests are currently pending your approval authority.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 dark:bg-navy-950 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800/40">
                        <th className="px-6 py-4">Ref Code</th>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Event details</th>
                        <th className="px-6 py-4">Scholar Type</th>
                        <th className="px-6 py-4">Duration</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                      {queue.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-450 dark:text-slate-500">
                            {req.odCode}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{req.student?.user?.name}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Reg No: {req.student?.regNo} | Year {req.student?.year}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{req.eventName}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{req.collegeName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                            {req.studentType?.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                            {new Date(req.fromDate).toLocaleDateString('en-IN')} - {new Date(req.toDate).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenEvaluateModal(req)}
                              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                            >
                              Evaluate
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm dark:bg-navy-900 dark:border-slate-800/60 overflow-hidden">
              <div className="overflow-x-auto">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Clock className="h-12 w-12 text-slate-350 dark:text-slate-700" />
                    <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">No actions recorded</h3>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                      You haven't logged any approval actions or rejection verdicts in the current term.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 dark:bg-navy-950 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800/40">
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Ref Code</th>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Event details</th>
                        <th className="px-6 py-4">Your Verdict</th>
                        <th className="px-6 py-4">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                      {history.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-450 dark:text-slate-500">
                            {log.request?.odCode}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                            {log.request?.student?.user?.name}
                          </td>
                          <td className="px-6 py-4 text-slate-650 dark:text-slate-350">
                            {log.request?.eventName}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${log.action === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'}`}>
                              ● {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic text-xs max-w-xs truncate">
                            "{log.remarks || 'No remarks provided.'}"
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* --- EVALUATE DIALOG MODAL --- */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/80 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">
                  Reviewing Ref: {selectedRequest.odCode}
                </span>
                <h3 className="text-base font-bold text-slate-850 dark:text-white mt-0.5">
                  Evaluate On-Duty Request
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Profile Block */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 dark:bg-navy-950/40 dark:border-slate-850 space-y-3">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Student Profile</span>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[9px] font-bold uppercase">Name:</span>
                    <span className="font-semibold text-slate-755 dark:text-slate-200">{selectedRequest.student?.user?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5 text-[9px] font-bold uppercase">Reg. No:</span>
                    <span className="font-semibold text-slate-755 dark:text-slate-200">{selectedRequest.student?.regNo}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-400 block mb-0.5 text-[9px] font-bold uppercase">Class / Dept:</span>
                    <span className="font-semibold text-slate-755 dark:text-slate-200">Year {selectedRequest.student?.year} | CSE ({selectedRequest.student?.department?.code})</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-400 block mb-0.5 text-[9px] font-bold uppercase">Scholar Type:</span>
                    <span className="font-semibold text-slate-755 dark:text-slate-200">{selectedRequest.studentType?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Event Specs Block */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Event Details</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <School className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Venue</span>
                      <span className="text-slate-700 dark:text-slate-350 font-semibold">{selectedRequest.collegeName}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Permission Dates</span>
                      <span className="text-slate-700 dark:text-slate-350 font-semibold">
                        {new Date(selectedRequest.fromDate).toLocaleDateString('en-IN')} to {new Date(selectedRequest.toDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Purpose of Leave</span>
                  <p className="p-3 bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800/40 rounded-xl leading-relaxed text-slate-650 dark:text-slate-350">
                    {selectedRequest.reason}
                  </p>
                </div>

                {selectedRequest.brochureUrl && (
                  <a
                    href={`http://localhost:5000${selectedRequest.brochureUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    <FileText className="h-4 w-4" />
                    View Brochure Attachment
                  </a>
                )}
              </div>

              {/* Approval logs timeline inside the modal so reviews can see preceding logs */}
              {selectedRequest.logs && selectedRequest.logs.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Preceding Signatures Log</span>
                  <div className="space-y-2">
                    {selectedRequest.logs.map((log, index) => (
                      <div key={index} className="flex gap-3 text-xs bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 dark:bg-navy-950/20 dark:border-slate-800/40">
                        <span className="h-5 w-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Approved by {log.approverId === user.id ? 'You' : 'Staff Holder'} [{log.role.toUpperCase()}]
                          </span>
                          {log.remarks && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">"{log.remarks}"</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluate Remarks Intake */}
              <div className="space-y-1.5">
                <label htmlFor="remarks" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Evaluation Remarks / Rejection Cause
                </label>
                <textarea
                  id="remarks"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={user?.role === 'mentor' ? 'e.g. Verified student academic records. Highly recommended.' : 'Provide feedback or notes here.'}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white dark:placeholder-slate-650 transition-all duration-200"
                ></textarea>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 dark:bg-navy-950/60 dark:border-slate-800/60 flex items-center justify-between gap-4">
              <button
                onClick={handleCloseModal}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 disabled:opacity-50"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAction(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 dark:border-red-950/20 dark:bg-navy-900 dark:hover:bg-red-950/25 dark:text-red-400 font-bold text-xs shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Reject Request
                </button>
                <button
                  onClick={() => handleAction(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/10 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Approve & Forward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

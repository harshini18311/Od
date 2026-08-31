// client/src/pages/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { staffService, studentService } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Briefcase, LogOut, Check, X, Clock, HelpCircle, FileText, Calendar, School, User, AlertCircle, ChevronRight, Search, Plus, Trash2, Upload, Filter, ArrowLeft, Download, Paperclip } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import StatusBadge from '../components/StatusBadge';
import ApprovalTimeline from '../components/ApprovalTimeline';

const getOdDayCount = (request) => {
  if (request.odType === 'INTERNAL') return 1;

  const from = new Date(request.fromDate);
  const to = new Date(request.toDate);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0)) / millisecondsPerDay) + 1);
};

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'history', 'apply'
  
  // Data lists
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);

  // Modal Control
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Bulk Action Control (for Queue)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Apply Bulk OD Control
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [applyForm, setApplyForm] = useState({
    eventName: '',
    collegeName: '',
    eventDate: '',
    fromDate: '',
    toDate: '',
    reason: ''
  });
  const [applyFile, setApplyFile] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);

  // History Filters
  const [historyYearFilter, setHistoryYearFilter] = useState('');
  const [historySectionFilter, setHistorySectionFilter] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  // Approved OD State & Filters
  const [approvedOds, setApprovedOds] = useState([]);
  const [approvedYearFilter, setApprovedYearFilter] = useState('');
  const [approvedSectionFilter, setApprovedSectionFilter] = useState('');
  const [approvedDateFilter, setApprovedDateFilter] = useState('');
  const [approvedTypeFilter, setApprovedTypeFilter] = useState('');
  const [approvedSearchQuery, setApprovedSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const pendingQueue = await staffService.getQueue();
      const pastHistory = await staffService.getHistory();
      const approvedList = await staffService.getApprovedOds();
      setQueue(pendingQueue);
      setHistory(pastHistory);
      setApprovedOds(approvedList);
      setSelectedIds(new Set());
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

  // Full-Screen OD Detail View Control
  const [viewingRequest, setViewingRequest] = useState(null);
  const [detailRemarks, setDetailRemarks] = useState('');
  const [detailActionLoading, setDetailActionLoading] = useState(false);

  const handleOpenEvaluateModal = (req) => {
    setViewingRequest(req);
    setDetailRemarks('');
    setActiveTab('view_request');
  };

  // Called when a staff member clicks on a notification — opens request on a full screen inside dashboard
  const handleNotificationClick = async (notif) => {
    try {
      setLoading(true);
      let targetOdId = notif?.odId;
      let matchedRequest = null;

      // Try to find the request in local queues to avoid strict API authorization issues
      const codeMatch = notif?.message?.match(/OD-\d{4}-[A-Z]+-\d{4}/i);
      const odCode = codeMatch ? codeMatch[0].toUpperCase() : null;

      const found = [...queue, ...history, ...approvedOds].find(r => {
        const reqObj = r.request ? r.request : r;
        return (targetOdId && reqObj.id === targetOdId) || (odCode && reqObj.odCode === odCode);
      });

      if (found) {
        matchedRequest = found.request ? found.request : found;
        targetOdId = matchedRequest.id;
      }

      // If we found it in our local queues, use it directly! (avoids strict API authorization blocks)
      if (matchedRequest) {
        setViewingRequest(matchedRequest);
        setDetailRemarks('');
        setActiveTab('view_request');
        return;
      }

      // Otherwise try fetching it
      if (targetOdId) {
        const detail = await studentService.getRequestDetail(targetOdId);
        if (detail) {
          setViewingRequest(detail);
          setDetailRemarks('');
          setActiveTab('view_request');
          return;
        }
      }
      
      toast.error('Could not locate the associated OD request details.');
    } catch (err) {
      console.error(err);
      toast.error('Could not load the request details. You may not have access.');
    } finally {
      setLoading(false);
    }
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

  const handleDetailAction = async (isApprove) => {
    if (!viewingRequest) return;
    
    if (!isApprove && (!detailRemarks || detailRemarks.trim() === '')) {
      return toast.error('Rejection remarks explaining the cause are mandatory.');
    }

    setDetailActionLoading(true);
    const toastId = toast.loading(isApprove ? 'Approving request...' : 'Rejecting request...');

    try {
      if (isApprove) {
        await staffService.approveRequest(viewingRequest.id, detailRemarks);
        toast.success('OD Request approved successfully!', { id: toastId });
      } else {
        await staffService.rejectRequest(viewingRequest.id, detailRemarks);
        toast.success('OD Request rejected successfully.', { id: toastId });
      }
      setActiveTab('queue');
      setViewingRequest(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to complete evaluation.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setDetailActionLoading(false);
    }
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = (list) => {
    const listIds = list.map(req => req.id);
    const allSelected = listIds.length > 0 && listIds.every(id => selectedIds.has(id));
    const newSet = new Set(selectedIds);
    if (allSelected) {
      listIds.forEach(id => newSet.delete(id));
    } else {
      listIds.forEach(id => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    const defaultRemarks = "Bulk Approved";
    const userRemarks = window.prompt("Enter remarks for bulk approval:", defaultRemarks);
    if (userRemarks === null) return;
    
    setActionLoading(true);
    const toastId = toast.loading(`Approving ${selectedIds.size} requests...`);
    try {
      await staffService.bulkApprove(Array.from(selectedIds), userRemarks || defaultRemarks);
      toast.success(`Successfully approved ${selectedIds.size} requests!`, { id: toastId });
      setSelectedIds(new Set());
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to bulk approve.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  // --- Apply Bulk OD Methods ---
  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length >= 2) {
      try {
        const res = await staffService.searchStudents(val);
        setSearchResults(res);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectStudent = (student) => {
    if (!selectedStudents.find(s => s.id === student.id)) {
      setSelectedStudents([...selectedStudents, student]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeStudent = (id) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== id));
  };

  const handleApplyBulkOd = async (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0) {
      return toast.error('Please select at least one student.');
    }
    const { eventName, collegeName, eventDate, fromDate, toDate, reason } = applyForm;
    if (!eventName || !collegeName || !eventDate || !fromDate || !toDate || !reason) {
      return toast.error('Please fill in all mandatory fields.');
    }

    setApplyLoading(true);
    const toastId = toast.loading('Applying OD for selected students...');
    const formData = new FormData();
    formData.append('studentIds', JSON.stringify(selectedStudents.map(s => s.id)));
    Object.keys(applyForm).forEach(k => formData.append(k, applyForm[k]));
    if (applyFile) formData.append('brochure', applyFile);

    try {
      await staffService.applyBulkOd(formData);
      toast.success('Successfully applied OD for all selected students.', { id: toastId });
      // Reset Form
      setSelectedStudents([]);
      setApplyForm({ eventName: '', collegeName: '', eventDate: '', fromDate: '', toDate: '', reason: '' });
      setApplyFile(null);
      // Fetch queue might show these ODs if logged-in user is HOD, else it's sent to HOD.
      await fetchData();
      setActiveTab('queue'); // redirect back to queue
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to apply bulk OD.', { id: toastId });
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cream dark:bg-dark-bg font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-terra border-t-transparent"></div>
          <p className="text-sm font-medium text-brown-600 dark:text-brown-400">Loading authority profile...</p>
        </div>
      </div>
    );
  }

  const studentsQueue = queue.filter(req => req.student?.mentorId !== user?.id || req.currentStage !== 'mentor_pending');
  const menteesQueue = queue.filter(req => req.student?.mentorId === user?.id && req.currentStage === 'mentor_pending');
  const showSingleQueue = false;

  const filteredHistory = history.filter(log => {
    let match = true;
    if (historyYearFilter && log.request?.student?.year?.toString() !== historyYearFilter) match = false;
    if (historySectionFilter && log.request?.student?.section !== historySectionFilter) match = false;
    if (historyDateFilter) {
      const fromD = log.request?.fromDate ? new Date(log.request.fromDate) : null;
      const toD = log.request?.toDate ? new Date(log.request.toDate) : null;
      const filterD = new Date(historyDateFilter);
      filterD.setHours(0, 0, 0, 0);
      if (fromD && toD) {
        fromD.setHours(0, 0, 0, 0);
        toD.setHours(0, 0, 0, 0);
        if (filterD < fromD || filterD > toD) match = false;
      } else if (fromD) {
        fromD.setHours(0, 0, 0, 0);
        const fromDateStr = `${fromD.getFullYear()}-${String(fromD.getMonth() + 1).padStart(2, '0')}-${String(fromD.getDate()).padStart(2, '0')}`;
        if (fromDateStr !== historyDateFilter) match = false;
      }
    }
    return match;
  });

  const filteredApprovedOds = approvedOds.filter((req) => {
    let match = true;
    const student = req.student;
    if (!student) return false;

    if (approvedYearFilter && student.year?.toString() !== approvedYearFilter) match = false;
    if (approvedSectionFilter && student.section !== approvedSectionFilter) match = false;
    if (approvedTypeFilter && req.odType !== approvedTypeFilter) match = false;

    if (approvedDateFilter) {
      const fromD = req.fromDate ? new Date(req.fromDate) : null;
      const toD = req.toDate ? new Date(req.toDate) : null;
      const filterD = new Date(approvedDateFilter);
      filterD.setHours(0, 0, 0, 0);
      if (fromD && toD) {
        fromD.setHours(0, 0, 0, 0);
        toD.setHours(0, 0, 0, 0);
        if (filterD < fromD || filterD > toD) match = false;
      }
    }

    if (approvedSearchQuery) {
      const query = approvedSearchQuery.toLowerCase();
      const name = student.user?.name?.toLowerCase() || '';
      const regNo = student.regNo?.toLowerCase() || '';
      const odCode = req.odCode?.toLowerCase() || '';
      const eventName = req.eventName?.toLowerCase() || '';
      const collegeName = req.collegeName?.toLowerCase() || '';

      if (!name.includes(query) && !regNo.includes(query) && !odCode.includes(query) && !eventName.includes(query) && !collegeName.includes(query)) {
        match = false;
      }
    }

    return match;
  });

  const renderQueueTable = (data, hideBulkSelect = false) => (
    <div className="overflow-x-auto">
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Clock className="h-10 w-10 text-brown-300 dark:text-brown-700" />
          <h3 className="mt-3 text-sm font-bold text-brown-700 dark:text-brown-300">Clean Queue</h3>
          <p className="mt-1 text-xs text-brown-500 dark:text-brown-400 max-w-xs">
            No requests are currently pending in this category.
          </p>
        </div>
      ) : (
        <table className="table-warm">
          <thead>
            <tr>
              <th className="w-12 text-center">
                {!hideBulkSelect && (
                  <input 
                    type="checkbox" 
                    className="rounded border-brown-300 text-terra focus:ring-terra h-4 w-4 bg-white dark:bg-dark-surface cursor-pointer"
                    checked={data.length > 0 && data.every(req => selectedIds.has(req.id))}
                    onChange={() => toggleAll(data)}
                  />
                )}
              </th>
              <th>Ref Code</th>
              <th>Student</th>
              <th>Event details</th>
              <th>Scholar Type</th>
              <th>Date / Period</th>
              <th>OD Days</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((req) => (
              <tr key={req.id}>
                <td className="text-center">
                  {!hideBulkSelect && (
                    <input 
                      type="checkbox"
                      className="rounded border-brown-300 text-terra focus:ring-terra h-4 w-4 bg-white dark:bg-dark-surface cursor-pointer"
                      checked={selectedIds.has(req.id)}
                      onChange={() => toggleSelection(req.id)}
                    />
                  )}
                </td>
                <td className="font-mono text-xs font-bold text-brown-600 dark:text-brown-400">
                  {req.odCode}
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="font-bold text-brown-900 dark:text-cream">{req.student?.user?.name}</span>
                    <span className="text-[10px] text-brown-500 dark:text-brown-400 font-medium">Reg No: {req.student?.regNo} | Year {req.student?.year}</span>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="font-semibold text-brown-900 dark:text-cream">{req.eventName}</span>
                    <span className="text-[10px] text-brown-500 dark:text-brown-400">{req.collegeName}</span>
                  </div>
                </td>
                <td className="text-brown-600 dark:text-brown-400 font-semibold text-xs">
                  {req.studentType?.replace('_', ' ')}
                </td>
                <td className="text-brown-600 dark:text-brown-400 font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>
                      {req.odType === 'INTERNAL'
                        ? new Date(req.fromDate).toLocaleDateString('en-IN')
                        : `${new Date(req.fromDate).toLocaleDateString('en-IN')} - ${new Date(req.toDate).toLocaleDateString('en-IN')}`}
                    </span>
                    {req.odType === 'INTERNAL' && (
                      <span className="rounded bg-terra-light/20 px-1.5 py-0.5 text-[10px] font-bold text-terra-dark dark:text-terra-light">
                        P{req.fromPeriod}–P{req.toPeriod}
                      </span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap">
                  <span className="text-xs font-bold text-brown-900 dark:text-cream">
                    {getOdDayCount(req)} {getOdDayCount(req) === 1 ? 'day' : 'days'}
                  </span>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => handleOpenEvaluateModal(req)}
                    className="btn-terra px-3 py-1.5 text-xs shadow-sm"
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
  );

  return (
    <div className="min-h-screen bg-cream dark:bg-dark-bg transition-colors duration-300 font-sans flex flex-col md:flex-row">
      {/* Left Sidebar Navigation */}
      <aside className="sidebar-nav fixed inset-y-0 left-0 w-[260px] border-r border-brown-200 dark:border-dark-border flex-col bg-parchment dark:bg-dark-surface z-40 hidden md:flex">
        <div className="p-6 flex flex-col h-full">
          {/* Top Section */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-terra text-white p-2 rounded-lg">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-cream tracking-tight">KCET CSE</h2>
              <span className="text-[10px] text-brown-300 font-bold uppercase tracking-widest block">Staff Portal</span>
            </div>
          </div>
          
          {/* User Info */}
          <div className="mb-8 p-4 bg-brown-50 dark:bg-dark-bg rounded-xl border border-brown-100 dark:border-dark-border">
            <p className="font-bold text-brown-900 dark:text-cream text-sm truncate">{user?.name}</p>
            <span className="text-[10px] px-2 py-1 bg-terra-light/20 text-terra-dark dark:text-terra-light rounded-md mt-2 inline-block font-bold uppercase tracking-wider">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 space-y-1.5">
            {showSingleQueue ? (
              <button
                onClick={() => { setActiveTab('queue'); setSelectedIds(new Set()); }}
                className={`sidebar-nav-item w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'queue' ? 'active bg-terra/10 text-terra-dark dark:bg-terra-dark/30 dark:text-terra-light' : 'text-brown-600 hover:bg-brown-50 dark:text-brown-400 dark:hover:bg-dark-bg'}`}
              >
                <span>Pending Reviews</span>
                {queue.length > 0 && <span className="bg-terra text-white text-[10px] px-2 py-0.5 rounded-full">{queue.length}</span>}
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setActiveTab('queue_mentees'); setSelectedIds(new Set()); }}
                  className={`sidebar-nav-item w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-colors ${(activeTab === 'queue_mentees' || activeTab === 'queue') ? 'active bg-terra/10 text-terra-dark dark:bg-terra-dark/30 dark:text-terra-light' : 'text-brown-600 hover:bg-brown-50 dark:text-brown-400 dark:hover:bg-dark-bg'}`}
                >
                  <span>Mentees Requests</span>
                  {menteesQueue.length > 0 && <span className="bg-terra text-white text-[10px] px-2 py-0.5 rounded-full">{menteesQueue.length}</span>}
                </button>
                <button
                  onClick={() => { setActiveTab('queue_students'); setSelectedIds(new Set()); }}
                  className={`sidebar-nav-item w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'queue_students' ? 'active bg-terra/10 text-terra-dark dark:bg-terra-dark/30 dark:text-terra-light' : 'text-brown-600 hover:bg-brown-50 dark:text-brown-400 dark:hover:bg-dark-bg'}`}
                >
                  <span>Students Requests</span>
                  {studentsQueue.length > 0 && <span className="bg-brown-200 text-brown-800 dark:bg-brown-800 dark:text-brown-200 text-[10px] px-2 py-0.5 rounded-full">{studentsQueue.length}</span>}
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('history')}
              className={`sidebar-nav-item w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'history' ? 'active bg-terra/10 text-terra-dark dark:bg-terra-dark/30 dark:text-terra-light' : 'text-brown-600 hover:bg-brown-50 dark:text-brown-400 dark:hover:bg-dark-bg'}`}
            >
              <span>History Log</span>
            </button>
            <button
              onClick={() => setActiveTab('approved_od')}
              className={`sidebar-nav-item w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'approved_od' ? 'active bg-terra/10 text-terra-dark dark:bg-terra-dark/30 dark:text-terra-light' : 'text-brown-600 hover:bg-brown-50 dark:text-brown-400 dark:hover:bg-dark-bg'}`}
            >
              <span>Approved OD</span>
            </button>
            {user?.role !== 'hod' && (
              <button
                onClick={() => setActiveTab('apply')}
                className={`sidebar-nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'apply' ? 'active bg-terra/10 text-terra-dark dark:bg-terra-dark/30 dark:text-terra-light' : 'text-brown-600 hover:bg-brown-50 dark:text-brown-400 dark:hover:bg-dark-bg'}`}
              >
                Apply OD
              </button>
            )}
          </nav>

          {/* Bottom section */}
          <div className="pt-4 border-t border-brown-200 dark:border-dark-border flex items-center justify-between mt-auto">
            <NotificationBell onNotificationClick={handleNotificationClick} />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-brown-600 hover:text-rust dark:text-brown-400 dark:hover:text-rust-light transition-colors text-sm font-bold"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content container */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-cream/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-brown-200 dark:border-dark-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <div className="bg-terra text-white p-1.5 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="font-serif font-bold text-lg text-brown-900 dark:text-cream">Staff Portal</span>
          </div>
          <div className="hidden md:block text-brown-900 dark:text-cream font-bold text-lg font-serif">
            Welcome back, {user?.name?.split(' ')[0]}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="md:hidden flex gap-3">
              <NotificationBell onNotificationClick={handleNotificationClick} />
              <button onClick={handleLogout} className="text-brown-600 hover:text-rust dark:text-brown-400"><LogOut className="h-5 w-5"/></button>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Profile Card Banner */}
          <section className="card-warm rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-brown-200 dark:border-dark-border">
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-12 translate-y-12 text-terra dark:text-terra-light">
              <Briefcase className="h-64 w-64" />
            </div>
            <div className="space-y-2.5 relative z-10">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-brown-900 dark:text-cream">
                {user?.name}
              </h1>
              <p className="text-xs sm:text-sm text-brown-600 dark:text-brown-300 max-w-xl leading-relaxed">
                Review On-Duty requests from CSE students, verify the supporting details, and approve or return submissions from your queue.
              </p>
            </div>
            {/* Dept badge */}
            {user?.deptId && (
              <div className="bg-parchment/50 dark:bg-dark-surface/50 backdrop-blur-md rounded-2xl p-4 border border-brown-200 dark:border-dark-border shrink-0 text-center md:text-right relative z-10 shadow-sm">
                <span className="font-bold text-brown-800 dark:text-cream text-sm">Dept of Computer Science & Eng.</span>
              </div>
            )}
          </section>

          {/* Mobile Tabs (since sidebar hides on mobile) */}
          <div className="md:hidden flex items-center gap-3 border-b border-brown-200 dark:border-dark-border pb-px overflow-x-auto hide-scrollbar">
            {showSingleQueue ? (
              <button
                onClick={() => { setActiveTab('queue'); setSelectedIds(new Set()); }}
                className={`py-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'queue' ? 'border-terra text-terra-dark dark:border-terra-light dark:text-terra-light' : 'border-transparent text-brown-500 hover:text-brown-700 dark:text-brown-400 dark:hover:text-brown-200'}`}
              >
                Pending Reviews ({queue.length})
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setActiveTab('queue_mentees'); setSelectedIds(new Set()); }}
                  className={`py-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${(activeTab === 'queue_mentees' || activeTab === 'queue') ? 'border-terra text-terra-dark dark:border-terra-light dark:text-terra-light' : 'border-transparent text-brown-500 hover:text-brown-700 dark:text-brown-400 dark:hover:text-brown-200'}`}
                >
                  Mentees Requests ({menteesQueue.length})
                </button>
                <button
                  onClick={() => { setActiveTab('queue_students'); setSelectedIds(new Set()); }}
                  className={`py-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'queue_students' ? 'border-terra text-terra-dark dark:border-terra-light dark:text-terra-light' : 'border-transparent text-brown-500 hover:text-brown-700 dark:text-brown-400 dark:hover:text-brown-200'}`}
                >
                  Students ({studentsQueue.length})
                </button>
              </>
            )}
             <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'history' ? 'border-terra text-terra-dark dark:border-terra-light dark:text-terra-light' : 'border-transparent text-brown-500 hover:text-brown-700 dark:text-brown-400 dark:hover:text-brown-200'}`}
            >
              History Log
            </button>
            <button
              onClick={() => setActiveTab('approved_od')}
              className={`py-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'approved_od' ? 'border-terra text-terra-dark dark:border-terra-light dark:text-terra-light' : 'border-transparent text-brown-500 hover:text-brown-700 dark:text-brown-400 dark:hover:text-brown-200'}`}
            >
              Approved OD
            </button>
            {user?.role !== 'hod' && (
              <button
                onClick={() => setActiveTab('apply')}
                className={`py-3 px-2 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'apply' ? 'border-terra text-terra-dark dark:border-terra-light dark:text-terra-light' : 'border-transparent text-brown-500 hover:text-brown-700 dark:text-brown-400 dark:hover:text-brown-200'}`}
              >
                Apply OD
              </button>
            )}
          </div>

          {activeTab === 'queue' && showSingleQueue && (
            <div className="space-y-6 relative">
              {/* Bulk Action Bar */}
              {selectedIds.size > 0 && (
                <div className="sticky top-24 z-40 bg-terra-light/20 dark:bg-terra-dark/40 border border-terra-light dark:border-terra-dark rounded-2xl p-4 flex items-center justify-between shadow-lg backdrop-blur-md animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-terra text-white p-1.5 rounded-lg">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-terra-dark dark:text-terra-light">
                      {selectedIds.size} Request(s) Selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => setSelectedIds(new Set())} 
                       className="px-4 py-2 text-xs font-bold text-brown-600 hover:bg-brown-100 dark:text-brown-300 dark:hover:bg-dark-surface rounded-xl transition-colors"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={handleBulkApprove} 
                       disabled={actionLoading} 
                       className="btn-terra px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-50"
                     >
                       <Check className="h-4 w-4" />
                       Bulk Approve
                     </button>
                  </div>
                </div>
              )}

              <div className="card-warm rounded-3xl overflow-hidden shadow-sm">
                {renderQueueTable(queue)}
              </div>
            </div>
          )}

          {activeTab === 'queue_students' && !showSingleQueue && (
            <div className="space-y-6 relative">
              {/* Bulk Action Bar */}
              {selectedIds.size > 0 && (
                <div className="sticky top-24 z-40 bg-terra-light/20 dark:bg-terra-dark/40 border border-terra-light dark:border-terra-dark rounded-2xl p-4 flex items-center justify-between shadow-lg backdrop-blur-md animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-terra text-white p-1.5 rounded-lg">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-terra-dark dark:text-terra-light">
                      {selectedIds.size} Request(s) Selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => setSelectedIds(new Set())} 
                       className="px-4 py-2 text-xs font-bold text-brown-600 hover:bg-brown-100 dark:text-brown-300 dark:hover:bg-dark-surface rounded-xl transition-colors"
                     >
                       Cancel
                     </button>
                     <button 
                       onClick={handleBulkApprove} 
                       disabled={actionLoading} 
                       className="btn-terra px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-50"
                     >
                       <Check className="h-4 w-4" />
                       Bulk Approve
                     </button>
                  </div>
                </div>
              )}

              <div className="card-warm rounded-3xl overflow-hidden shadow-sm">
                {renderQueueTable(studentsQueue)}
              </div>
            </div>
          )}

          {(activeTab === 'queue_mentees' || (activeTab === 'queue' && !showSingleQueue)) && !showSingleQueue && (
            <div className="space-y-6 relative">
              <div className="card-warm rounded-3xl overflow-hidden shadow-sm">
                {renderQueueTable(menteesQueue, true)}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="card-warm rounded-3xl overflow-hidden shadow-sm">
              {/* History Filters */}
              <div className="p-4 border-b border-brown-200 dark:border-dark-border flex flex-wrap items-center gap-4 bg-parchment dark:bg-dark-surface">
                <div className="flex items-center gap-2 mr-2">
                  <Filter className="h-4 w-4 text-brown-500" />
                  <span className="text-xs font-bold text-brown-600 dark:text-brown-400 uppercase tracking-wider">Filters:</span>
                </div>
                
                <select
                  value={historyYearFilter}
                  onChange={(e) => setHistoryYearFilter(e.target.value)}
                  className="input-warm rounded-lg px-3 py-1.5 text-xs focus:ring-0 max-w-[120px]"
                >
                  <option value="">All Years</option>
                  <option value="2">Year II</option>
                  <option value="3">Year III</option>
                  <option value="4">Year IV</option>
                </select>

                <select
                  value={historySectionFilter}
                  onChange={(e) => setHistorySectionFilter(e.target.value)}
                  className="input-warm rounded-lg px-3 py-1.5 text-xs focus:ring-0 max-w-[120px]"
                >
                  <option value="">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>

                <input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="input-warm rounded-lg px-3 py-1.5 text-xs focus:ring-0"
                />

                {(historyYearFilter || historySectionFilter || historyDateFilter) && (
                  <button
                    onClick={() => {
                      setHistoryYearFilter('');
                      setHistorySectionFilter('');
                      setHistoryDateFilter('');
                    }}
                    className="text-xs font-bold text-rust hover:text-rust-light ml-auto transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                {filteredHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Clock className="h-12 w-12 text-brown-300 dark:text-brown-700" />
                    <h3 className="mt-4 text-sm font-bold text-brown-700 dark:text-brown-300">No actions recorded</h3>
                    <p className="mt-2 text-xs text-brown-500 dark:text-brown-400 max-w-xs">
                      You haven't logged any approval actions or rejection verdicts in the current term.
                    </p>
                  </div>
                ) : (
                  <table className="table-warm w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th>OD Date</th>
                        <th>Ref Code</th>
                        <th>Student</th>
                        <th>Event details</th>
                        <th>Your Verdict</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((log) => (
                        <tr key={log.id}>
                          <td className="font-medium whitespace-nowrap">
                            {log.request?.fromDate && log.request?.toDate
                              ? (new Date(log.request.fromDate).toDateString() === new Date(log.request.toDate).toDateString()
                                ? new Date(log.request.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : `${new Date(log.request.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} – ${new Date(log.request.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`)
                              : '—'}
                          </td>
                          <td className="font-mono text-xs font-bold">
                            {log.request?.odCode}
                          </td>
                          <td className="font-semibold">
                            {log.request?.student?.user?.name}
                            <span className="block text-[10px] font-normal text-brown-500 dark:text-brown-400 mt-0.5">
                              {log.request?.student ? `Year ${log.request.student.year} - Sec ${log.request.student.section}` : ''}
                            </span>
                          </td>
                          <td className="font-medium">
                            {log.request?.eventName}
                          </td>
                          <td>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${log.action === 'APPROVED' ? 'bg-olive-light/20 text-olive-dark dark:bg-olive-dark/30 dark:text-olive-light' : 'bg-rust-light/20 text-rust dark:bg-rust/30 dark:text-rust-light'}`}>
                              ● {log.action}
                            </span>
                          </td>
                          <td className="italic text-xs max-w-xs truncate text-brown-500 dark:text-brown-400">
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

          {activeTab === 'approved_od' && (
            <div className="card-warm rounded-3xl overflow-hidden shadow-sm">
              {/* Approved OD Filters */}
              <div className="p-4 border-b border-brown-200 dark:border-dark-border flex flex-wrap items-center gap-4 bg-parchment dark:bg-dark-surface">
                <div className="flex items-center gap-2 mr-2">
                  <Filter className="h-4 w-4 text-brown-500" />
                  <span className="text-xs font-bold text-brown-600 dark:text-brown-400 uppercase tracking-wider">Filters:</span>
                </div>
                
                <input
                  type="text"
                  placeholder="Search student, reg no, code..."
                  value={approvedSearchQuery}
                  onChange={(e) => setApprovedSearchQuery(e.target.value)}
                  className="input-warm rounded-lg px-3 py-1.5 text-xs focus:ring-0 max-w-[200px]"
                />

                <select
                  value={approvedYearFilter}
                  onChange={(e) => setApprovedYearFilter(e.target.value)}
                  className="input-warm rounded-lg px-3 py-1.5 text-xs focus:ring-0 max-w-[120px]"
                >
                  <option value="">All Years</option>
                  <option value="2">Year II</option>
                  <option value="3">Year III</option>
                  <option value="4">Year IV</option>
                </select>

                <select
                  value={approvedSectionFilter}
                  onChange={(e) => setApprovedSectionFilter(e.target.value)}
                  className="input-warm rounded-lg px-3 py-1.5 text-xs focus:ring-0 max-w-[120px]"
                >
                  <option value="">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>

                <select
                  value={approvedTypeFilter}
                  onChange={(e) => setApprovedTypeFilter(e.target.value)}
                  className="input-warm rounded-lg px-3 py-1.5 text-xs focus:ring-0 max-w-[120px]"
                >
                  <option value="">All Types</option>
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External</option>
                </select>

                <input
                  type="date"
                  value={approvedDateFilter}
                  onChange={(e) => setApprovedDateFilter(e.target.value)}
                  className="input-warm rounded-lg px-3 py-1.5 text-xs focus:ring-0"
                />

                {(approvedYearFilter || approvedSectionFilter || approvedDateFilter || approvedTypeFilter || approvedSearchQuery) && (
                  <button
                    onClick={() => {
                      setApprovedYearFilter('');
                      setApprovedSectionFilter('');
                      setApprovedDateFilter('');
                      setApprovedTypeFilter('');
                      setApprovedSearchQuery('');
                    }}
                    className="text-xs font-bold text-rust hover:text-rust-light ml-auto transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                {filteredApprovedOds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <Check className="h-12 w-12 text-brown-300 dark:text-brown-700" />
                    <h3 className="mt-4 text-sm font-bold text-brown-700 dark:text-brown-300">No approved OD requests</h3>
                    <p className="mt-2 text-xs text-brown-500 dark:text-brown-400 max-w-xs">
                      No fully approved student OD records match your current filter settings.
                    </p>
                  </div>
                ) : (
                  <table className="table-warm w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th>OD Date</th>
                        <th>Ref Code</th>
                        <th>Student Details</th>
                        <th>OD Type</th>
                        <th>Event Details</th>
                        <th>Duration</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApprovedOds.map((req) => (
                        <tr key={req.id}>
                          <td className="font-medium whitespace-nowrap">
                            {req.fromDate && req.toDate
                              ? (new Date(req.fromDate).toDateString() === new Date(req.toDate).toDateString()
                                ? new Date(req.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : `${new Date(req.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} – ${new Date(req.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`)
                              : '—'}
                          </td>
                          <td className="font-mono text-xs font-bold">
                            {req.odCode}
                          </td>
                          <td className="font-semibold">
                            {req.student?.user?.name}
                            <span className="block text-[10px] font-normal text-brown-500 dark:text-brown-400 mt-0.5">
                              {req.student ? `Reg No: ${req.student.regNo} | Yr ${req.student.year} - Sec ${req.student.section}` : ''}
                            </span>
                          </td>
                          <td>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${req.odType === 'INTERNAL' ? 'bg-terra-light/20 text-terra-dark dark:bg-terra-dark/30 dark:text-terra-light' : 'bg-olive-light/20 text-olive-dark dark:bg-olive-dark/30 dark:text-olive-light'}`}>
                              {req.odType}
                            </span>
                          </td>
                          <td className="font-medium">
                            {req.eventName}
                            {req.odType === 'EXTERNAL' && (
                              <span className="block text-[10px] font-normal text-brown-500 dark:text-brown-400 mt-0.5">
                                at {req.collegeName}
                              </span>
                            )}
                          </td>
                          <td className="font-semibold text-xs text-brown-700 dark:text-brown-300">
                            {req.odType === 'INTERNAL' 
                              ? `Periods ${req.fromPeriod}–${req.toPeriod} (${req.toPeriod - req.fromPeriod + 1} Periods)`
                              : `${getOdDayCount(req)} Days`}
                          </td>
                          <td className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEvaluateModal(req)}
                                className="px-3 py-1.5 rounded-lg border border-brown-200 text-brown-700 hover:bg-brown-50 dark:border-dark-border dark:text-brown-300 dark:hover:bg-dark-surface text-xs font-bold transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => studentService.downloadPdf(req.id)}
                                className="px-3 py-1.5 rounded-lg bg-olive text-white hover:bg-olive-dark text-xs font-bold transition-colors"
                              >
                                Download Letter
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {user?.role !== 'hod' && activeTab === 'apply' && (
            <div className="card-warm rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="max-w-3xl mx-auto space-y-8">
                <div>
                  <h2 className="text-xl font-serif font-bold text-brown-900 dark:text-cream">Apply OD for Students</h2>
                  <p className="text-sm text-brown-600 dark:text-brown-300 mt-1 leading-relaxed">
                    Select multiple students and apply for an On-Duty permission on their behalf. The request will bypass mentors and be sent directly to the Chairperson for final approval.
                  </p>
                </div>

                <form onSubmit={handleApplyBulkOd} className="space-y-8">
                  {/* Select Students Component */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      Select Students
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-brown-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search by student name or register number..."
                        className="input-warm pl-10 block w-full"
                      />
                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-parchment dark:bg-dark-surface border border-brown-200 dark:border-dark-border rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {searchResults.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectStudent(s)}
                              className="w-full text-left px-4 py-3 hover:bg-brown-50 dark:hover:bg-dark-bg border-b border-brown-100 dark:border-dark-border last:border-0 flex justify-between items-center transition-colors"
                            >
                              <div>
                                <span className="font-bold text-brown-900 dark:text-cream block">{s.user.name}</span>
                                <span className="text-xs text-brown-500 dark:text-brown-400">{s.regNo} | {s.department.code}</span>
                              </div>
                              <Plus className="h-4 w-4 text-terra" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Selected Tags */}
                    {selectedStudents.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedStudents.map((s) => (
                          <div key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-terra-light/20 text-terra-dark dark:bg-terra-dark/30 dark:text-terra-light rounded-lg text-xs font-bold shadow-sm">
                            <span>{s.user.name} ({s.regNo})</span>
                            <button
                              type="button"
                              onClick={() => removeStudent(s.id)}
                              className="text-terra-dark/70 hover:text-rust dark:text-terra-light/70 dark:hover:text-rust-light transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase">Event Name</label>
                      <input
                        type="text"
                        required
                        value={applyForm.eventName}
                        onChange={e => setApplyForm({...applyForm, eventName: e.target.value})}
                        className="input-warm w-full"
                        placeholder="E.g., Hackathon 2026"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase">Venue / College</label>
                      <input
                        type="text"
                        required
                        value={applyForm.collegeName}
                        onChange={e => setApplyForm({...applyForm, collegeName: e.target.value})}
                        className="input-warm w-full"
                        placeholder="E.g., IIT Madras"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase">Main Event Date</label>
                      <input
                        type="date"
                        required
                        value={applyForm.eventDate}
                        onChange={e => setApplyForm({...applyForm, eventDate: e.target.value})}
                        className="input-warm w-full"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase">OD From</label>
                        <input
                          type="date"
                          required
                          value={applyForm.fromDate}
                          onChange={e => setApplyForm({...applyForm, fromDate: e.target.value})}
                          className="input-warm w-full"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase">OD To</label>
                        <input
                          type="date"
                          required
                          value={applyForm.toDate}
                          onChange={e => setApplyForm({...applyForm, toDate: e.target.value})}
                          className="input-warm w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase">Reason / Work Details</label>
                    <textarea
                      required
                      rows="3"
                      value={applyForm.reason}
                      onChange={e => setApplyForm({...applyForm, reason: e.target.value})}
                      className="input-warm w-full resize-none"
                      placeholder="Explain why OD is required for these students..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase">Photo Proof / Brochure (Optional)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-parchment dark:bg-dark-surface border border-dashed border-brown-300 dark:border-dark-border rounded-xl cursor-pointer hover:bg-brown-50 dark:hover:bg-dark-bg transition-colors flex-1">
                        <Upload className="h-5 w-5 text-brown-500" />
                        <span className="text-sm font-bold text-brown-700 dark:text-brown-300">
                          {applyFile ? applyFile.name : 'Upload PDF/Image'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => setApplyFile(e.target.files[0])}
                        />
                      </label>
                      {applyFile && (
                        <button
                          type="button"
                          onClick={() => setApplyFile(null)}
                          className="p-3 text-rust hover:bg-rust-light/20 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brown-200 dark:border-dark-border">
                    <button
                      type="submit"
                      disabled={applyLoading || selectedStudents.length === 0}
                      className="btn-terra w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {applyLoading ? 'Applying...' : 'Submit Bulk OD Request'}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'view_request' && viewingRequest && (
            <div className="space-y-6">
              {/* Back Button & Top Navigation Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveTab('queue');
                    setViewingRequest(null);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-parchment hover:bg-brown-100 text-brown-800 dark:bg-dark-surface dark:hover:bg-dark-border dark:text-cream font-bold text-xs transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brown-500 font-medium">Ref Code:</span>
                  <span className="font-mono text-sm font-bold text-brown-900 dark:text-cream">{viewingRequest.odCode}</span>
                </div>
              </div>

              {/* Header Overview Card */}
              <div className="card-warm rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brown-200 dark:border-dark-border pb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-serif font-bold text-brown-900 dark:text-cream">
                        {viewingRequest.student?.user?.name || 'Student Request'}
                      </h2>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${viewingRequest.odType === 'INTERNAL' ? 'bg-terra-light/20 text-terra-dark dark:bg-terra-dark/30 dark:text-terra-light' : 'bg-olive-light/20 text-olive-dark dark:bg-olive-dark/30 dark:text-olive-light'}`}>
                        {viewingRequest.odType} OD
                      </span>
                    </div>
                    <p className="text-xs text-brown-600 dark:text-brown-400 mt-1 font-medium">
                      Reg No: <span className="font-bold">{viewingRequest.student?.regNo || '—'}</span> | Department: <span className="font-bold">{viewingRequest.student?.deptId?.toUpperCase() || viewingRequest.student?.dept?.name}</span> | Year {viewingRequest.student?.year} - Sec {viewingRequest.student?.section}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={viewingRequest.status} />
                    {viewingRequest.status === 'APPROVED' && (
                      <button
                        onClick={() => studentService.downloadPdf(viewingRequest.id)}
                        className="px-4 py-2 rounded-xl bg-olive text-white hover:bg-olive-dark text-xs font-bold transition-colors flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Letter PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Event Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      Event Details
                    </h3>
                    <div className="bg-parchment/60 dark:bg-dark-surface/60 rounded-2xl p-5 space-y-3.5 border border-brown-100 dark:border-dark-border text-xs">
                      <div>
                        <span className="text-brown-500 dark:text-brown-400 font-medium">Event Name:</span>
                        <p className="text-sm font-bold text-brown-900 dark:text-cream mt-0.5">{viewingRequest.eventName}</p>
                      </div>
                      {viewingRequest.odType === 'EXTERNAL' && viewingRequest.collegeName && (
                        <div>
                          <span className="text-brown-500 dark:text-brown-400 font-medium">Institution / Venue:</span>
                          <p className="font-semibold text-brown-800 dark:text-cream-dark mt-0.5">{viewingRequest.collegeName}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-brown-500 dark:text-brown-400 font-medium">Duration / Timeline:</span>
                        <p className="font-semibold text-brown-800 dark:text-cream-dark mt-0.5">
                          {viewingRequest.odType === 'INTERNAL'
                            ? `Date: ${new Date(viewingRequest.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (Periods ${viewingRequest.fromPeriod} to ${viewingRequest.toPeriod})`
                            : `${new Date(viewingRequest.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(viewingRequest.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (${getOdDayCount(viewingRequest)} Days)`
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-brown-500 dark:text-brown-400 font-medium">Reason / Description:</span>
                        <p className="italic text-brown-700 dark:text-brown-300 mt-0.5">{viewingRequest.reason || 'No detailed reason provided.'}</p>
                      </div>
                      {viewingRequest.odType === 'INTERNAL' && viewingRequest.photoProofUrl && (
                        <div className="pt-2">
                          <a
                            href={`http://localhost:5000${viewingRequest.photoProofUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brown-100 hover:bg-brown-200 dark:bg-dark-border dark:hover:bg-dark-surface text-brown-800 dark:text-cream text-xs font-bold transition-colors"
                          >
                            <Paperclip className="h-4 w-4" />
                            View Photo Proof
                          </a>
                        </div>
                      )}
                      {viewingRequest.odType === 'EXTERNAL' && viewingRequest.brochureUrl && (
                        <div className="pt-2">
                          <a
                            href={`http://localhost:5000${viewingRequest.brochureUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brown-100 hover:bg-brown-200 dark:bg-dark-border dark:hover:bg-dark-surface text-brown-800 dark:text-cream text-xs font-bold transition-colors"
                          >
                            <Paperclip className="h-4 w-4" />
                            View Event Brochure / Invitation
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Approval Timeline */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      Approval Timeline & Progress
                    </h3>
                    <div className="bg-parchment/60 dark:bg-dark-surface/60 rounded-2xl p-5 border border-brown-100 dark:border-dark-border">
                      <ApprovalTimeline odRequest={viewingRequest} />
                    </div>
                  </div>
                </div>

                {/* Staff Action Section if Pending */}
                {viewingRequest.status === 'PENDING' && (
                  <div className="pt-6 border-t border-brown-200 dark:border-dark-border space-y-4">
                    <h3 className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      Evaluation & Action
                    </h3>
                    <div className="space-y-3 max-w-2xl">
                      <textarea
                        rows={3}
                        value={detailRemarks}
                        onChange={(e) => setDetailRemarks(e.target.value)}
                        placeholder="Provide evaluation remarks or mandatory rejection cause here..."
                        className="input-warm w-full resize-none block text-xs"
                      />
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDetailAction(false)}
                          disabled={detailActionLoading}
                          className="px-5 py-2.5 rounded-xl border-2 border-rust text-rust hover:bg-rust hover:text-white dark:border-rust-light dark:text-rust-light dark:hover:bg-rust-light dark:hover:text-dark-bg font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Reject Request
                        </button>
                        <button
                          onClick={() => handleDetailAction(true)}
                          disabled={detailActionLoading}
                          className="btn-terra px-5 py-2.5 text-xs flex items-center gap-2 disabled:opacity-50 font-bold"
                        >
                          <Check className="h-4 w-4" />
                          Approve Request
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- EVALUATE DIALOG MODAL --- */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-brown-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-warm rounded-3xl border border-brown-200 dark:border-dark-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-brown-100 dark:border-dark-border flex items-center justify-between bg-parchment/50 dark:bg-dark-surface/50">
              <div>
                <span className="text-[10px] font-bold text-brown-500 dark:text-brown-400 uppercase tracking-widest block font-mono">
                  Reviewing Ref: {selectedRequest.odCode}
                </span>
                <h3 className="text-lg font-serif font-bold text-brown-900 dark:text-cream mt-0.5">
                  Evaluate On-Duty Request
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-brown-400 hover:text-brown-700 dark:text-brown-500 dark:hover:text-cream transition-colors bg-brown-50 dark:bg-dark-bg p-2 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-cream dark:bg-dark-bg">
              {/* Profile Block */}
              <div className="bg-parchment dark:bg-dark-surface p-4 rounded-2xl border border-brown-100 dark:border-dark-border space-y-3">
                <span className="text-[10px] font-bold text-terra uppercase tracking-widest block">Student Profile</span>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div>
                    <span className="text-brown-500 dark:text-brown-400 block mb-1 text-[9px] font-bold uppercase tracking-wider">Name:</span>
                    <span className="font-bold text-brown-900 dark:text-cream text-sm">{selectedRequest.student?.user?.name}</span>
                  </div>
                  <div>
                    <span className="text-brown-500 dark:text-brown-400 block mb-1 text-[9px] font-bold uppercase tracking-wider">Reg. No:</span>
                    <span className="font-bold text-brown-900 dark:text-cream text-sm">{selectedRequest.student?.regNo}</span>
                  </div>
                  <div>
                    <span className="text-brown-500 dark:text-brown-400 block mb-1 text-[9px] font-bold uppercase tracking-wider">Class / Dept:</span>
                    <span className="font-bold text-brown-900 dark:text-cream text-sm">Year {selectedRequest.student?.year} | CSE ({selectedRequest.student?.department?.code})</span>
                  </div>
                  <div>
                    <span className="text-brown-500 dark:text-brown-400 block mb-1 text-[9px] font-bold uppercase tracking-wider">Scholar Type:</span>
                    <span className="font-bold text-brown-900 dark:text-cream text-sm">{selectedRequest.studentType?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Event Specs Block */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-terra uppercase tracking-widest block">Event Details</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-3 bg-parchment/50 dark:bg-dark-surface/50 p-3 rounded-xl border border-brown-50 dark:border-dark-border/50">
                    <School className="h-5 w-5 text-terra shrink-0 mt-0.5" />
                    <div>
                      <span className="text-brown-500 dark:text-brown-400 block text-[9px] font-bold uppercase tracking-wider mb-1">Venue</span>
                      <span className="text-brown-900 dark:text-cream font-bold text-sm">{selectedRequest.collegeName}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-parchment/50 dark:bg-dark-surface/50 p-3 rounded-xl border border-brown-50 dark:border-dark-border/50">
                    <Calendar className="h-5 w-5 text-terra shrink-0 mt-0.5" />
                    <div>
                      <span className="text-brown-500 dark:text-brown-400 block text-[9px] font-bold uppercase tracking-wider mb-1">
                        {selectedRequest.odType === 'INTERNAL' ? 'Period Range' : 'Permission Dates'}
                      </span>
                      <span className="text-brown-900 dark:text-cream font-bold text-sm">
                        {selectedRequest.odType === 'INTERNAL'
                          ? `Period ${selectedRequest.fromPeriod} to Period ${selectedRequest.toPeriod}`
                          : `${new Date(selectedRequest.fromDate).toLocaleDateString('en-IN')} to ${new Date(selectedRequest.toDate).toLocaleDateString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <span className="text-brown-500 dark:text-brown-400 block text-[9px] font-bold uppercase tracking-wider">Purpose of Leave</span>
                  <p className="p-4 bg-parchment dark:bg-dark-surface border border-brown-100 dark:border-dark-border rounded-xl leading-relaxed text-brown-800 dark:text-brown-200 text-sm">
                    {selectedRequest.reason}
                  </p>
                </div>

                {selectedRequest.brochureUrl && (
                  <a
                    href={`http://localhost:5000${selectedRequest.brochureUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-terra hover:text-terra-dark dark:text-terra-light dark:hover:text-cream transition-colors bg-terra-light/10 dark:bg-terra-dark/20 px-3 py-2 rounded-lg"
                  >
                    <FileText className="h-4 w-4" />
                    View Brochure Attachment
                  </a>
                )}
              </div>

              {/* Approval logs timeline inside the modal so reviews can see preceding logs */}
              {selectedRequest.logs && selectedRequest.logs.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-terra uppercase tracking-widest block">Preceding Signatures Log</span>
                  <div className="space-y-2">
                    {selectedRequest.logs.map((log, index) => (
                      <div key={index} className="flex gap-3 text-xs bg-parchment/50 p-3 rounded-xl border border-brown-100 dark:bg-dark-surface/50 dark:border-dark-border">
                        <span className="h-5 w-5 bg-olive text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-brown-900 dark:text-cream">
                            Approved by {log.approver?.name || 'Staff Holder'} [{log.role.toUpperCase()}]
                          </span>
                          {log.remarks && (
                            <span className="text-xs text-brown-600 dark:text-brown-400 italic mt-1">"{log.remarks}"</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluate Remarks Intake */}
              {selectedRequest.status === 'PENDING' && (
                <div className="space-y-2 pt-2">
                  <label htmlFor="remarks" className="text-xs font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                    Evaluation Remarks / Rejection Cause
                  </label>
                  <textarea
                    id="remarks"
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={user?.role === 'mentor' ? 'e.g. Verified student academic records. Highly recommended.' : 'Provide feedback or notes here.'}
                    className="input-warm w-full resize-none block"
                  ></textarea>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-5 bg-parchment border-t border-brown-100 dark:bg-dark-surface dark:border-dark-border flex items-center justify-between gap-4">
              {selectedRequest.status === 'APPROVED' ? (
                <>
                  <button
                    onClick={() => studentService.downloadPdf(selectedRequest.id)}
                    className="px-5 py-2.5 rounded-xl bg-olive text-white hover:bg-olive-dark font-bold text-xs transition-colors flex items-center gap-2"
                  >
                    Download Letter PDF
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="btn-terra px-5 py-2.5 text-xs font-bold"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCloseModal}
                    disabled={actionLoading}
                    className="px-4 py-2.5 text-xs font-bold text-brown-600 hover:text-brown-900 dark:text-brown-400 dark:hover:text-cream disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAction(false)}
                      disabled={actionLoading}
                      className="px-5 py-2.5 rounded-xl border-2 border-rust text-rust hover:bg-rust hover:text-white dark:border-rust-light dark:text-rust-light dark:hover:bg-rust-light dark:hover:text-dark-bg font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleAction(true)}
                      disabled={actionLoading}
                      className="btn-terra px-5 py-2.5 text-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      Approve & Forward
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

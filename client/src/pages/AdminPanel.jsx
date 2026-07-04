// client/src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService, studentService } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Users,
  FileSpreadsheet,
  BarChart3,
  Plus,
  Trash2,
  Edit,
  Download,
  Shield,
  LogOut,
  GraduationCap,
  Briefcase,
  SlidersHorizontal
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import StatusBadge from '../components/StatusBadge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#F59E0B', '#0F172A'];

export default function AdminPanel() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // Lists
  const [usersList, setUsersList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [reportData, setReportData] = useState(null);

  // Filters for OD
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // CRUD User Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState('');

  // Add User Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [deptId, setDeptId] = useState('');
  // Student Specific fields
  const [regNo, setRegNo] = useState('');
  const [year, setYear] = useState('1');
  const [section, setSection] = useState('A');
  const [type, setType] = useState('DAY_SCHOLAR');
  const [mentorId, setMentorId] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab, filterDept, filterStatus, filterType]);

  async function fetchAdminData() {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const users = await adminService.getUsers();
        setUsersList(users);
      } else if (activeTab === 'requests') {
        const filters = {};
        if (filterDept) filters.deptId = filterDept;
        if (filterStatus) filters.status = filterStatus;
        if (filterType) filters.type = filterType;
        const reqs = await adminService.getRequests(filters);
        setRequestsList(reqs);
      } else if (activeTab === 'analytics') {
        const report = await adminService.getReport();
        setReportData(report);
      }
    } catch (err) {
      toast.error('Failed to synchronize administrative database.');
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const handleOpenAddUser = () => {
    setIsEditing(false);
    setName('');
    setEmail('');
    setPassword('');
    setRole('student');
    setDeptId('');
    setRegNo('');
    setYear('1');
    setSection('A');
    setType('DAY_SCHOLAR');
    setMentorId('');
    setShowAddUserModal(true);
  };

  const handleOpenEditUser = (u) => {
    setIsEditing(true);
    setEditUserId(u.id);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setDeptId(u.deptId || '');
    if (u.role === 'student' && u.student) {
      setRegNo(u.student.regNo || '');
      setYear(String(u.student.year || '1'));
      setSection(u.student.section || 'A');
      setType(u.student.type || 'DAY_SCHOLAR');
      setMentorId(u.student.mentorId || '');
    } else {
      setRegNo('');
      setYear('1');
      setSection('A');
      setType('DAY_SCHOLAR');
      setMentorId('');
    }
    setShowAddUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();

    if (!name || !email || (!isEditing && !password)) {
      return toast.error('Name, email, and password are required fields.');
    }

    const payload = {
      name,
      email,
      role,
      deptId: deptId || undefined
    };

    if (password) {
      payload.password = password;
    }

    if (role === 'student') {
      payload.regNo = regNo;
      payload.year = year;
      payload.section = section;
      payload.type = type;
      payload.mentorId = mentorId;
      payload.deptId = deptId;
    }

    const toastId = toast.loading(isEditing ? 'Updating user details...' : 'Creating new system account...');

    try {
      if (isEditing) {
        await adminService.updateUser(editUserId, payload);
        toast.success('User updated successfully!', { id: toastId });
      } else {
        await adminService.createUser(payload);
        toast.success('Account created successfully!', { id: toastId });
      }
      setShowAddUserModal(false);
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to persist user changes.';
      toast.error(errMsg, { id: toastId });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this user? This action is irreversible.')) return;

    const toastId = toast.loading('Removing user account...');
    try {
      await adminService.deleteUser(id);
      toast.success('User deleted successfully.', { id: toastId });
      await fetchAdminData();
    } catch (err) {
      toast.error('Failed to delete user. Ensure they do not have active logs.', { id: toastId });
    }
  };

  const handleExportCsv = () => {
    // Direct link to backend export CSV endpoint which downloads it instantly
    window.open(adminService.getExportUrl(), '_blank');
    toast.success('Compiling CSV report for download.');
  };

  // Hardcode Departments & Mentors from our Seed DB to simplify UI options
  const departments = [
    { id: 'cse-dept-id', name: 'Computer Science and Engineering', code: 'CSE' } // Seeder auto matches CSE
  ];
  
  const mentors = [
    { id: 'mentor-1-id', name: 'Mrs. R. Mythili [Mentor 1]' },
    { id: 'mentor-2-id', name: 'Dr. G. Hariharan [Mentor 2]' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="sticky top-0 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500 text-white p-1.5 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">
              KCET Administrative Panel
            </span>
          </div>

          <div className="flex items-center gap-4">
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

      {/* Main Administrative Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Banner */}
        <section className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-widest">
              Security Controller
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Administration</h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
              Consolidated database control. Manage staff accounts, edit student cohorts, audit OD requests, and export certified Excel sheets.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all shrink-0"
          >
            <Download className="h-4 w-4" />
            Export CSV Audit Report
          </button>
        </section>

        {/* Tab Selection */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-px">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'users' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              <Users className="h-4.5 w-4.5" />
              Users Database
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              <FileSpreadsheet className="h-4.5 w-4.5" />
              Audit OD Requests
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              Analytics Insights
            </button>
          </div>

          {/* TAB CONTENT: 1. USERS CRUD */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Add, edit, or deactivate student, faculty, and administrative credentials.
                </p>
                <button
                  onClick={handleOpenAddUser}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/10 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New User
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm dark:bg-navy-900 dark:border-slate-800/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 dark:bg-navy-950 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800/40">
                        <th className="px-6 py-4">Name / Email</th>
                        <th className="px-6 py-4">System Role</th>
                        <th className="px-6 py-4">Department</th>
                        <th className="px-6 py-4">Student Profile Details</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{u.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400' : u.role === 'student' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                            {u.department ? `${u.department.name} (${u.department.code})` : 'College Global'}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {u.role === 'student' && u.student ? (
                              <div className="flex flex-col gap-0.5">
                                <span>Reg No: <strong className="text-slate-700 dark:text-slate-200">{u.student.regNo}</strong></span>
                                <span>Year {u.student.year} | Sec {u.student.section} | {u.student.type?.replace('_', ' ')}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3.5">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="text-slate-400 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400"
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. OD REQUESTS WITH FILTERS */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Sliders / Filters Header */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <SlidersHorizontal className="h-4.5 w-4.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Filter Registry:</span>
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Filter Status */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-navy-950 dark:text-slate-300"
                  >
                    <option value="">Status: All</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>

                  {/* Filter Scholar Type */}
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-navy-950 dark:text-slate-300"
                  >
                    <option value="">Type: All Scholars</option>
                    <option value="DAY_SCHOLAR">DAY SCHOLAR</option>
                    <option value="HOSTELLER">HOSTELLER</option>
                  </select>

                  {/* Filter Department */}
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-navy-950 dark:text-slate-300"
                  >
                    <option value="">Dept: All Departments</option>
                    <option value="cse-dept-id">Computer Science (CSE)</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm dark:bg-navy-900 dark:border-slate-800/60 overflow-hidden">
                <div className="overflow-x-auto">
                  {requestsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <FileSpreadsheet className="h-12 w-12 text-slate-500 dark:text-slate-700" />
                      <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">No requests match filters</h3>
                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                        Audit records show no OD requests matching your select query criteria.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 dark:bg-navy-950 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800/40">
                          <th className="px-6 py-4">Ref Code</th>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Event specifications</th>
                          <th className="px-6 py-4">OD Period</th>
                          <th className="px-6 py-4">Scholar Type</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Date Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                        {requestsList.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                              {req.odCode}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{req.student?.user?.name}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Reg No: {req.student?.regNo} | CSE ({req.student?.department?.code})</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{req.eventName}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{req.collegeName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                              <div className="flex flex-col">
                                <span>{new Date(req.fromDate).toLocaleDateString('en-IN')}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">to {new Date(req.toDate).toLocaleDateString('en-IN')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {req.studentType?.replace('_', ' ')}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={req.status} currentStage={req.currentStage} />
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(req.createdAt).toLocaleDateString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. ANALYTICS GRAPHS (RECHARTS) */}
          {activeTab === 'analytics' && reportData && (
            <div className="space-y-8">
              {/* Counters boxes Row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm text-center">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Total ODs</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{reportData.counters?.totalRequests}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm text-center">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Approved</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{reportData.counters?.approved}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm text-center">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Pending</span>
                  <span className="text-2xl font-black text-amber-500 mt-1 block">{reportData.counters?.pending}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm text-center">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Cohort Size</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{reportData.counters?.totalStudents} Students</span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm text-center col-span-2 lg:col-span-1">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Faculty Board</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{reportData.counters?.totalStaff} Admins</span>
                </div>
              </div>

              {/* Recharts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Requests per month (AreaChart) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm dark:bg-navy-900 dark:border-slate-800/60">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">OD Workloads by Month</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportData.requestsPerMonth}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="count" name="Submissions" stroke="#F59E0B" fillOpacity={0.1} fill="#F59E0B" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Approval Rate by Department (BarChart) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm dark:bg-navy-900 dark:border-slate-800/60">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Approval Rates by Department (%)</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.approvalRateByDept}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="department" tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis tickLine={false} tick={{ fontSize: 10 }} unit="%" />
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Bar dataKey="rate" name="Approval Rate" fill="#0F172A" radius={[6, 6, 0, 0]} maxBarSize={45}>
                          {reportData.approvalRateByDept.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0F172A' : '#F59E0B'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Day Scholar vs Hosteller ratio (PieChart) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm dark:bg-navy-900 dark:border-slate-800/60 lg:col-span-2 max-w-xl mx-auto w-full">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 text-center">Day Scholar vs Hosteller Distribution</h3>
                  <div className="h-64 flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.typeRatio}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {reportData.typeRatio.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* --- ADD / EDIT USER DIALOG MODAL --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/80 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit User Credentials' : 'Add New System Account'}
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Karthik Raja S"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white dark:placeholder-slate-650"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. karthik@student.tnec.edu.in"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white dark:placeholder-slate-650"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {isEditing ? 'Reset Password (Leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white dark:placeholder-slate-650"
                />
              </div>

              {/* System Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isEditing}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-navy-950 dark:text-white"
                >
                  <option value="student">STUDENT</option>
                  <option value="mentor">MENTOR (FACULTY)</option>
                  <option value="chairperson">CHAIRPERSON (FACULTY)</option>
                  <option value="hod">HOD (DEPT HEAD)</option>
                  <option value="principal">PRINCIPAL</option>
                  <option value="warden">HOSTEL WARDEN</option>
                  <option value="admin">SYSTEM ADMIN</option>
                </select>
              </div>

              {/* Department Selector */}
              {role !== 'principal' && role !== 'warden' && role !== 'admin' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Assigned Department</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-navy-950 dark:text-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value="cse-dept-id">{d.name} ({d.code})</option> // maps to CSE seeder ID
                    ))}
                  </select>
                </div>
              )}

              {/* STUDENT SPECIFIC SECTION */}
              {role === 'student' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 dark:bg-navy-950/40 dark:border-slate-850 space-y-4">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Student Parameters Sheet</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Reg No */}
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Registration Number</label>
                      <input
                        type="text"
                        required
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        placeholder="e.g. 717822104001"
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-navy-900 dark:text-white"
                      />
                    </div>

                    {/* Class Year */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Class Year</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-navy-900 dark:text-white"
                      >
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                    </div>

                    {/* Section */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Class Section</label>
                      <input
                        type="text"
                        required
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        placeholder="A or B"
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-navy-900 dark:text-white"
                      />
                    </div>

                    {/* Scholar Type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Scholar Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-navy-900 dark:text-white"
                      >
                        <option value="DAY_SCHOLAR">DAY SCHOLAR</option>
                        <option value="HOSTELLER">HOSTELLER</option>
                      </select>
                    </div>

                    {/* Assigned Mentor */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Assigned Mentor</label>
                      <select
                        value={mentorId}
                        onChange={(e) => setMentorId(e.target.value)}
                        required
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs text-slate-700 dark:border-slate-800 dark:bg-navy-900 dark:text-white"
                      >
                        <option value="">Select Mentor</option>
                        {mentors.map(m => (
                          <option key={m.id} value="mentor-1-id">{m.name}</option> // Maps to Mentor 1 seeder ID Mrs. R. Mythili
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold shadow"
                >
                  {isEditing ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

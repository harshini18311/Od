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

const COLORS = ['#C75B39', '#6B7C4E', '#D4A853', '#795548', '#B94A3A'];

const displayRole = (role) => (
  role === 'mentor' || role === 'chairperson' ? 'STAFF' : role.toUpperCase()
);

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
        setUsersList([...users].sort((a, b) => {
          // Keep students together and sort their registration numbers naturally:
          // 24UCS001, 24UCS002, 24UCS003, ...
          if (a.student?.regNo && b.student?.regNo) {
            return a.student.regNo.localeCompare(b.student.regNo, undefined, {
              numeric: true,
              sensitivity: 'base'
            });
          }
          if (a.student?.regNo) return -1;
          if (b.student?.regNo) return 1;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        }));
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

  const handleExportCsv = async () => {
    const toastId = toast.loading('Compiling CSV report for download...');
    try {
      await adminService.downloadExport();
      toast.success('CSV report downloaded.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download report.', { id: toastId });
    }
  };

  // Hardcode Departments & Mentors from our Seed DB to simplify UI options
  const departments = [
    { id: 'cse-dept-id', name: 'Computer Science and Engineering', code: 'CSE' } // Seeder auto matches CSE
  ];
  
  const mentors = usersList.filter(u => ['mentor', 'chairperson', 'hod'].includes(u.role));

  return (
    <div className="min-h-screen flex bg-cream dark:bg-dark-bg font-sans transition-colors duration-300">
      
      {/* LEFT SIDEBAR */}
      <aside className="sidebar-nav fixed left-0 top-0 h-full w-[260px] hidden md:flex flex-col z-40 bg-parchment dark:bg-dark-surface border-r border-brown-200 dark:border-dark-border">
        <div className="p-6 flex flex-col gap-2 border-b border-brown-700/50">
          <div className="flex items-center gap-2 text-terra dark:text-terra-light">
            <Shield className="h-6 w-6" />
            <span className="font-serif font-bold text-lg text-cream">KCET CSE</span>
          </div>
          <span className="text-xs font-semibold text-brown-300 uppercase tracking-widest">
            Administration
          </span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`sidebar-nav-item w-full flex items-center gap-3 ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users className="h-4.5 w-4.5" />
            Users Database
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`sidebar-nav-item w-full flex items-center gap-3 ${activeTab === 'requests' ? 'active' : ''}`}
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            Audit OD Requests
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`sidebar-nav-item w-full flex items-center gap-3 ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            Analytics Insights
          </button>
        </div>

        <div className="p-4 border-t border-brown-200 dark:border-dark-border flex items-center justify-between">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="p-2 text-brown-600 hover:text-terra dark:text-brown-400 dark:hover:text-terra-light transition-colors rounded-lg hover:bg-brown-100 dark:hover:bg-dark-bg"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 md:ml-[260px] p-6 lg:p-8">
        
        {/* Top Bar with Title + Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold text-brown-900 dark:text-parchment">
              {activeTab === 'users' && 'Users Database'}
              {activeTab === 'requests' && 'Audit OD Requests'}
              {activeTab === 'analytics' && 'Analytics Insights'}
            </h1>
            <p className="text-sm text-brown-600 dark:text-brown-400 mt-1">
              {activeTab === 'users' && 'Manage CSE staff accounts and student cohorts.'}
              {activeTab === 'requests' && 'Review and track student on-duty requests.'}
              {activeTab === 'analytics' && 'View detailed reports and system usage metrics.'}
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="btn-terra shrink-0"
          >
            <Download className="h-4 w-4" />
            Export CSV Audit Report
          </button>
        </div>

        {/* TAB CONTENT: 1. USERS CRUD */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-brown-600 dark:text-brown-400">
                Directory of all active users in the system.
              </p>
              <button
                onClick={handleOpenAddUser}
                className="btn-terra"
              >
                <Plus className="h-4 w-4" />
                Add New User
              </button>
            </div>

            <div className="card-warm overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-warm">
                  <thead>
                    <tr>
                      <th className="px-6 py-4">Name / Email</th>
                      <th className="px-6 py-4">System Role</th>
                      <th className="px-6 py-4">CSE Department</th>
                      <th className="px-6 py-4">Student Profile Details</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-brown-900 dark:text-parchment">{u.name}</span>
                            <span className="text-xs text-brown-500 dark:text-brown-400 font-mono">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'admin' ? 'bg-rust-light/20 text-rust dark:bg-rust/20 dark:text-rust-light' : u.role === 'student' ? 'bg-olive-light/20 text-olive dark:bg-olive/20 dark:text-olive-light' : 'bg-gold-light/20 text-gold-dark dark:bg-gold/20 dark:text-gold-light'}`}>
                            {displayRole(u.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-brown-600 dark:text-brown-400 font-medium">
                          {u.department ? `${u.department.name} (${u.department.code})` : 'CSE Administration'}
                        </td>
                        <td className="px-6 py-4 text-xs text-brown-600 dark:text-brown-400">
                          {u.role === 'student' && u.student ? (
                            <div className="flex flex-col gap-0.5">
                              <span>Reg No: <strong className="text-brown-900 dark:text-parchment">{u.student.regNo}</strong></span>
                              <span>Year {u.student.year} | Sec {u.student.section} | {u.student.type?.replace('_', ' ')}</span>
                            </div>
                          ) : (
                            <span className="text-brown-400 dark:text-brown-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-3.5">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="text-brown-400 hover:text-terra dark:text-brown-500 dark:hover:text-terra-light"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-brown-400 hover:text-rust dark:text-brown-500 dark:hover:text-rust-light"
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
            {/* Filters Header */}
            <div className="card-warm p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 shrink-0 text-brown-600 dark:text-brown-400">
                <SlidersHorizontal className="h-4.5 w-4.5" />
                <span className="text-sm font-bold">Filter Registry:</span>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-warm w-full"
                >
                  <option value="">Status: All</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-warm w-full"
                >
                  <option value="">Type: All Scholars</option>
                  <option value="DAY_SCHOLAR">DAY SCHOLAR</option>
                  <option value="HOSTELLER">HOSTELLER</option>
                </select>

                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="input-warm w-full"
                >
                  <option value="">CSE Department</option>
                  <option value="cse-dept-id">Computer Science & Engineering (CSE)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="card-warm overflow-hidden p-0">
              <div className="overflow-x-auto">
                {requestsList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <FileSpreadsheet className="h-12 w-12 text-brown-400 dark:text-brown-600" />
                    <h3 className="mt-4 text-sm font-bold text-brown-700 dark:text-brown-300">No requests match filters</h3>
                    <p className="mt-2 text-xs text-brown-500 dark:text-brown-400 max-w-xs">
                      Audit records show no OD requests matching your select query criteria.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse table-warm">
                    <thead>
                      <tr>
                        <th className="px-6 py-4">Ref Code</th>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Event specifications</th>
                        <th className="px-6 py-4">OD Period</th>
                        <th className="px-6 py-4">Scholar Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Date Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestsList.map((req) => (
                        <tr key={req.id}>
                          <td className="px-6 py-4 font-mono text-xs font-bold text-brown-600 dark:text-brown-400">
                            {req.odCode}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-brown-900 dark:text-parchment">{req.student?.user?.name}</span>
                              <span className="text-[10px] text-brown-500 dark:text-brown-400 font-medium">Reg No: {req.student?.regNo} | CSE ({req.student?.department?.code})</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-brown-900 dark:text-parchment">{req.eventName}</span>
                              <span className="text-[10px] text-brown-500 dark:text-brown-400 font-medium">{req.collegeName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-brown-700 dark:text-brown-300 font-medium">
                            <div className="flex flex-col">
                              <span>{new Date(req.fromDate).toLocaleDateString('en-IN')}</span>
                              <span className="text-[10px] text-brown-500 dark:text-brown-400">to {new Date(req.toDate).toLocaleDateString('en-IN')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-brown-600 dark:text-brown-400">
                            {req.studentType?.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={req.status} currentStage={req.currentStage} />
                          </td>
                          <td className="px-6 py-4 text-brown-500 dark:text-brown-400 font-medium">
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
              <div className="card-warm p-5 text-center">
                <span className="text-brown-500 block text-[10px] font-bold uppercase tracking-wider">Total ODs</span>
                <span className="text-2xl font-black text-brown-900 dark:text-parchment mt-1 block">{reportData.counters?.totalRequests}</span>
              </div>
              <div className="card-warm p-5 text-center">
                <span className="text-brown-500 block text-[10px] font-bold uppercase tracking-wider">Approved</span>
                <span className="text-2xl font-black text-olive dark:text-olive-light mt-1 block">{reportData.counters?.approved}</span>
              </div>
              <div className="card-warm p-5 text-center">
                <span className="text-brown-500 block text-[10px] font-bold uppercase tracking-wider">Pending</span>
                <span className="text-2xl font-black text-gold-dark dark:text-gold mt-1 block">{reportData.counters?.pending}</span>
              </div>
              <div className="card-warm p-5 text-center">
                <span className="text-brown-500 block text-[10px] font-bold uppercase tracking-wider">Cohort Size</span>
                <span className="text-2xl font-black text-brown-900 dark:text-parchment mt-1 block">{reportData.counters?.totalStudents}</span>
              </div>
              <div className="card-warm p-5 text-center col-span-2 lg:col-span-1">
                <span className="text-brown-500 block text-[10px] font-bold uppercase tracking-wider">Faculty Board</span>
                <span className="text-2xl font-black text-brown-900 dark:text-parchment mt-1 block">{reportData.counters?.totalStaff}</span>
              </div>
            </div>

            {/* Recharts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Requests per month (AreaChart) */}
              <div className="card-warm p-6">
                <h3 className="text-sm font-bold text-brown-900 dark:text-parchment mb-6 font-serif">OD Workloads by Month</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.requestsPerMonth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D4A853" strokeOpacity={0.2} />
                      <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 10, fill: '#795548' }} />
                      <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#795548' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#F9F6F0', border: '1px solid #E6D5B8' }} />
                      <Area type="monotone" dataKey="count" name="Submissions" stroke="#C75B39" fillOpacity={0.2} fill="#C75B39" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Approval Rate by Department (BarChart) */}
              <div className="card-warm p-6">
                <h3 className="text-sm font-bold text-brown-900 dark:text-parchment mb-6 font-serif">CSE Approval Rate (%)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.approvalRateByDept}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D4A853" strokeOpacity={0.2} />
                      <XAxis dataKey="department" tickLine={false} tick={{ fontSize: 10, fill: '#795548' }} />
                      <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#795548' }} unit="%" />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#F9F6F0', border: '1px solid #E6D5B8' }} />
                      <Bar dataKey="rate" name="Approval Rate" fill="#6B7C4E" radius={[6, 6, 0, 0]} maxBarSize={45}>
                        {reportData.approvalRateByDept.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6B7C4E' : '#D4A853'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Day Scholar vs Hosteller ratio (PieChart) */}
              <div className="card-warm p-6 lg:col-span-2 max-w-xl mx-auto w-full">
                <h3 className="text-sm font-bold text-brown-900 dark:text-parchment mb-6 text-center font-serif">Day Scholar vs Hosteller Distribution</h3>
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
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', backgroundColor: '#F9F6F0', border: '1px solid #E6D5B8' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#795548' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- ADD / EDIT USER DIALOG MODAL --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-dark-bg/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-warm p-0 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-brown-200 dark:border-dark-border flex items-center justify-between bg-parchment dark:bg-dark-surface">
              <h3 className="text-base font-bold font-serif text-brown-900 dark:text-parchment">
                {isEditing ? 'Edit User Credentials' : 'Add New System Account'}
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-brown-500 hover:text-brown-700 dark:text-brown-400 dark:hover:text-parchment transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm bg-cream dark:bg-dark-bg">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brown-600 dark:text-brown-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Karthik Raja S"
                  className="input-warm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brown-600 dark:text-brown-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. karthik@student.tnec.edu.in"
                  className="input-warm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brown-600 dark:text-brown-400">
                  {isEditing ? 'Reset Password (Leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!isEditing}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-warm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brown-600 dark:text-brown-400">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isEditing}
                  className="input-warm"
                >
                  <option value="student">STUDENT</option>
                  <option value="mentor">MENTOR (FACULTY)</option>
                  <option value="chairperson">CHAIRPERSON (FACULTY)</option>
                  <option value="hod">HOD (DEPT HEAD)</option>
                  <option value="admin">SYSTEM ADMIN</option>
                </select>
              </div>

              {role !== 'admin' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brown-600 dark:text-brown-400">CSE Department</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    required
                    className="input-warm"
                  >
                    <option value="">Select CSE Department</option>
                    {departments.map(d => (
                      <option key={d.id} value="cse-dept-id">{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* STUDENT SPECIFIC SECTION */}
              {role === 'student' && (
                <div className="bg-parchment p-4 rounded-xl border border-brown-200 dark:bg-dark-surface dark:border-dark-border space-y-4">
                  <span className="text-[10px] font-bold text-terra uppercase tracking-widest block">Student Parameters Sheet</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-brown-600 dark:text-brown-400">Registration Number</label>
                      <input
                        type="text"
                        required
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        placeholder="e.g. 717822104001"
                        className="input-warm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-brown-600 dark:text-brown-400">Class Year</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="input-warm"
                      >
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-brown-600 dark:text-brown-400">Class Section</label>
                      <input
                        type="text"
                        required
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        placeholder="A or B"
                        className="input-warm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-brown-600 dark:text-brown-400">Scholar Type</label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="input-warm"
                      >
                        <option value="DAY_SCHOLAR">DAY SCHOLAR</option>
                        <option value="HOSTELLER">HOSTELLER</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-brown-600 dark:text-brown-400">Assigned Mentor</label>
                      <select
                        value={mentorId}
                        onChange={(e) => setMentorId(e.target.value)}
                        required
                        className="input-warm"
                      >
                        <option value="">Select Mentor</option>
                        {mentors.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.role.toUpperCase()})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-6 mt-2 border-t border-brown-200 dark:border-dark-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-sm font-bold text-brown-600 hover:text-brown-800 dark:text-brown-400 dark:hover:text-parchment transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-terra"
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

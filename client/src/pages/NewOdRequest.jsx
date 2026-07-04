// client/src/pages/NewOdRequest.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Upload, FileText, Calendar, GraduationCap, AlertCircle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function NewOdRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);

  // Form Fields
  const [eventName, setEventName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [brochure, setBrochure] = useState(null);
  const [brochureName, setBrochureName] = useState('');

  // Date errors
  const [dateError, setDateError] = useState('');

  const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const shiftDate = (date, days) => {
    if (!date) return null;
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    next.setHours(0, 0, 0, 0);
    return next;
  };

  useEffect(() => {
    async function fetchProfile() {
      try {
        const dashboard = await studentService.getDashboard();
        setStudent(dashboard.student);
      } catch (err) {
        toast.error('Failed to load profile parameters.');
      }
    }
    fetchProfile();
  }, []);

  // Real-time 3-Day Buffer Check
  useEffect(() => {
    const fromDateParsed = parseDate(fromDate);
    const toDateParsed = parseDate(toDate);
    const eventDateParsed = parseDate(eventDate);

    if (!fromDateParsed || !toDateParsed || !eventDateParsed) {
      setDateError('');
      return;
    }

    if (fromDateParsed > toDateParsed) {
      setDateError('Start date cannot exceed end date.');
      return;
    }

    const minFromDate = shiftDate(eventDateParsed, -2);
    const maxToDate = shiftDate(eventDateParsed, 3);

    if (fromDateParsed < minFromDate) {
      setDateError('From Date can be at most 2 days before the Main Event Date.');
      return;
    }

    if (toDateParsed > maxToDate) {
      setDateError('To Date can be at most 3 days after the Main Event Date.');
      return;
    }

    if (eventDateParsed < fromDateParsed || eventDateParsed > toDateParsed) {
      setDateError('Main event date must fall within the OD permission From Date and To Date range.');
      return;
    }

    setDateError('');
  }, [fromDate, toDate, eventDate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds the 5MB limit.');
        return;
      }
      setBrochure(file);
      setBrochureName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!eventName || !collegeName || !eventDate || !fromDate || !toDate || !reason) {
      return toast.error('Please enter all mandatory fields.');
    }

    const fromDateParsed = parseDate(fromDate);
    const toDateParsed = parseDate(toDate);
    const eventDateParsed = parseDate(eventDate);
    const minFromDate = shiftDate(eventDateParsed, -2);
    const maxToDate = shiftDate(eventDateParsed, 3);

    if (fromDateParsed > toDateParsed) {
      return toast.error('Start date ("From Date") cannot exceed End date ("To Date").');
    }

    if (fromDateParsed < minFromDate) {
      return toast.error('From Date can be at most 2 days before the Main Event Date.');
    }

    if (toDateParsed > maxToDate) {
      return toast.error('To Date can be at most 3 days after the Main Event Date.');
    }

    if (eventDateParsed < fromDateParsed || eventDateParsed > toDateParsed) {
      return toast.error('Main Event Date must be inside the OD Permission date range.');
    }

    // Prepare Multipart Form Data
    const formData = new FormData();
    formData.append('eventName', eventName);
    formData.append('collegeName', collegeName);
    formData.append('eventDate', eventDate);
    formData.append('fromDate', fromDate);
    formData.append('toDate', toDate);
    formData.append('reason', reason);
    if (brochure) {
      formData.append('brochure', brochure);
    }

    setLoading(true);
    const toastId = toast.loading('Submitting On-Duty approval request...');

    try {
      await studentService.submitRequest(formData);
      toast.success('Your OD Request has been submitted successfully!', { id: toastId });
      navigate('/student');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to submit OD request.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const mentorName = student?.mentorName || 'Unassigned';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="sticky top-0 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/student"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Form Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Request On-Duty Permission</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Initiate a formal leave request. Verify your auto-filled profile and fill out the event specifications.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Auto-filled Student Profile Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Student Profile Verified Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Student Name</span>
                  <input
                    type="text"
                    disabled
                    value={user?.name || ''}
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Registration Number</span>
                  <input
                    type="text"
                    disabled
                    value={student?.regNo || ''}
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Department</span>
                  <input
                    type="text"
                    disabled
                    value={student?.department?.name || ''}
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Scholar Type</span>
                  <input
                    type="text"
                    disabled
                    value={student?.type?.replace('_', ' ') || ''}
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Assigned Mentor</span>
                  <input
                    type="text"
                    disabled
                    value={mentorName}
                    className="w-full bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Manual Entry Form Inputs Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Event Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Name */}
                <div className="space-y-1.5">
                  <label htmlFor="eventName" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Event Title / Competition Name
                  </label>
                  <input
                    id="eventName"
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. National Robotics Hackathon 2026"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white dark:placeholder-slate-600 transition-all duration-200"
                  />
                </div>

                {/* College Name */}
                <div className="space-y-1.5">
                  <label htmlFor="collegeName" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Hosting Institution / Venue
                  </label>
                  <input
                    id="collegeName"
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. IIT Madras, Chennai"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white dark:placeholder-slate-600 transition-all duration-200"
                  />
                </div>

                {/* Event Date */}
                <div className="space-y-1.5">
                  <label htmlFor="eventDate" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Main Event Date
                  </label>
                  <input
                    id="eventDate"
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white transition-all duration-200"
                  />
                </div>

                {/* Brochure Upload */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                    Event Brochure / Invitation (Max 5MB)
                  </span>
                  <div className="relative border border-dashed border-slate-350 rounded-xl bg-slate-50/25 p-3 hover:bg-slate-50 dark:border-slate-800 dark:bg-navy-950/20 dark:hover:bg-navy-950/40 transition-colors flex items-center justify-between cursor-pointer">
                    <input
                      id="brochure"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">
                        {brochureName || 'Upload PDF, PNG, or JPG'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-500 border border-amber-200 bg-amber-50 px-2 py-0.5 rounded dark:bg-amber-950/20 dark:border-amber-900/30">
                      Browse
                    </span>
                  </div>
                </div>

                {/* From Date */}
                <div className="space-y-1.5">
                  <label htmlFor="fromDate" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    OD Permission From Date
                  </label>
                  <input
                    id="fromDate"
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    max={eventDate || undefined}
                    min={eventDate ? formatDate(shiftDate(parseDate(eventDate), -2)) : undefined}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white transition-all duration-200"
                  />
                </div>

                {/* To Date */}
                <div className="space-y-1.5">
                  <label htmlFor="toDate" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    OD Permission To Date
                  </label>
                  <input
                    id="toDate"
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={eventDate || undefined}
                    max={eventDate ? formatDate(shiftDate(parseDate(eventDate), 3)) : undefined}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* 3-Day Buffer Warning Card */}
              {dateError && (
                <div className="rounded-xl bg-amber-50 border border-amber-250 p-4 dark:bg-amber-950/20 dark:border-amber-900/30 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-normal font-medium">
                    {dateError}
                  </p>
                </div>
              )}

              {/* Purpose / Reason Text Area */}
              <div className="space-y-1.5">
                <label htmlFor="reason" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Purpose of Participation & Detailed Reason
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide complete explanation of your involvement, expected outcomes, team details, and reason for absence on lectures."
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/20 py-2.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-navy-950 dark:text-white dark:placeholder-slate-600 transition-all duration-200"
                ></textarea>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link
                to="/student"
                className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 text-sm font-bold text-slate-650 dark:text-slate-350 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

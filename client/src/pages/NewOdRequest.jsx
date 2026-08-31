// client/src/pages/NewOdRequest.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../lib/api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, Upload, FileText, Calendar, GraduationCap,
  AlertCircle, Building2, ClipboardCheck, Camera
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const PERIOD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function NewOdRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);

  // --- OD Type ---
  const [odType, setOdType] = useState('EXTERNAL'); // 'INTERNAL' | 'EXTERNAL'

  // --- External OD Fields ---
  const [eventName, setEventName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [brochure, setBrochure] = useState(null);
  const [brochureName, setBrochureName] = useState('');

  // --- Internal OD Fields ---
  const [internalDate, setInternalDate] = useState('');
  const [fromPeriod, setFromPeriod] = useState('');
  const [toPeriod, setToPeriod] = useState('');
  const [photoProof, setPhotoProof] = useState(null);
  const [photoProofName, setPhotoProofName] = useState('');

  // --- Shared ---
  const [reason, setReason] = useState('');
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

  // Today's date string for min-date enforcement
  const today = formatDate(new Date());

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

  // Real-time 3-Day Buffer Check (External OD only)
  useEffect(() => {
    if (odType !== 'EXTERNAL') { setDateError(''); return; }

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
  }, [fromDate, toDate, eventDate, odType]);

  // Reset type-specific fields when switching OD type
  const handleOdTypeChange = (type) => {
    setOdType(type);
    setDateError('');
    // Reset External fields
    setEventName(''); setCollegeName(''); setEventDate('');
    setFromDate(''); setToDate(''); setBrochure(null); setBrochureName('');
    // Reset Internal fields
    setInternalDate(''); setFromPeriod(''); setToPeriod('');
    setPhotoProof(null); setPhotoProofName('');
    setReason('');
  };

  const handleBrochureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('File size exceeds the 5MB limit.'); return; }
      setBrochure(file);
      setBrochureName(file.name);
    }
  };

  const handlePhotoProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('File size exceeds the 5MB limit.'); return; }
      setPhotoProof(file);
      setPhotoProofName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) return toast.error('Please enter the purpose/reason.');

    if (odType === 'EXTERNAL') {
      if (!eventName || !collegeName || !eventDate || !fromDate || !toDate) {
        return toast.error('Please fill all mandatory External OD fields.');
      }
      const fromDateParsed = parseDate(fromDate);
      const toDateParsed = parseDate(toDate);
      const eventDateParsed = parseDate(eventDate);
      const minFromDate = shiftDate(eventDateParsed, -2);
      const maxToDate = shiftDate(eventDateParsed, 3);

      if (fromDateParsed > toDateParsed)
        return toast.error('Start date ("From Date") cannot exceed End date ("To Date").');
      if (fromDateParsed < minFromDate)
        return toast.error('From Date can be at most 2 days before the Main Event Date.');
      if (toDateParsed > maxToDate)
        return toast.error('To Date can be at most 3 days after the Main Event Date.');
      if (eventDateParsed < fromDateParsed || eventDateParsed > toDateParsed)
        return toast.error('Main Event Date must be inside the OD Permission date range.');
    } else {
      // Internal OD validation
      if (!internalDate) return toast.error('Please select the activity date.');
      if (!fromPeriod) return toast.error('Please select From Period.');
      if (!toPeriod) return toast.error('Please select To Period.');
      if (parseInt(toPeriod) < parseInt(fromPeriod))
        return toast.error('To Period must be greater than or equal to From Period.');
      if (!photoProof) return toast.error('Photo Proof is mandatory for Internal OD.');
    }

    const formData = new FormData();
    formData.append('odType', odType);
    formData.append('reason', reason);

    if (odType === 'EXTERNAL') {
      formData.append('eventName', eventName);
      formData.append('collegeName', collegeName);
      formData.append('eventDate', eventDate);
      formData.append('fromDate', fromDate);
      formData.append('toDate', toDate);
      if (brochure) formData.append('brochure', brochure);
    } else {
      formData.append('internalDate', internalDate);
      formData.append('fromPeriod', fromPeriod);
      formData.append('toPeriod', toPeriod);
      formData.append('photoProof', photoProof);
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
    <div className="min-h-screen bg-cream dark:bg-dark-bg transition-colors duration-300">
      {/* Top Navbar */}
      <nav className="sticky top-0 bg-cream/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-parchment dark:border-dark-border z-30">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/student"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-terra hover:text-terra-dark transition-colors"
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
            <h1 className="text-2xl font-serif text-brown-900 dark:text-cream">Request On-Duty Permission</h1>
            <p className="text-sm text-brown-600 dark:text-brown-400 mt-1">Initiate a formal leave request. Verify your auto-filled profile and fill out the event specifications.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Auto-filled Student Profile Section */}
            <div className="card-warm p-6 space-y-4">
              <h3 className="text-xs font-serif font-bold text-brown-900 dark:text-cream uppercase tracking-wider">Student Profile Verified Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block mb-1">Student Name</span>
                  <input type="text" disabled value={user?.name || ''} className="input-warm w-full opacity-80" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block mb-1">Registration Number</span>
                  <input type="text" disabled value={student?.regNo || ''} className="input-warm w-full opacity-80" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block mb-1">CSE Department</span>
                  <input type="text" disabled value={student?.department?.name || ''} className="input-warm w-full opacity-80" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block mb-1">Scholar Type</span>
                  <input type="text" disabled value={student?.type?.replace('_', ' ') || ''} className="input-warm w-full opacity-80" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block mb-1">Assigned Mentor</span>
                  <input type="text" disabled value={mentorName} className="input-warm w-full opacity-80" />
                </div>
              </div>
            </div>

            {/* OD Type Selector — FIRST field */}
            <div className="card-warm p-6 space-y-4">
              <h3 className="text-xs font-serif font-bold text-brown-900 dark:text-cream uppercase tracking-wider">OD Type</h3>
              <div>
                <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block mb-3">Select the type of On-Duty request</span>
                <div className="inline-flex rounded-xl border border-parchment dark:border-dark-border overflow-hidden bg-cream-dark dark:bg-dark-surface p-1 gap-1">
                  <button
                    type="button"
                    id="odType-external"
                    onClick={() => handleOdTypeChange('EXTERNAL')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      odType === 'EXTERNAL'
                        ? 'bg-terra text-white shadow-sm shadow-terra/20'
                        : 'text-brown-600 dark:text-brown-400 hover:text-brown-900 dark:hover:text-cream'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    External OD
                  </button>
                  <button
                    type="button"
                    id="odType-internal"
                    onClick={() => handleOdTypeChange('INTERNAL')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      odType === 'INTERNAL'
                        ? 'bg-terra text-white shadow-sm shadow-terra/20'
                        : 'text-brown-600 dark:text-brown-400 hover:text-brown-900 dark:hover:text-cream'
                    }`}
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    Internal OD
                  </button>
                </div>
                <p className="mt-2.5 text-[10px] text-brown-600 dark:text-brown-400 leading-relaxed">
                  {odType === 'EXTERNAL'
                    ? 'For external events, competitions, or activities held at other institutions.'
                    : 'For internal college activities such as exams, seminars, or on-campus events.'}
                </p>
              </div>
            </div>

            {/* ===== EXTERNAL OD FIELDS ===== */}
            {odType === 'EXTERNAL' && (
              <div className="card-warm p-6 space-y-6">
                <h3 className="text-xs font-serif font-bold text-brown-900 dark:text-cream uppercase tracking-wider">Event Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="eventName" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      Event Title / Competition Name
                    </label>
                    <input
                      id="eventName"
                      type="text"
                      required
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g. National Robotics Hackathon 2026"
                      className="input-warm w-full"
                    />
                  </div>

                  {/* College Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="collegeName" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      Hosting Institution / Venue
                    </label>
                    <input
                      id="collegeName"
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="e.g. IIT Madras, Chennai"
                      className="input-warm w-full"
                    />
                  </div>

                  {/* Event Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="eventDate" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      Main Event Date
                    </label>
                    <input
                      id="eventDate"
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={today}
                      className="input-warm w-full"
                    />
                  </div>

                  {/* Brochure Upload */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">
                      Event Brochure / Invitation (Max 5MB)
                    </span>
                    <div className="relative border border-dashed border-parchment hover:border-terra rounded-xl bg-cream-dark/30 p-3 dark:border-dark-border dark:bg-dark-surface/50 dark:hover:border-terra transition-colors flex items-center justify-between cursor-pointer">
                      <input
                        id="brochure"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleBrochureChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-brown-500 shrink-0" />
                        <span className="text-xs text-brown-600 dark:text-brown-400 font-medium truncate max-w-[200px]">
                          {brochureName || 'Upload PDF, PNG, or JPG'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-terra border border-terra/30 bg-terra/10 px-2 py-0.5 rounded">
                        Browse
                      </span>
                    </div>
                  </div>

                  {/* From Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="fromDate" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      OD Permission From Date
                    </label>
                    <input
                      id="fromDate"
                      type="date"
                      required
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      max={eventDate || undefined}
                      min={eventDate ? [today, formatDate(shiftDate(parseDate(eventDate), -2))].sort().pop() : today}
                      className="input-warm w-full"
                    />
                  </div>

                  {/* To Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="toDate" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
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
                      className="input-warm w-full"
                    />
                  </div>
                </div>

                {/* 3-Day Buffer Warning */}
                {dateError && (
                  <div className="rounded-xl bg-gold/10 border border-gold/30 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-gold-dark shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-xs text-gold-dark leading-normal font-medium">{dateError}</p>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-1.5">
                  <label htmlFor="reason" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                    Purpose of Participation &amp; Detailed Reason
                  </label>
                  <textarea
                    id="reason"
                    rows={4}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide complete explanation of your involvement, expected outcomes, team details, and reason for absence on lectures."
                    className="input-warm w-full"
                  />
                </div>
              </div>
            )}

            {/* ===== INTERNAL OD FIELDS ===== */}
            {odType === 'INTERNAL' && (
              <div className="card-warm p-6 space-y-6">
                <h3 className="text-xs font-serif font-bold text-brown-900 dark:text-cream uppercase tracking-wider">Internal Activity Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Activity Date */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="internalDate" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      Activity Date <span className="text-rust">*</span>
                    </label>
                    <input
                      id="internalDate"
                      type="date"
                      required
                      value={internalDate}
                      onChange={(e) => setInternalDate(e.target.value)}
                      min={today}
                      className="input-warm w-full md:w-1/2"
                    />
                  </div>

                  {/* From Period */}
                  <div className="space-y-1.5">
                    <label htmlFor="fromPeriod" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      From Period <span className="text-rust">*</span>
                      <span className="ml-1.5 font-normal text-brown-500">(1 = first class of day)</span>
                    </label>
                    <select
                      id="fromPeriod"
                      required
                      value={fromPeriod}
                      onChange={(e) => {
                        setFromPeriod(e.target.value);
                        // Auto-adjust toPeriod if it's now less than fromPeriod
                        if (toPeriod && parseInt(toPeriod) < parseInt(e.target.value)) {
                          setToPeriod(e.target.value);
                        }
                      }}
                      className="input-warm w-full"
                    >
                      <option value="">Select period</option>
                      {PERIOD_OPTIONS.map((p) => (
                        <option key={p} value={p}>Period {p}</option>
                      ))}
                    </select>
                  </div>

                  {/* To Period */}
                  <div className="space-y-1.5">
                    <label htmlFor="toPeriod" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                      To Period <span className="text-rust">*</span>
                      <span className="ml-1.5 font-normal text-brown-500">(must be ≥ From Period)</span>
                    </label>
                    <select
                      id="toPeriod"
                      required
                      value={toPeriod}
                      onChange={(e) => setToPeriod(e.target.value)}
                      className="input-warm w-full"
                    >
                      <option value="">Select period</option>
                      {PERIOD_OPTIONS.filter((p) => !fromPeriod || p >= parseInt(fromPeriod)).map((p) => (
                        <option key={p} value={p}>Period {p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Photo Proof — MANDATORY */}
                  <div className="space-y-1.5 md:col-span-2">
                    <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">
                      Photo Proof <span className="text-rust">*</span>
                      <span className="ml-1.5 font-normal text-brown-500">(Mandatory — JPG, PNG, PDF, Max 5MB)</span>
                    </span>
                    <div className={`relative border border-dashed rounded-xl p-4 transition-colors flex items-center justify-between cursor-pointer ${
                      photoProof
                        ? 'border-olive bg-olive/10 dark:bg-olive-dark/20 dark:border-olive-dark'
                        : 'border-parchment bg-cream-dark/30 hover:border-terra dark:border-dark-border dark:bg-dark-surface/50 dark:hover:border-terra'
                    }`}>
                      <input
                        id="photoProof"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handlePhotoProofChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center gap-2.5">
                        <Camera className={`h-4 w-4 shrink-0 ${photoProof ? 'text-olive-dark' : 'text-brown-500'}`} />
                        <div>
                          <span className={`text-xs font-semibold block ${photoProof ? 'text-olive-dark dark:text-olive-light' : 'text-brown-600 dark:text-brown-400'}`}>
                            {photoProofName || 'No file selected — required'}
                          </span>
                          {!photoProof && (
                            <span className="text-[10px] text-brown-500 dark:text-brown-400">Upload a photo proving attendance at the internal activity</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${
                        photoProof
                          ? 'text-olive-dark border-olive/30 bg-olive/10 dark:bg-olive-dark/20 dark:border-olive-dark/30'
                          : 'text-brown-600 border-parchment bg-cream dark:text-brown-300 dark:border-dark-border dark:bg-dark-surface'
                      }`}>
                        {photoProof ? 'Change' : 'Browse'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label htmlFor="reason-internal" className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider">
                    Purpose / Reason <span className="text-rust">*</span>
                  </label>
                  <textarea
                    id="reason-internal"
                    rows={4}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the internal activity, your role/involvement, and why you require OD permission for these periods."
                    className="input-warm w-full"
                  />
                </div>

                {/* Internal OD info notice */}
                <div className="rounded-xl bg-gold/10 border border-gold/30 p-3.5 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-gold-dark shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gold-dark leading-relaxed">
                    Internal OD is for on-campus activities only. Periods 1–8 represent regular class slots (excluding break and lunch periods). The approval chain remains the same as External OD.
                  </p>
                </div>
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link
                to="/student"
                className="px-5 py-3 rounded-xl border border-parchment hover:bg-cream-dark dark:border-dark-border dark:hover:bg-dark-surface text-sm font-bold text-brown-600 dark:text-brown-400 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-terra px-6 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
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

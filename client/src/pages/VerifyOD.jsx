// client/src/pages/VerifyOD.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicService } from '../lib/api';
import { ShieldCheck, ShieldAlert, School, Calendar, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function VerifyOD() {
  const { odCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function verify() {
      try {
        const data = await publicService.verifyOD(odCode);
        setRequest(data);
      } catch (err) {
        console.error(err);
        setError('This On-Duty reference code does not exist in the official Kamaraj College of Engineering and Technology directory.');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [odCode]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Verifying secure signatures log...</p>
        </div>
      </div>
    );
  }

  const formatTimestamp = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const studentName = request.studentName || request.student?.user?.name || 'Not available';
  const regNo = request.regNo || request.student?.regNo || 'Not available';
  const departmentCode = request.departmentCode || request.student?.department?.code || 'CSE';
  const departmentName = request.department || request.student?.department?.name || 'Computer Science and Engineering';
  const mentorName = request.mentorName || 'Unassigned';
  const chairpersonName = request.chairpersonName || 'Unassigned';
  const academicYear = request.year ? `Year ${request.year}` : 'Year not available';
  const section = request.section || 'Sec -';
  const approvalLogs = request.approvalLogs || request.logs || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-300 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8 flex flex-col justify-center">
        {error ? (
          /* TAMPERED / INVALID STATE CARD */
          <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-2xl dark:bg-navy-900 dark:border-red-950/30 text-center space-y-6 max-w-md mx-auto w-full transition-all duration-300">
            <div className="inline-flex p-4 rounded-full bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 animate-pulse">
              <ShieldAlert className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-red-700 dark:text-red-500">TAMPERED / UNVERIFIED OD REF</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal px-2">
                This QR reference code (<strong className="font-mono text-xs">{odCode}</strong>) is invalid and does not exist in the official college directory.
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/15 p-4 rounded-2xl border border-red-100 dark:border-red-950/20 text-left text-xs text-red-800 dark:text-red-400 leading-relaxed font-medium">
              ⚠️ Warning: Presenting duplicate or forged outpass permits is a severe academic offense. Report this code immediately to the IT support desk.
            </div>
          </div>
        ) : (
          /* ✓ VALID CERTIFIED LEAVE CARD */
          <div className="bg-white rounded-3xl border border-slate-200/50 shadow-2xl dark:bg-navy-900 dark:border-slate-800/60 overflow-hidden transition-all duration-300">
            {/* Green Seal Banner */}
            <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3 text-white">
              <ShieldCheck className="h-6 w-6 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest uppercase">Verified Leave Certification</span>
                <span className="text-xs sm:text-sm font-extrabold tracking-tight">✓ SECURED ON-DUTY (OD) APPROVED</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* College metadata */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">KAMARAJ COLLEGE OF ENGINEERING AND TECHNOLOGY</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                  Ref Reference: {request.odCode}
                </span>
              </div>

              {/* Student parameters */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 dark:bg-slate-950/40 dark:border-slate-800 space-y-4">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Student profile</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white/80 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-800 p-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Name</span>
                    <span className="block mt-1 text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{studentName}</span>
                  </div>

                  <div className="rounded-xl bg-white/80 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-800 p-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Reg. No</span>
                    <span className="block mt-1 text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{regNo}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-white/70 dark:bg-navy-900/40 border border-slate-100 dark:border-slate-800 p-3">
                    <span className="text-slate-400 block mb-0.5 text-[9px] font-bold uppercase">Class / Dept</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{academicYear} | {departmentCode}</span>
                    <span className="block mt-1 text-[10px] text-slate-400 dark:text-slate-500">{departmentName}</span>
                  </div>

                  <div className="rounded-xl bg-white/70 dark:bg-navy-900/40 border border-slate-100 dark:border-slate-800 p-3">
                    <span className="text-slate-400 block mb-0.5 text-[9px] font-bold uppercase">Scholar Type</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{request.studentType?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-white/70 dark:bg-navy-900/40 border border-slate-100 dark:border-slate-800 p-3">
                    <span className="text-slate-400 block mb-0.5 text-[9px] font-bold uppercase">Academic Mentor</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{mentorName}</span>
                  </div>

                  <div className="rounded-xl bg-white/70 dark:bg-navy-900/40 border border-slate-100 dark:border-slate-800 p-3">
                    <span className="text-slate-400 block mb-0.5 text-[9px] font-bold uppercase">Chairperson</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{chairpersonName}</span>
                  </div>
                </div>
              </div>

              {/* Event specifications */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Event particulars</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <School className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Venue</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{request.collegeName}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">OD Period</span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {new Date(request.fromDate).toLocaleDateString('en-IN')} to {new Date(request.toDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase">Purpose of Absence</span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 rounded-xl leading-relaxed text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-1">{request.eventName}</span>
                    <span>{request.reason}</span>
                  </p>
                </div>
              </div>

              {/* Signatures Log tree */}
              {approvalLogs.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block font-mono">Digital Signature Clearances</span>
                  <div className="space-y-2">
                    {approvalLogs.map((log, index) => (
                      <div key={index} className="flex gap-3 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 dark:bg-slate-950/20 dark:border-slate-800/40">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Approved by {log.approverName || log.approver?.name} [{String(log.role || '').toUpperCase()}]
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Date: {formatTimestamp(log.timestamp)}</span>
                          {log.remarks && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1">"{log.remarks}"</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-3xl mx-auto px-6 py-6 border-t border-slate-100 dark:border-slate-800/50 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>© 2026 Kamaraj College of Engineering and Technology OD Security Clearance Desk.</p>
      </footer>
    </div>
  );
}

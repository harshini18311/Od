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
        setError('This On-Duty reference code does not exist in the official CSE department directory.');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [odCode]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-parchment dark:bg-dark-bg">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-terra border-t-transparent"></div>
          <p className="text-sm font-medium text-brown-600 dark:text-brown-400">Verifying secure signatures log...</p>
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

  const studentName = request?.studentName || request?.student?.user?.name || 'Not available';
  const regNo = request?.regNo || request?.student?.regNo || 'Not available';
  const departmentCode = request?.departmentCode || request?.student?.department?.code || 'CSE';
  const departmentName = request?.department || request?.student?.department?.name || 'Computer Science and Engineering';
  const mentorName = request?.mentorName || 'Unassigned';
  const chairpersonName = request?.chairpersonName || 'Unassigned';
  const academicYear = request?.year ? `Year ${request.year}` : 'Year not available';
  const section = request?.section || 'Sec -';
  const approvalLogs = request?.approvalLogs || request?.logs || [];

  return (
    <div className="min-h-screen bg-parchment dark:bg-dark-bg transition-colors duration-300 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="w-full max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs font-bold text-terra hover:text-terra-dark transition-colors"
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
          <div className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-rust shadow-2xl text-center space-y-6 max-w-md mx-auto w-full transition-all duration-300">
            <div className="inline-flex p-4 rounded-full bg-rust-light/30 text-rust animate-pulse">
              <ShieldAlert className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-serif font-extrabold text-rust">TAMPERED / UNVERIFIED OD REF</h1>
              <p className="text-xs text-brown-600 dark:text-brown-400 leading-normal px-2">
                This QR reference code (<strong className="font-mono text-xs">{odCode}</strong>) is invalid and does not exist in the official college directory.
              </p>
            </div>
            <div className="bg-rust/10 p-4 rounded-2xl border border-rust/30 text-left text-xs text-rust leading-relaxed font-medium">
              ⚠️ Warning: Presenting duplicate or forged outpass permits is a severe academic offense. Report this code immediately to the IT support desk.
            </div>
          </div>
        ) : (
          /* ✓ VALID CERTIFIED LEAVE CARD */
          <div className="card-warm border-brown-700/30 overflow-hidden transition-all duration-300">
            {/* Green Seal Banner */}
            <div className="bg-olive text-cream px-6 py-4 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest uppercase">Verified Leave Certification</span>
                <span className="text-xs sm:text-sm font-serif font-extrabold tracking-tight">✓ SECURED ON-DUTY (OD) APPROVED</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* College metadata */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-serif font-extrabold text-brown-900 dark:text-cream">KCET — COMPUTER SCIENCE AND ENGINEERING</h2>
                <span className="text-[10px] font-bold text-brown-500 uppercase tracking-widest block font-mono">
                  Ref Reference: {request.odCode}
                </span>
              </div>

              {/* Student parameters */}
              <div className="bg-cream-dark/50 p-4 rounded-2xl border border-parchment dark:bg-dark-surface/50 dark:border-dark-border space-y-4">
                <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Student profile</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-cream/80 dark:bg-dark-bg/60 border border-parchment dark:border-dark-border p-3">
                    <span className="text-[9px] font-bold text-brown-500 uppercase block">Name</span>
                    <span className="block mt-1 text-lg font-serif font-extrabold text-brown-900 dark:text-cream leading-tight">{studentName}</span>
                  </div>

                  <div className="rounded-xl bg-cream/80 dark:bg-dark-bg/60 border border-parchment dark:border-dark-border p-3">
                    <span className="text-[9px] font-bold text-brown-500 uppercase block">Reg. No</span>
                    <span className="block mt-1 text-lg font-serif font-extrabold text-brown-900 dark:text-cream leading-tight">{regNo}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-cream/70 dark:bg-dark-bg/40 border border-parchment dark:border-dark-border p-3">
                    <span className="text-brown-500 block mb-0.5 text-[9px] font-bold uppercase">Class / Dept</span>
                    <span className="font-semibold text-brown-800 dark:text-brown-200">{academicYear} | {departmentCode}</span>
                    <span className="block mt-1 text-[10px] text-brown-500">{departmentName}</span>
                  </div>

                  <div className="rounded-xl bg-cream/70 dark:bg-dark-bg/40 border border-parchment dark:border-dark-border p-3">
                    <span className="text-brown-500 block mb-0.5 text-[9px] font-bold uppercase">Scholar Type</span>
                    <span className="font-semibold text-brown-800 dark:text-brown-200">{request.studentType?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl bg-cream/70 dark:bg-dark-bg/40 border border-parchment dark:border-dark-border p-3">
                    <span className="text-brown-500 block mb-0.5 text-[9px] font-bold uppercase">Academic Mentor</span>
                    <span className="font-semibold text-brown-800 dark:text-brown-200">{mentorName}</span>
                  </div>

                  <div className="rounded-xl bg-cream/70 dark:bg-dark-bg/40 border border-parchment dark:border-dark-border p-3">
                    <span className="text-brown-500 block mb-0.5 text-[9px] font-bold uppercase">Chairperson</span>
                    <span className="font-semibold text-brown-800 dark:text-brown-200">{chairpersonName}</span>
                  </div>
                </div>
              </div>

              {/* Event specifications */}
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Event particulars</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <School className="h-4.5 w-4.5 text-brown-500 shrink-0" />
                    <div>
                      <span className="text-brown-500 block text-[9px] font-bold uppercase">Venue</span>
                      <span className="text-brown-800 dark:text-brown-300 font-semibold">{request.collegeName}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-brown-500 shrink-0" />
                    <div>
                      <span className="text-brown-500 block text-[9px] font-bold uppercase">OD Period</span>
                      <span className="text-brown-800 dark:text-brown-300 font-semibold">
                        {new Date(request.fromDate).toLocaleDateString('en-IN')} to {new Date(request.toDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-brown-500 block text-[9px] font-bold uppercase">Purpose of Absence</span>
                  <p className="p-3 bg-cream dark:bg-dark-bg border border-parchment dark:border-dark-border rounded-xl leading-relaxed text-brown-700 dark:text-brown-300">
                    <span className="font-semibold text-brown-900 dark:text-white block mb-1">{request.eventName}</span>
                    <span>{request.reason}</span>
                  </p>
                </div>
              </div>

              {/* Signatures Log tree */}
              {approvalLogs.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block font-mono">Digital Signature Clearances</span>
                  <div className="space-y-2">
                    {approvalLogs.map((log, index) => (
                      <div key={index} className="flex gap-3 text-xs bg-cream-dark/50 p-2.5 rounded-xl border border-parchment dark:bg-dark-surface/50 dark:border-dark-border">
                        <CheckCircle2 className="h-4.5 w-4.5 text-olive shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-brown-800 dark:text-brown-200">
                            {String(log.role || '').toLowerCase() === 'mentor' && (log.approver?.role === 'hod' || (log.approverName || log.approver?.name) === 'DR.A.MEENAKSHI')
                              ? `Approved by ${log.approverName || log.approver?.name} [MENTOR]`
                              : `Approved by ${log.approverName || log.approver?.name} [${String(log.role || '').toUpperCase()}]`
                            }
                          </span>
                          <span className="text-[10px] text-brown-500 mt-0.5">Date: {formatTimestamp(log.timestamp)}</span>
                          {log.remarks && (
                            <span className="text-[11px] text-brown-600 dark:text-brown-400 italic mt-1">"{log.remarks}"</span>
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
      <footer className="w-full max-w-3xl mx-auto px-6 py-6 border-t border-parchment dark:border-dark-border text-center text-xs text-brown-500">
        <p>© 2026 KCET Computer Science and Engineering OD Security Desk.</p>
      </footer>
    </div>
  );
}

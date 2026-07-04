// client/src/pages/OdStatus.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Download, QrCode, FileText, Calendar, School, User, AlertTriangle, Clock } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import StatusBadge from '../components/StatusBadge';
import ApprovalTimeline from '../components/ApprovalTimeline';
import api, { studentService } from '../lib/api';

export default function OdStatus() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchRequestDetails() {
      try {
        const details = await studentService.getRequestDetail(id);
        setRequest(details);
      } catch (err) {
        toast.error('Failed to load OD request detailed status.');
      } finally {
        setLoading(false);
      }
    }
    fetchRequestDetails();
  }, [id]);

  const handleDownloadPdf = () => {
    if (!request || request.status !== 'APPROVED') return;

    const toastId = toast.loading('Opening certified PDF letter...');
    try {
      const url = studentService.getPdfUrl(id);
      window.open(url, '_blank');
      toast.success('OD Certified Letter opened successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile certified PDF document.', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading tracking timeline...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-navy-950">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <h1 className="mt-6 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">OD Request Not Found</h1>
        <p className="mt-2 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          The requested permission reference ID does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/student"
          className="mt-6 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-md"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const dateStr = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };

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

      {/* Main timeline page container */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-mono">
              OD Request Ref: {request.odCode}
            </span>
            <h1 className="text-xl font-extrabold text-slate-850 dark:text-white mt-1">
              {request.eventName}
            </h1>
          </div>
          <StatusBadge status={request.status} currentStage={request.currentStage} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline and remarks: Left 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm">
              <h2 className="text-sm font-bold text-slate-850 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800/60">
                Live Approval Stages
              </h2>
              <ApprovalTimeline odRequest={request} />
            </div>

            {/* Event Specification details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-850 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800/60">
                Participation Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <School className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Institution</span>
                    <span className="text-slate-700 dark:text-slate-350 font-semibold">{request.collegeName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Event Date</span>
                    <span className="text-slate-700 dark:text-slate-350 font-semibold">{dateStr(request.eventDate)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Permission Duration</span>
                    <span className="text-slate-700 dark:text-slate-350 font-semibold">{dateStr(request.fromDate)} to {dateStr(request.toDate)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Scholar Type</span>
                    <span className="text-slate-700 dark:text-slate-350 font-semibold">{request.studentType?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800/60 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Detailed Purpose</span>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-navy-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
                  {request.reason}
                </p>
              </div>

              {request.brochureUrl && (
                <div className="pt-2">
                  <a
                    href={`http://localhost:5000${request.brochureUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    <FileText className="h-4 w-4" />
                    View Event Brochure / Invitation
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Secure details / QR actions: Right 1 col */}
          <div className="space-y-6">
            {request.status === 'APPROVED' ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm text-center space-y-5">
                <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <QrCode className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-850 dark:text-white">Certified Outpass Secured</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal px-2">
                    Your request is certified. Present the generated letter or scan the secure QR code to verify validity instantly.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-navy-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-center shadow-inner">
                  {/* Public Verification Link QR code will be generated inside the PDF. Here we display a nice styling */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-amber-500/10 rounded-xl blur group-hover:bg-amber-500/20 transition-all duration-300"></div>
                    <div className="relative bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <img
                        src={`http://localhost:5000/uploads/qr-placeholder.png`}
                        onError={(e) => {
                          // Display beautiful fallback or standard icon when QR is rendering
                          e.target.style.display = 'none';
                        }}
                        className="h-32 w-32 object-contain"
                        alt="QR Code"
                      />
                      {/* Generates inline Base64 QR code locally since publicService can do it. */}
                      <QrDisplay odCode={request.odCode} />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-md shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PDF Letter
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/50 dark:bg-navy-900 dark:border-slate-800/60 shadow-sm text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">
                  <Clock className="h-8 w-8 animate-pulse-fast" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-slate-850 dark:text-white">Under Authorization</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-normal px-2">
                    This request is actively stepping through the approval flow. The certified letter and QR outpass will unlock immediately upon final signature verification.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Subcomponent to fetch and render base64 QR directly in the UI
function QrDisplay({ odCode }) {
  const [qrBase64, setQrBase64] = useState('');

  useEffect(() => {
    import('qrcode').then((QRCode) => {
      const verificationUrl = `http://localhost:5173/verify/${odCode}`;
      QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      }).then((dataUrl) => {
        setQrBase64(dataUrl);
      }).catch(err => console.error(err));
    });
  }, [odCode]);

  if (!qrBase64) {
    return (
      <div className="h-32 w-32 flex items-center justify-center">
        <QrCode className="h-10 w-10 text-slate-350 dark:text-slate-650 animate-pulse" />
      </div>
    );
  }

  return (
    <img src={qrBase64} className="h-32 w-32 object-contain" alt="OD Code Verification QR" />
  );
}

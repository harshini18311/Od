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

  const handleDownloadPdf = async () => {
    if (!request || request.status !== 'APPROVED') return;

    setDownloading(true);
    const toastId = toast.loading('Opening certified PDF letter...');
    try {
      await studentService.downloadPdf(id);
      toast.success('OD Certified Letter downloaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to compile certified PDF document.', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cream dark:bg-dark-bg">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-terra border-t-transparent"></div>
          <p className="text-sm font-medium text-brown-600 dark:text-brown-400">Loading tracking timeline...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-cream px-4 text-center dark:bg-dark-bg">
        <AlertTriangle className="h-12 w-12 text-gold-dark" />
        <h1 className="mt-6 text-xl font-serif font-bold tracking-tight text-brown-900 dark:text-cream">OD Request Not Found</h1>
        <p className="mt-2 max-w-sm text-xs text-brown-600 dark:text-brown-400">
          The requested permission reference ID does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/student"
          className="btn-terra mt-6 px-4 py-2 text-xs"
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

      {/* Main timeline page container */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-brown-500 dark:text-brown-400 uppercase tracking-widest block font-mono">
              OD Request Ref: {request.odCode}
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-xl font-serif font-extrabold text-brown-900 dark:text-cream">
                {request.odType === 'INTERNAL' ? 'Internal Activity' : request.eventName}
              </h1>
              {request.odType === 'INTERNAL' ? (
                <span className="inline-flex items-center rounded-full bg-terra/10 px-2.5 py-1 text-[10px] font-bold text-terra-dark ring-1 ring-inset ring-terra/20 dark:bg-terra-dark/20 dark:text-terra-light dark:ring-terra-dark/20 shrink-0">
                  Internal OD
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gold/10 px-2.5 py-1 text-[10px] font-bold text-gold-dark ring-1 ring-inset ring-gold/20 dark:bg-gold-dark/20 dark:text-gold-light dark:ring-gold-dark/20 shrink-0">
                  External OD
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={request.status} currentStage={request.currentStage} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline and remarks: Left 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <div className="card-warm p-6">
              <h2 className="text-sm font-serif font-bold text-brown-900 dark:text-cream border-b border-parchment pb-3 dark:border-dark-border">
                Live Approval Stages
              </h2>
              <ApprovalTimeline odRequest={request} />
            </div>

            {/* Event Specification details */}
            <div className="card-warm p-6 space-y-4">
              <h2 className="text-sm font-serif font-bold text-brown-900 dark:text-cream border-b border-parchment pb-3 dark:border-dark-border">
                Participation Overview
              </h2>

              {request.odType === 'INTERNAL' ? (
                /* ---- INTERNAL OD detail view ---- */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-brown-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Activity Date</span>
                      <span className="text-brown-800 dark:text-brown-200 font-semibold">{dateStr(request.eventDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4.5 w-4.5 text-brown-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Period Range</span>
                      <span className="text-brown-800 dark:text-brown-200 font-semibold">
                        Period {request.fromPeriod}
                        <span className="mx-1.5 text-brown-400">→</span>
                        Period {request.toPeriod}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <User className="h-4.5 w-4.5 text-brown-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Scholar Type</span>
                      <span className="text-brown-800 dark:text-brown-200 font-semibold">{request.studentType?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ---- EXTERNAL OD detail view (unchanged) ---- */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <School className="h-4.5 w-4.5 text-brown-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Institution</span>
                      <span className="text-brown-800 dark:text-brown-200 font-semibold">{request.collegeName}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-brown-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Event Date</span>
                      <span className="text-brown-800 dark:text-brown-200 font-semibold">{dateStr(request.eventDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4.5 w-4.5 text-brown-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Permission Duration</span>
                      <span className="text-brown-800 dark:text-brown-200 font-semibold">{dateStr(request.fromDate)} to {dateStr(request.toDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <User className="h-4.5 w-4.5 text-brown-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Scholar Type</span>
                      <span className="text-brown-800 dark:text-brown-200 font-semibold">{request.studentType?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-parchment pt-3 dark:border-dark-border space-y-1">
                <span className="text-[10px] font-bold text-brown-700 dark:text-brown-300 uppercase tracking-wider block">Detailed Purpose</span>
                <p className="text-xs text-brown-600 dark:text-brown-400 leading-relaxed bg-cream-dark dark:bg-dark-surface p-3 rounded-xl border border-parchment dark:border-dark-border">
                  {request.reason}
                </p>
              </div>

              {/* Brochure link — External OD only */}
              {request.odType !== 'INTERNAL' && request.brochureUrl && (
                <div className="pt-2">
                  <a
                    href={`http://localhost:5000${request.brochureUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-terra hover:text-terra-dark transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    View Event Brochure / Invitation
                  </a>
                </div>
              )}

              {/* Photo Proof link — Internal OD only */}
              {request.odType === 'INTERNAL' && request.photoProofUrl && (
                <div className="pt-2">
                  <a
                    href={`http://localhost:5000${request.photoProofUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-terra hover:text-terra-dark transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    View Photo Proof
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Secure details / QR actions: Right 1 col */}
          <div className="space-y-6">
            {request.status === 'APPROVED' ? (
              <div className="bg-olive/10 border border-olive/30 dark:bg-olive-dark/20 dark:border-olive-dark/30 p-6 rounded-2xl shadow-sm text-center space-y-5">
                <div className="inline-flex p-3 rounded-full bg-olive-light/20 text-olive-dark dark:bg-olive-dark/30 dark:text-olive-light">
                  <QrCode className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-serif font-extrabold text-olive-dark dark:text-olive-light">Certified Outpass Secured</h3>
                  <p className="text-xs text-olive-dark/80 dark:text-olive-light/80 leading-normal px-2">
                    Your request is certified. Present the generated letter or scan the secure QR code to verify validity instantly.
                  </p>
                </div>

                <div className="bg-cream dark:bg-dark-bg p-4 rounded-2xl border border-olive/20 dark:border-olive-dark/20 flex items-center justify-center shadow-inner">
                  {/* Public Verification Link QR code will be generated inside the PDF. Here we display a nice styling */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-olive/10 rounded-xl blur group-hover:bg-olive/20 transition-all duration-300"></div>
                    <div className="relative bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-parchment dark:border-dark-border">
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
                  className="btn-terra w-full py-3 px-4 flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PDF Letter
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-gold/10 border border-gold/30 dark:bg-gold-dark/20 dark:border-gold-dark/30 p-6 rounded-2xl shadow-sm text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-gold-light/30 text-gold-dark dark:bg-gold-dark/30 dark:text-gold-light">
                  <Clock className="h-8 w-8 animate-pulse-fast" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-serif font-extrabold text-gold-dark dark:text-gold-light">Under Authorization</h3>
                  <p className="text-xs text-gold-dark/80 dark:text-gold-light/80 leading-normal px-2">
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
          dark: '#3E2723', // brown-900
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
        <QrCode className="h-10 w-10 text-brown-300 dark:text-brown-600 animate-pulse" />
      </div>
    );
  }

  return (
    <img src={qrBase64} className="h-32 w-32 object-contain" alt="OD Code Verification QR" />
  );
}

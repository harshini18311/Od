import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authService } from '../lib/api';
import { ArrowLeft, KeyRound, Mail, ShieldCheck, Sparkles, Lock, ArrowRight, RotateCcw } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function StaffPasswordReset() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  const requestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return toast.error('Enter your staff login email.');
    }

    setLoading(true);
    const toastId = toast.loading('Sending OTP...');

    try {
      const result = await authService.requestStaffPasswordResetOtp(email.trim());
      setMaskedEmail(result.email || 'your official mail');
      setStep(2);
      toast.success('OTP sent successfully.', { id: toastId });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Unable to send OTP right now.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      return toast.error('Enter the OTP sent to your official mail.');
    }

    setLoading(true);
    const toastId = toast.loading('Verifying OTP...');

    try {
      await authService.verifyStaffPasswordResetOtp(email.trim(), otp.trim());
      setStep(3);
      toast.success('OTP verified. Set a new password.', { id: toastId });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'OTP verification failed.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const completeReset = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      return toast.error('Enter and confirm your new password.');
    }

    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters long.');
    }

    setLoading(true);
    const toastId = toast.loading('Updating password...');

    try {
      await authService.completeStaffPasswordReset(email.trim(), newPassword);
      toast.success('Password updated successfully.', { id: toastId });
      navigate('/');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Unable to update password right now.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-cream dark:bg-dark-bg font-sans flex items-stretch overflow-hidden">
      <div className="hidden lg:flex lg:w-[42%] bg-brown-900 bg-gradient-to-br from-brown-900 via-brown-850 to-brown-800 flex-col justify-between p-12 relative">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brown-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-terra/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-terra-light hover:text-cream transition-colors text-sm font-semibold mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-terra/15 border border-terra/30 rounded-2xl p-3">
              <ShieldCheck className="h-7 w-7 text-terra-light" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-terra-light/70 font-bold">Staff Recovery</p>
              <h1 className="font-serif text-4xl font-bold text-cream">Reset Password</h1>
            </div>
          </div>
          <p className="max-w-md text-brown-200 leading-relaxed">
            Verify your official staff email with an OTP, then set a new password for the OD portal.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4 text-cream">
            <div className="bg-brown-800/80 p-3 rounded-2xl border border-brown-700/50"><Mail className="h-5 w-5 text-gold" /></div>
            <span className="font-medium">OTP is delivered to the official mail listed in the staff sheet.</span>
          </div>
          <div className="flex items-center gap-4 text-cream">
            <div className="bg-brown-800/80 p-3 rounded-2xl border border-brown-700/50"><Lock className="h-5 w-5 text-gold" /></div>
            <span className="font-medium">Password changes are allowed only after OTP verification.</span>
          </div>
          <div className="flex items-center gap-4 text-cream">
            <div className="bg-brown-800/80 p-3 rounded-2xl border border-brown-700/50"><Sparkles className="h-5 w-5 text-gold" /></div>
            <span className="font-medium">Use your staff login email, not the official mail, to start the reset.</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative min-h-screen overflow-y-auto">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-start justify-center p-6 sm:p-10 pt-12 sm:pt-20">
          <div className="w-full max-w-xl">
            <div className="lg:hidden flex flex-col items-center text-center mb-8">
              <div className="bg-brown-100 dark:bg-dark-surface p-4 rounded-full mb-4 shadow-sm border border-brown-200 dark:border-dark-border">
                <ShieldCheck className="h-10 w-10 text-terra" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-brown-900 dark:text-cream">Reset Password</h1>
              <p className="text-sm text-brown-600 dark:text-brown-400 mt-2 max-w-sm">
                OTP verification for staff accounts.
              </p>
            </div>

            <div className="card-warm p-6 sm:p-8 shadow-xl relative z-50">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-brown-500 dark:text-brown-400 font-bold">Step {step} of 3</p>
                  <h2 className="text-2xl font-serif font-bold text-brown-900 dark:text-cream mt-1">
                    {step === 1 && 'Request OTP'}
                    {step === 2 && 'Verify OTP'}
                    {step === 3 && 'Set New Password'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-brown-500 dark:text-brown-400 bg-parchment/70 dark:bg-dark-surface/70 px-3 py-2 rounded-full border border-brown-100 dark:border-dark-border">
                  <RotateCcw className="h-4 w-4" />
                  Secure reset
                </div>
              </div>

              {step === 1 && (
                <form onSubmit={requestOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-bold text-brown-800 dark:text-brown-200 uppercase tracking-wider ml-1">
                      Staff Login Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Mail className="h-5 w-5 text-brown-400 group-focus-within:text-terra transition-colors" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="staffname@cse"
                        className="input-warm block w-full !pl-12 !py-3.5 text-base"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-terra w-full py-4 flex items-center justify-center gap-2 text-base font-bold"
                  >
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight className="h-4.5 w-4.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={verifyOtp} className="space-y-5">
                  <div className="rounded-2xl border border-brown-100 dark:border-dark-border bg-parchment/60 dark:bg-dark-surface/50 p-4 text-sm text-brown-700 dark:text-brown-300">
                    OTP sent to {maskedEmail || 'your official mail address'}.
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="otp" className="block text-xs font-bold text-brown-800 dark:text-brown-200 uppercase tracking-wider ml-1">
                      OTP
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <KeyRound className="h-5 w-5 text-brown-400 group-focus-within:text-terra transition-colors" />
                      </div>
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-digit code"
                        className="input-warm block w-full !pl-12 !py-3.5 text-base tracking-[0.3em]"
                        maxLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 rounded-xl border border-brown-200 dark:border-dark-border px-4 py-3 text-sm font-semibold text-brown-700 dark:text-brown-300 hover:bg-brown-50 dark:hover:bg-dark-surface transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-terra flex-1 py-3 flex items-center justify-center gap-2 text-base font-bold"
                    >
                      {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          Verify OTP
                          <ArrowRight className="h-4.5 w-4.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={completeReset} className="space-y-5">
                  <div className="rounded-2xl border border-olive/20 bg-olive-light/10 dark:bg-olive-dark/10 p-4 text-sm text-olive dark:text-olive-light">
                    OTP verified for {maskedEmail || email}.
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="block text-xs font-bold text-brown-800 dark:text-brown-200 uppercase tracking-wider ml-1">
                      New Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Lock className="h-5 w-5 text-brown-400 group-focus-within:text-terra transition-colors" />
                      </div>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter a new password"
                        className="input-warm block w-full !pl-12 !py-3.5 text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-xs font-bold text-brown-800 dark:text-brown-200 uppercase tracking-wider ml-1">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Lock className="h-5 w-5 text-brown-400 group-focus-within:text-terra transition-colors" />
                      </div>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter the new password"
                        className="input-warm block w-full !pl-12 !py-3.5 text-base"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-1/3 rounded-xl border border-brown-200 dark:border-dark-border px-4 py-3 text-sm font-semibold text-brown-700 dark:text-brown-300 hover:bg-brown-50 dark:hover:bg-dark-surface transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-terra flex-1 py-3 flex items-center justify-center gap-2 text-base font-bold"
                    >
                      {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          Update Password
                          <ArrowRight className="h-4.5 w-4.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between text-sm text-brown-500 dark:text-brown-400">
              <Link to="/" className="inline-flex items-center gap-2 font-semibold hover:text-terra transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Return to login
              </Link>
              <span className="hidden sm:inline">Use your staff login email to start the reset.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

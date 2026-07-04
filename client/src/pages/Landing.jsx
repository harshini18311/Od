// client/src/pages/Landing.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GraduationCap, Briefcase, KeyRound, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [isStudentPortal, setIsStudentPortal] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/staff');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter all mandatory fields.');
    }

    setLoading(true);
    const toastId = toast.loading('Verifying credentials...');

    try {
      const loggedUser = await login(email, password);
      toast.success(`Welcome back, ${loggedUser.name}!`, { id: toastId });

      if (loggedUser.role === 'student') {
        navigate('/student');
      } else if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/staff');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Authentication failed. Please check your credentials.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handlePortalSwitch = (studentPortal) => {
    setIsStudentPortal(studentPortal);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500 text-white p-2 rounded-xl shadow-md shadow-amber-500/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-slate-800 dark:text-white">KCET</span>
            <span className="text-[10px] tracking-wide text-slate-400 dark:text-slate-500 font-bold uppercase">OD Approval Portal</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero and Login Cards Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row items-center justify-center gap-12">
        {/* Left Side: Descriptive Column */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Digitized Workflow Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
            Online <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500">On-Duty</span> Leave Approval System.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
            Authorized portal for Kamaraj College of Engineering and Technology. Students can submit official leave requests for hackathons, sports, and technical symposia, which seamlessly route through a multi-stage approval workflow.
          </p>
          <div className="hidden sm:flex items-center gap-8 text-center lg:text-left">
            <div>
              <p className="text-2xl font-black text-slate-800 dark:text-white">7 Roles</p>
              <p className="text-xs text-slate-400 font-medium">RBAC Security</p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div>
              <p className="text-2xl font-black text-slate-800 dark:text-white">✓ Certified</p>
              <p className="text-xs text-slate-400 font-medium">Secure QR Verification</p>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div>
              <p className="text-2xl font-black text-slate-800 dark:text-white">100%</p>
              <p className="text-xs text-slate-400 font-medium">Real-time Timeline</p>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphism Login Container */}
        <div className="w-full max-w-md rounded-3xl bg-white p-8 border border-slate-200/50 shadow-2xl dark:bg-navy-900 dark:border-slate-800/60 transition-all duration-300">
          {/* Portal Toggle Cards */}
          <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 rounded-2xl dark:bg-navy-950 mb-8">
            <button
              onClick={() => handlePortalSwitch(true)}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${isStudentPortal ? 'bg-white text-amber-500 shadow dark:bg-navy-900' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              <GraduationCap className="h-4 w-4" />
              Student Portal
            </button>
            <button
              onClick={() => handlePortalSwitch(false)}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${!isStudentPortal ? 'bg-white text-amber-500 shadow dark:bg-navy-900' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              <Briefcase className="h-4 w-4" />
              Staff / Admin
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
              {isStudentPortal ? 'Student Log In' : 'Staff / Admin Log In'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Enter your login ID and password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Login ID
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={isStudentPortal ? '24ucs073' : 'staffname@cse'}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-navy-950 dark:text-white dark:placeholder-slate-600 dark:focus:bg-navy-950 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyRound className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-800 dark:bg-navy-950 dark:text-white dark:placeholder-slate-600 dark:focus:bg-navy-950 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
        <p>© 2026 Kamaraj College of Engineering and Technology. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300">IT Support Desk</a>
        </div>
      </footer>
    </div>
  );
}

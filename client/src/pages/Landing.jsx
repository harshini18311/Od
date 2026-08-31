// client/src/pages/Landing.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  GraduationCap, 
  Briefcase, 
  KeyRound, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles,
  ListChecks,
  Network,
  QrCode,
  ShieldAlert
} from 'lucide-react';
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
    <div className="min-h-screen w-full flex flex-row overflow-hidden bg-cream dark:bg-dark-bg font-sans">
      {/* LEFT HALF (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[45%] bg-brown-900 bg-gradient-to-br from-brown-900 to-brown-800 flex-col justify-between p-12 relative h-screen">
        {/* Subtle background element */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brown-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-brown-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <GraduationCap className="h-16 w-16 text-terra mb-6 opacity-90" />
          <h1 className="font-serif text-5xl font-bold text-cream mb-2 tracking-tight">KCET CSE</h1>
          <h2 className="text-xl text-terra-light font-medium tracking-wide">On-Duty Approval System</h2>
        </div>

        <div className="relative z-10 space-y-8 my-auto flex-1 flex flex-col justify-center max-w-md">
          <div className="flex items-center gap-5 group">
            <div className="bg-brown-800/80 p-3.5 rounded-2xl group-hover:bg-brown-700 transition-colors shadow-inner border border-brown-700/50">
              <ListChecks className="text-gold h-6 w-6" />
            </div>
            <span className="text-cream text-lg font-medium tracking-wide">Track your OD requests</span>
          </div>
          <div className="flex items-center gap-5 group">
            <div className="bg-brown-800/80 p-3.5 rounded-2xl group-hover:bg-brown-700 transition-colors shadow-inner border border-brown-700/50">
              <Network className="text-gold h-6 w-6" />
            </div>
            <span className="text-cream text-lg font-medium tracking-wide">Multi-level approval workflow</span>
          </div>
          <div className="flex items-center gap-5 group">
            <div className="bg-brown-800/80 p-3.5 rounded-2xl group-hover:bg-brown-700 transition-colors shadow-inner border border-brown-700/50">
              <QrCode className="text-gold h-6 w-6" />
            </div>
            <span className="text-cream text-lg font-medium tracking-wide">QR verified outpass</span>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-brown-400/80 text-sm font-medium">
            © {new Date().getFullYear()} KCET — Computer Science and Engineering Department.
          </p>
        </div>
      </div>

      {/* RIGHT HALF (Scrollable content) */}
      <div className="flex-1 w-full lg:w-[55%] flex flex-col relative h-screen overflow-y-auto">
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 w-full max-w-2xl mx-auto my-auto min-h-max">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden flex flex-col items-center text-center mb-10 w-full animate-in slide-in-from-top-4 duration-700">
            <div className="bg-brown-100 dark:bg-dark-surface p-4 rounded-full mb-5 shadow-sm border border-brown-200 dark:border-dark-border">
              <GraduationCap className="h-10 w-10 text-terra" />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brown-900 dark:text-cream mb-2">KCET CSE</h1>
            <h2 className="text-sm sm:text-base text-terra dark:text-terra-light font-medium tracking-wide">On-Duty Approval System</h2>
          </div>

          <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
            {/* Portal Switcher Tabs */}
            <div className="flex p-1.5 bg-parchment dark:bg-dark-surface rounded-xl mb-10 shadow-sm border border-brown-200 dark:border-dark-border">
              <button
                type="button"
                onClick={() => handlePortalSwitch(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${
                  isStudentPortal 
                    ? 'bg-terra text-white shadow-md' 
                    : 'text-brown-600 dark:text-brown-400 hover:text-brown-900 dark:hover:text-cream hover:bg-brown-100 dark:hover:bg-dark-card'
                }`}
              >
                <GraduationCap className="h-5 w-5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => handlePortalSwitch(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${
                  !isStudentPortal 
                    ? 'bg-terra text-white shadow-md' 
                    : 'text-brown-600 dark:text-brown-400 hover:text-brown-900 dark:hover:text-cream hover:bg-brown-100 dark:hover:bg-dark-card'
                }`}
              >
                <Briefcase className="h-5 w-5" />
                Staff/Admin
              </button>
            </div>

            <div className="mb-8 space-y-2 text-center lg:text-left">
              <h2 className="font-serif text-3xl font-bold text-brown-900 dark:text-cream">Welcome Back</h2>
              <p className="text-brown-600 dark:text-brown-400 font-medium">
                Sign in to your {isStudentPortal ? 'student' : 'staff'} account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-brown-800 dark:text-brown-200 uppercase tracking-wider ml-1">
                  LOGIN ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail className="h-5 w-5 text-brown-400 group-focus-within:text-terra transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isStudentPortal ? 'Roll number (e.g. 24ucs001)' : 'Email ID (e.g. staffname@cse)'}
                    className="input-warm block w-full !pl-12 !py-3.5 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-bold text-brown-800 dark:text-brown-200 uppercase tracking-wider ml-1">
                  PASSWORD
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <KeyRound className="h-5 w-5 text-brown-400 group-focus-within:text-terra transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isStudentPortal ? 'Enter your password' : 'Enter password'}
                    className="input-warm block w-full !pl-12 !pr-12 !py-3.5 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-brown-400 hover:text-terra transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {!isStudentPortal && (
                  <div className="flex items-center justify-between gap-3 px-1 pt-2 text-xs text-brown-500 dark:text-brown-400">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Staff passwords are seeded from the staff ID sheet.
                    </span>
                    <Link to="/staff/reset-password" className="font-semibold text-terra hover:underline whitespace-nowrap">
                      Reset via OTP
                    </Link>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-terra w-full mt-2 py-4 flex items-center justify-center gap-2 group text-base font-bold"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    Sign In
                    <div className="opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      →
                    </div>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

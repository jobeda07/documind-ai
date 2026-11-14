import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, register, quickDemoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'pending' | 'deactivated' | 'general' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorType(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await register({ name, email, password });
        if (res.requires_approval) {
          setSuccessMessage(
            'Your registration was successful! However, your account requires administrator approval before you can log in. Please contact an admin.'
          );
          setIsRegister(false);
          setPassword('');
        }
      } else {
        await login({ email, password });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Authentication failed. Please check your credentials.';
      const status = axiosErr.response?.status;

      setError(msg);

      if (status === 403) {
        if (msg.toLowerCase().includes('pending')) {
          setErrorType('pending');
        } else if (msg.toLowerCase().includes('deactivated')) {
          setErrorType('deactivated');
        } else {
          setErrorType('general');
        }
      } else {
        setErrorType('general');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setErrorType(null);
    setLoading(true);
    try {
      await quickDemoLogin();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Demo login failed');
      setErrorType('general');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0b0f24] px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-indigo-900/60 bg-[#121630]/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo and Platform Name */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/30">
            <svg
              className="h-8 w-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z" />
              <path d="M16 11v1a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-1" />
              <path d="M8 22v-4" />
              <path d="M16 22v-4" />
              <path d="M12 16v6" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">DocuMind AI</h2>
          <p className="mt-1 text-xs text-slate-400">
            Enterprise Document Intelligence & Grounded AI Platform
          </p>
        </div>

        {/* Tab Toggle (Sign In vs Register) */}
        <div className="mt-6 flex rounded-xl bg-slate-900/60 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              !isRegister
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
              isRegister
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Success Alert (e.g. Account Created Pending Approval) */}
        {successMessage && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            <p className="leading-relaxed">{successMessage}</p>
          </div>
        )}

        {/* Error Alerts */}
        {error && (
          <div
            className={`mt-4 flex items-start gap-3 rounded-2xl p-4 text-xs ${
              errorType === 'pending'
                ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300'
                : errorType === 'deactivated'
                ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
            }`}
          >
            {errorType === 'pending' && <Clock className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />}
            {errorType === 'deactivated' && <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />}
            {errorType === 'general' && <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />}
            <div>
              <p className="font-bold">
                {errorType === 'pending'
                  ? 'Account Pending Approval'
                  : errorType === 'deactivated'
                  ? 'Account Deactivated'
                  : 'Authentication Error'}
              </p>
              <p className="mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pr-4 pl-10 text-xs font-medium text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pr-4 pl-10 text-xs font-medium text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pr-4 pl-10 text-xs font-medium text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:opacity-95 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Submit for Approval' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Button */}
        <div className="mt-6 border-t border-slate-800 pt-5 text-center">
          <p className="text-[11px] text-slate-400 mb-2">Want to test with the active administrator account?</p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-700/60 bg-indigo-950/40 py-2.5 text-xs font-bold text-indigo-300 hover:bg-indigo-900/40 hover:text-white transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>One-Click Admin Login (John Doe)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

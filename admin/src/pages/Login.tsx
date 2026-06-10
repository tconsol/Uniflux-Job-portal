import { useState, type FormEvent } from 'react';
import { Zap, Eye, EyeOff, Loader2, Users, BarChart3, Settings2, ShieldCheck } from 'lucide-react';
import { adminLogin } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CAPABILITIES = [
  { icon: Users,       title: 'User Management',    desc: 'View, manage and override subscriptions for all users.' },
  { icon: BarChart3,   title: 'Revenue Analytics',  desc: 'Track MRR, plan distributions and growth metrics.' },
  { icon: Settings2,   title: 'Plan Configuration', desc: 'Create and update plans with custom limits and pricing.' },
  { icon: ShieldCheck, title: 'Secure Access',       desc: 'Admin-only portal with JWT auth and role guards.' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminLogin(email, password);
      if (!data.user.isAdmin) { setError('Access denied. Admin accounts only.'); return; }
      login({ access: data.tokens.access, refresh: data.tokens.refresh }, data.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden flex">
      {/* Left — admin brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 flex-col justify-between p-10 relative overflow-hidden border-r border-gray-800">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-600/10 rounded-full" />
          <div className="absolute -bottom-24 -left-12 w-72 h-72 bg-brand-600/5 rounded-full" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white text-lg font-bold tracking-tight">Uniflux</span>
          <span className="text-xs font-semibold bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full border border-brand-600/30">
            Admin
          </span>
        </div>

        {/* Hero */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/5 text-gray-400 text-xs font-medium px-3 py-1 rounded-full mb-4 border border-white/10">
            <ShieldCheck className="w-3 h-3 text-brand-400" />
            Restricted access portal
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-3">
            Control center for<br />Uniflux platform
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
            Manage users, configure plans, monitor revenue and keep the platform running smoothly.
          </p>
        </div>

        {/* Capabilities */}
        <div className="relative space-y-3">
          {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-gray-600 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="relative border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4">
          <p className="text-yellow-500/80 text-xs leading-relaxed">
            <span className="font-semibold text-yellow-400">Restricted access.</span> This portal is for authorized administrators only. Unauthorized access attempts are logged.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center px-6 bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Uniflux Admin</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white mb-1">Admin sign in</h2>
            <p className="text-gray-500 text-sm">Restricted to authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-950/60 border border-red-700/50 text-red-400 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@uniflux.com"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 pr-11 text-white placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In to Admin Panel
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-800">
            <p className="text-center text-xs text-gray-600">
              Not an admin?{' '}
              <a href="http://localhost:3000" className="text-brand-500 hover:text-brand-400">
                Go to Uniflux app
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

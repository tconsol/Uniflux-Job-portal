import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Briefcase, Loader2, RefreshCw, Globe } from 'lucide-react';
import { verifyOtp, resendOtp, updateProfile } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Region confirm step (shown after successful verification)
  const [confirmRegion, setConfirmRegion] = useState<'US' | 'IN' | null>(null);
  const [defaultRegion, setDefaultRegion] = useState<'US' | 'IN'>('US');
  const [savingRegion, setSavingRegion] = useState(false);

  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) refs[index + 1].current?.focus();
    if (next.every((d) => d !== '')) submitOtp(next.join(''));
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) next[i] = text[i] ?? '';
    setDigits(next);
    refs[Math.min(text.length - 1, 5)].current?.focus();
    if (text.length === 6) submitOtp(text);
  }

  async function submitOtp(otp: string) {
    if (!email) { setError('Email missing. Go back to register.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await verifyOtp(email, otp);
      login(data.tokens, data.user);
      const reg = (data.user.region as 'US' | 'IN') ?? 'US';
      setDefaultRegion(reg);
      setConfirmRegion(reg); // show region confirm step instead of navigating away
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid OTP';
      setError(msg);
      setDigits(['', '', '', '', '', '']);
      refs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function continueToJobs() {
    setSavingRegion(true);
    setError('');
    try {
      if (confirmRegion && confirmRegion !== defaultRegion) {
        await updateProfile({ region: confirmRegion });
        await refreshUser();
      }
      navigate('/jobs');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save region';
      setError(msg);
    } finally {
      setSavingRegion(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResent(false);
    setError('');
    try {
      await resendOtp(email);
      setResent(true);
      setDigits(['', '', '', '', '', '']);
      refs[0].current?.focus();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Resend failed';
      setError(msg);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Jobwalkers</span>
          </div>

          {confirmRegion ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-brand-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Where do you want jobs?</h1>
              <p className="text-sm text-gray-500 mb-6">
                We picked this from your location — change it if it's wrong. You can update it anytime in your profile.
              </p>
              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 mb-6">
                {(['US', 'IN'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setConfirmRegion(r)}
                    disabled={savingRegion}
                    className={`px-6 py-2.5 text-sm font-medium rounded-lg transition disabled:opacity-60 ${
                      confirmRegion === r ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {r === 'US' ? 'United States' : 'India'}
                  </button>
                ))}
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl text-center mb-4">
                  {error}
                </div>
              )}
              <button
                onClick={continueToJobs}
                disabled={savingRegion}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingRegion && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue to jobs
              </button>
            </div>
          ) : (
          <>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-sm text-gray-500">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-gray-700">{email || 'your email'}</span>
            </p>
          </div>

          {/* OTP input */}
          <div className="flex gap-2.5 justify-center mb-6">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={loading}
                className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-colors disabled:opacity-60
                  ${digit ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-900'}
                  focus:border-brand-500`}
              />
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-brand-600 text-sm mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl text-center mb-4">
              {error}
            </div>
          )}

          {resent && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl text-center mb-4">
              New OTP sent to your email
            </div>
          )}

          {/* Resend */}
          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={resending || loading}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 disabled:opacity-50 transition-colors"
            >
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Resend code
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            Wrong email?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
              Back to register
            </Link>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

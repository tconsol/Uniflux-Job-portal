import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { forgotPassword, resetPassword, resendOtp } from '../api/auth.api';

type Step = 'email' | 'otp' | 'password' | 'done';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]       = useState<Step>('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep('otp');
      startCooldown();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  function startCooldown() {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await forgotPassword(email);
      startCooldown();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to resend OTP');
    }
  }

  function handleOtpChange(idx: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setStep('password');
    setError('');
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPass !== confirm) { setError('Passwords do not match'); return; }
    if (newPass.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await resetPassword(email, otp.join(''), newPass);
      setStep('done');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Reset failed';
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('expired')) {
        setError(msg);
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
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
            <span className="text-xl font-bold text-gray-900">Uniflux</span>
          </div>

          {/* Step: Email */}
          {step === 'email' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Forgot password?</h1>
              <p className="text-gray-500 text-center text-sm mb-6">Enter your email and we'll send a reset code.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to login
                </Link>
              </p>
            </>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Enter reset code</h1>
              <p className="text-gray-500 text-center text-sm mb-6">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Verify Code
                </button>
              </form>

              <div className="text-center mt-5 space-y-2">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm text-brand-600 hover:text-brand-700 disabled:text-gray-400 font-medium"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
                <div>
                  <button
                    onClick={() => { setStep('email'); setError(''); setOtp(['', '', '', '', '', '']); }}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Change email
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Step: New password */}
          {step === 'password' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Set new password</h1>
              <p className="text-gray-500 text-center text-sm mb-6">Choose a strong password for your account.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                      autoFocus
                      minLength={6}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="At least 6 characters"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConf ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Repeat your password"
                    />
                    <button type="button" onClick={() => setShowConf(!showConf)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password reset!</h1>
              <p className="text-gray-500 text-sm mb-8">Your password has been updated. You can now sign in.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

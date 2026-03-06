import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  CircleDollarSign,
  Building2,
  LogIn,
  AlertCircle,
  Shield,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';

type Step = 'credentials' | 'otp';

const OTP_LENGTH = 6;
const MOCK_OTP = '123456';

// ── OTP Input component ───────────────────────────────────────────────────────

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({ length, value, onChange, error }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (idx: number, char: string) => {
    if (!/^\d*$/.test(char)) return;
    const arr = value.split('');
    arr[idx] = char.slice(-1);
    const next = arr.join('').slice(0, length);
    onChange(next);
    if (char && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(paste);
    const focusIdx = Math.min(paste.length, length - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  return (
    <div className="flex justify-center gap-2.5">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputsRef.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            error
              ? 'border-red-400 focus:ring-red-400 text-red-600'
              : value[i]
              ? 'border-blue-500 focus:ring-blue-500 text-gray-900'
              : 'border-gray-300 focus:ring-blue-500 text-gray-900'
          }`}
        />
      ))}
    </div>
  );
};

// ── Main LoginPage ────────────────────────────────────────────────────────────

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('entrepreneur');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate credential validation delay
    await new Promise((r) => setTimeout(r, 800));

    // Basic validation before moving to OTP
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    // Move to OTP step
    setIsLoading(false);
    setStep('otp');
    setOtpSent(true);
    setResendTimer(30);
  };

  const handleOtpSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (otp.length !== OTP_LENGTH) {
      setError('Please enter the full 6-digit code');
      return;
    }

    if (otp !== MOCK_OTP) {
      setError('Invalid OTP code. Use 123456 for demo.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password, role);
      navigate(role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor');
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  // Auto-submit when OTP is full
  useEffect(() => {
    if (otp.length === OTP_LENGTH && step === 'otp') {
      handleOtpSubmit();
    }
  }, [otp]);

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setOtp('');
    setError(null);
  };

  const fillDemoCredentials = (userRole: UserRole) => {
    if (userRole === 'entrepreneur') {
      setEmail('sarah@techwave.io');
      setPassword('password123');
    } else {
      setEmail('michael@vcinnovate.com');
      setPassword('password123');
    }
    setRole(userRole);
  };

  const goBack = () => {
    setStep('credentials');
    setOtp('');
    setError(null);
  };

  // ── Step indicator ────────────────────────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-6">
      {[
        { num: 1, label: 'Credentials', active: step === 'credentials', done: step === 'otp' },
        { num: 2, label: 'Verify OTP', active: step === 'otp', done: false },
      ].map(({ num, label, active, done }, i) => (
        <React.Fragment key={num}>
          {i > 0 && (
            <div className={`w-10 h-0.5 ${done || active ? 'bg-blue-500' : 'bg-gray-200'}`} />
          )}
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done
                  ? 'bg-green-500 text-white'
                  : active
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {done ? <CheckCircle2 size={14} /> : num}
            </div>
            <span className={`text-xs font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to Business Nexus
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'credentials'
            ? 'Connect with investors and entrepreneurs'
            : 'Two-factor authentication'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <StepIndicator />

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start text-sm">
              <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Step 1: Credentials ─────────────────────────────────────────── */}
          {step === 'credentials' && (
            <>
              <form className="space-y-5" onSubmit={handleCredentialsSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'entrepreneur' as const, icon: Building2, label: 'Entrepreneur' },
                      { value: 'investor' as const, icon: CircleDollarSign, label: 'Investor' },
                    ]).map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        className={`py-3 px-4 border rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                          role === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setRole(value)}
                      >
                        <Icon size={18} className="mr-2" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  required
                  fullWidth
                  startAdornment={<User size={18} />}
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  required
                  fullWidth
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" fullWidth isLoading={isLoading} leftIcon={<LogIn size={18} />}>
                  Continue
                </Button>
              </form>

              {/* 2FA info badge */}
              <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <Shield size={16} className="text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700">
                  Your account is protected with <span className="font-semibold">two-factor authentication</span>. You'll receive a 6-digit OTP code in the next step.
                </p>
              </div>

              {/* Demo accounts */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => fillDemoCredentials('entrepreneur')} leftIcon={<Building2 size={16} />}>
                    Entrepreneur
                  </Button>
                  <Button variant="outline" onClick={() => fillDemoCredentials('investor')} leftIcon={<CircleDollarSign size={16} />}>
                    Investor
                  </Button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">Sign up</Link>
                </p>
              </div>
            </>
          )}

          {/* ── Step 2: OTP Verification ────────────────────────────────────── */}
          {step === 'otp' && (
            <div className="space-y-6">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to credentials
              </button>

              {/* Phone illustration */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                  <Smartphone size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Verify Your Identity</h3>
                <p className="text-sm text-gray-500 mt-1 text-center">
                  We've sent a 6-digit code to your device.
                  <br />
                  <span className="text-xs text-gray-400">
                    (Demo: use <span className="font-mono font-bold text-blue-600">123456</span>)
                  </span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit}>
                <OtpInput
                  length={OTP_LENGTH}
                  value={otp}
                  onChange={(v) => { setOtp(v); setError(null); }}
                  error={!!error}
                />

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isLoading}
                  className="mt-6"
                  leftIcon={<KeyRound size={16} />}
                >
                  Verify & Sign In
                </Button>
              </form>

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-xs text-gray-400">
                    Resend code in <span className="font-semibold text-gray-600">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-xs font-medium text-blue-600 hover:text-blue-500"
                  >
                    Didn't receive the code? Resend
                  </button>
                )}
              </div>

              {/* Security note */}
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border">
                <Shield size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Two-factor authentication adds an extra layer of security. Never share your OTP with anyone. Codes expire after 5 minutes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

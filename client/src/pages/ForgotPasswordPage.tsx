import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
} from '../services/api/auth';

interface ForgotPasswordPageProps {
  onGoLogin: () => void;
}

type Step = 'email' | 'otp' | 'reset';

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
  return null;
};

export function ForgotPasswordPage({ onGoLogin }: ForgotPasswordPageProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPasswordSendOtp(email.trim().toLowerCase());
      setSuccessMessage('OTP has been sent to the server console. Please check and enter it below.');
      setStep('otp');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPasswordVerifyOtp(email.trim().toLowerCase(), otp.trim());
      setSuccessMessage('OTP verified! You can now set your new password.');
      setStep('reset');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPasswordReset(email.trim().toLowerCase(), otp.trim(), password, confirmPassword);
      setSuccessMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        onGoLogin();
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await forgotPasswordSendOtp(email.trim().toLowerCase());
      setSuccessMessage('A new OTP has been sent to the server console.');
      setOtp('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2">
      {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              step === s
                ? 'bg-teal-600 text-white'
                : (['email', 'otp', 'reset'] as Step[]).indexOf(step) > i
                ? 'bg-teal-100 text-teal-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {(['email', 'otp', 'reset'] as Step[]).indexOf(step) > i ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              i + 1
            )}
          </div>
          {i < 2 && (
            <div
              className={`h-0.5 w-8 ${
                (['email', 'otp', 'reset'] as Step[]).indexOf(step) > i
                  ? 'bg-teal-400'
                  : 'bg-slate-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const stepLabels = (
    <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
      <span className={step === 'email' ? 'font-semibold text-teal-600' : ''}>Email</span>
      <span className={step === 'otp' ? 'font-semibold text-teal-600' : ''}>Verify OTP</span>
      <span className={step === 'reset' ? 'font-semibold text-teal-600' : ''}>New Password</span>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding (Fixed) */}
      <div className="fixed left-0 top-0 hidden h-screen w-1/2 flex-col justify-center bg-slate-900 p-16 text-white lg:p-24 md:flex">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90"></div>

        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500 text-2xl font-bold text-white shadow-lg shadow-teal-500/30">
              P
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Place<span className="text-teal-400">Mate</span>
            </h1>
          </div>

          <h2 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Reset your <br />
            <span className="text-teal-400">password.</span>
          </h2>

          <p className="mb-10 text-lg text-slate-300 md:text-xl">
            Follow the steps to securely reset your account password.
          </p>

          <div className="space-y-4">
            {[
              'Enter your registered email',
              'Verify the 6-digit OTP',
              'Set your new password',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-teal-400" />
                <span className="text-slate-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form (Scrollable) */}
      <div className="ml-0 w-full overflow-y-auto bg-white md:ml-[50%] md:w-1/2">
        <div className="flex min-h-screen items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile-only logo */}
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500 text-xl font-bold text-white shadow-lg shadow-teal-500/30">
                P
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Place<span className="text-teal-600">Mate</span>
              </h1>
            </div>

            <div>
              <button
                onClick={onGoLogin}
                className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Forgot Password
              </h2>
              <p className="mt-2 text-slate-600">
                {step === 'email' && 'Enter your email to receive a verification code'}
                {step === 'otp' && 'Enter the 6-digit OTP sent to your email'}
                {step === 'reset' && 'Create a new password for your account'}
              </p>
            </div>

            {stepIndicator}
            {stepLabels}

            <div className="space-y-4">
              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}
            </div>

            {/* Step 1: Enter Email */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="e.g. john@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Send OTP
                </Button>
              </form>
            )}

            {/* Step 2: Enter OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <Input
                  label="6-Digit OTP"
                  type="text"
                  icon={<KeyRound className="h-4 w-4" />}
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                  }}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-slate-500">
                  OTP sent to <span className="font-medium text-slate-700">{email}</span>. Check the server console.
                </p>
                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Verify OTP
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sm font-medium text-teal-600 hover:text-teal-500 disabled:opacity-50"
                  >
                    Didn't receive OTP? Resend
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <Input
                  label="New Password"
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="Min 8 chars, A-Z, a-z, 0-9, @$!%*#"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  Reset Password
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

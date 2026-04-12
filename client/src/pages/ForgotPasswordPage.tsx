import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
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
      setSuccessMessage('OTP sent to server console');
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
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP');
      return;
    }
    setIsLoading(true);
    try {
      await forgotPasswordVerifyOtp(email.trim().toLowerCase(), otp.trim());
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
      setSuccessMessage('Password reset successful!');
      setTimeout(() => onGoLogin(), 2000);
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
      setSuccessMessage('OTP sent to server console');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    if (step === 'email') return 'Forgot Password';
    if (step === 'otp') return 'Verify OTP';
    return 'Reset Password';
  };

  const getStepDesc = () => {
    if (step === 'email') return 'Enter your email to receive OTP';
    if (step === 'otp') return 'Enter the OTP sent to your email';
    return 'Create a new password';
  };

  return (
    <div className="auth-page-container">
      <div className="auth-visual-side">
        <div className="auth-visual-content">
          <div className="auth-brand-badge">
            <span className="auth-brand-icon">P</span>
            <span className="auth-brand-name">PlaceMate</span>
          </div>
          
          <div className="auth-hero-section">
            <h1 className="auth-hero-title">
              Recover Your <br />
              <span className="auth-hero-highlight">Account</span>
            </h1>
            <p className="auth-hero-text">
              No worries! Follow the simple steps to reset your password and get back to your dashboard.
            </p>
          </div>

          <div className="auth-stats-row">
            <div className="auth-stat-item">
              <span className="auth-stat-number">10K+</span>
              <span className="auth-stat-text">Students</span>
            </div>
            <div className="auth-stat-divider"></div>
            <div className="auth-stat-item">
              <span className="auth-stat-number">500+</span>
              <span className="auth-stat-text">Companies</span>
            </div>
            <div className="auth-stat-divider"></div>
            <div className="auth-stat-item">
              <span className="auth-stat-number">2K+</span>
              <span className="auth-stat-text">Placements</span>
            </div>
          </div>

          <div className="auth-visual-decoration">
            <div className="auth-circle auth-circle-1"></div>
            <div className="auth-circle auth-circle-2"></div>
            <div className="auth-circle auth-circle-3"></div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-container">
          <button onClick={onGoLogin} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#6b7280', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
            <ArrowLeft size={16} />
            <span>Back to login</span>
          </button>

          <div className="auth-form-header-section">
            <span className="auth-greeting">Account Recovery</span>
            <h2 className="auth-form-heading">{getStepTitle()}</h2>
            <p className="auth-form-desc" style={{ marginTop: '0.25rem' }}>{getStepDesc()}</p>
          </div>

          {errorMessage && <div className="auth-error-box">{errorMessage}</div>}
          {successMessage && <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#16a34a', fontSize: '0.875rem', marginBottom: '1rem' }}>{successMessage}</div>}

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="auth-form-fields">
              <div className="auth-field-group">
                <Input
                  label="Email address"
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="auth-submit-button" size="lg" isLoading={isLoading}>
                Send OTP
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-form-fields">
              <div className="auth-field-group">
                <Input
                  label="OTP (6-digit)"
                  type="text"
                  icon={<KeyRound className="h-4 w-4" />}
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>OTP sent to {email}. Check server console.</p>
              <Button type="submit" className="auth-submit-button" size="lg" isLoading={isLoading}>
                Verify OTP
              </Button>
              <button type="button" onClick={handleResendOtp} disabled={isLoading} style={{ background: 'none', border: 'none', color: '#667eea', fontSize: '0.875rem', cursor: 'pointer', marginTop: '0.75rem', width: '100%' }}>
                Resend OTP
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="auth-form-fields">
              <div className="auth-field-group">
                <Input
                  label="New Password"
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field-group">
                <Input
                  label="Confirm Password"
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="auth-submit-button" size="lg" isLoading={isLoading}>
                Reset Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
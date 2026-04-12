import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Mail,
  Lock,
  GraduationCap,
  Building2,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (
    email: string,
    password: string,
    role: 'student' | 'company' | 'admin'
  ) => Promise<void>;
  onGoRegister: () => void;
  onGoForgotPassword: () => void;
}

export function LoginPage({ onLogin, onGoRegister, onGoForgotPassword }: LoginPageProps) {
  const [role, setRole] = useState<'student' | 'company' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isAdmin = role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await onLogin(email, password, role);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student', icon: GraduationCap },
    { value: 'company', label: 'Company', icon: Building2 },
    { value: 'admin', label: 'Admin', icon: Shield },
  ];

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
              Your Career Journey <br />
              <span className="auth-hero-highlight">Starts Here</span>
            </h1>
            <p className="auth-hero-text">
              Connect with top companies, track applications, and land your dream job. 
              Join thousands of students who found their perfect placement.
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
          <div className="auth-form-header-section">
            <span className="auth-greeting">Welcome back</span>
            <h2 className="auth-form-heading">Sign in to continue</h2>
          </div>

          <div className="auth-role-pills">
            {roleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value as typeof role)}
                className={`auth-role-pill ${role === option.value ? 'auth-role-pill-active' : ''}`}
              >
                <option.icon size={16} />
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="auth-form-fields">
            {errorMessage && (
              <div className="auth-error-box">{errorMessage}</div>
            )}
            
            <div className="auth-field-group">
              <Input
                label="Email address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                required
              />
            </div>

            <div className="auth-field-group">
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />
            </div>

            <div className="auth-form-actions">
              {!isAdmin && (
                <label className="auth-remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
              )}
              {!isAdmin && (
                <button type="button" onClick={onGoForgotPassword} className="auth-forgot-link">
                  Forgot password?
                </button>
              )}
            </div>

            <Button 
              type="submit" 
              className="auth-submit-button" 
              size="lg" 
              isLoading={isLoading}
              icon={<ArrowRight size={18} />}
            >
              Sign In
            </Button>
          </form>

          {!isAdmin && (
            <p className="auth-switch-prompt">
              Don't have an account?{' '}
              <button onClick={onGoRegister} className="auth-switch-link">
                Create one
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
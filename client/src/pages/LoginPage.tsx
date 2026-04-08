import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Mail,
  Lock,
  GraduationCap,
  Building2,
  CheckCircle2,
  Shield,
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

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding (Fixed) */}
      <div className="fixed left-0 top-0 hidden h-screen w-1/2 flex-col justify-center bg-theme-base p-16 text-white lg:p-24 md:flex">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-hero"></div>

        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-brand text-2xl font-bold text-white shadow-brand-icon">
              P
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Place<span className="text-brand-accent">Mate</span>
            </h1>
          </div>

          <h2 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl font-display">
            Launch your career <br />
            <span className="text-brand-accent">with confidence.</span>
          </h2>

          <p className="mb-10 text-lg text-theme-secondary md:text-xl">
            The complete placement management ecosystem connecting students,
            universities, and top companies.
          </p>

          <div className="space-y-4">
            {[
              'Streamlined application tracking',
              'Real-time interview scheduling',
              'Comprehensive placement analytics',
              'Direct communication channels',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-brand-accent" />
                <span className="text-theme-light">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Scrollable) */}
      <div className="ml-0 w-full overflow-y-auto bg-theme-surface md:ml-[50%] md:w-1/2">
        <div className="flex min-h-screen items-center justify-center p-8 md:p-16">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile-only logo */}
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand text-xl font-bold text-white shadow-brand-icon">
                P
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-theme-primary font-display">
                Place<span className="text-brand-accent">Mate</span>
              </h1>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-theme-primary font-display">
                Welcome back
              </h2>
              <p className="mt-2 text-theme-secondary">
                Please sign in to your account
              </p>
            </div>

            {/* Role Selector */}
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-theme-elevated p-1.5 border border-brand-light">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                  role === 'student'
                    ? 'bg-gradient-brand text-white shadow-brand-icon'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary-light'
                }`}
              >
                <GraduationCap className="mb-1.5 h-5 w-5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('company')}
                className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                  role === 'company'
                    ? 'bg-gradient-brand text-white shadow-brand-icon'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary-light'
                }`}
              >
                <Building2 className="mb-1.5 h-5 w-5" />
                Company
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                  role === 'admin'
                    ? 'bg-gradient-brand text-white shadow-brand-icon'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary-light'
                }`}
              >
                <Shield className="mb-1.5 h-5 w-5" />
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {errorMessage && (
                  <div className="rounded-md border border-rose/30 bg-rose-light px-3 py-2 text-sm text-rose-light">
                    {errorMessage}
                  </div>
                )}
                <Input
                  label="Email address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-5 w-5" />}
                  required
                />

                <div className="space-y-1">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="e.g. @Password123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-5 w-5" />}
                    required
                  />

                  {!isAdmin && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={onGoForgotPassword}
                        className="text-sm font-medium text-brand-primary hover:text-brand-accent-hover underline underline-offset-2 decoration-brand-accent hover:decoration-brand-accent-hover transition-all"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!isAdmin && (
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-brand-accent bg-theme-elevated text-brand-primary focus:ring-brand"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-theme-secondary"
                  >
                    Remember me
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-brand"
                size="lg"
                isLoading={isLoading}
              >
                Sign in as {role.charAt(0).toUpperCase() + role.slice(1)}
              </Button>
            </form>

            {!isAdmin && (
              <p className="text-center text-sm text-theme-secondary">
                Don't have an account?{' '}
                <button
                  onClick={onGoRegister}
                  className="font-medium text-brand-primary hover:text-brand-accent-hover underline underline-offset-2 decoration-brand-accent hover:decoration-brand-accent-hover transition-all"
                >
                  Register
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

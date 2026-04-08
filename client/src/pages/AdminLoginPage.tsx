import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, Shield } from 'lucide-react';

interface AdminLoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoUserLogin: () => void;
}

export function AdminLoginPage({ onLogin, onGoUserLogin }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Admin login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-base p-6">
      <div className="w-full max-w-md rounded-xl border border-theme bg-theme-surface p-8 shadow-theme">
        <div className="mb-6 flex items-center gap-2 text-theme-primary">
          <Shield className="h-5 w-5 text-brand-primary" />
          <h1 className="text-2xl font-bold">Admin Login</h1>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="rounded-md border border-rose/30 bg-rose-light px-3 py-2 text-sm text-rose-light">
              {errorMessage}
            </div>
          )}
          <Input
            label="Admin Email"
            type="email"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Button className="w-full bg-gradient-brand" type="submit" isLoading={isLoading}>
            Sign in as Admin
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-theme-secondary">
          Student/Company login?{' '}
          <button onClick={onGoUserLogin} className="font-medium text-brand-primary hover:text-brand-accent-hover">
            Go to user login
          </button>
        </p>
      </div>
    </div>
  );
}

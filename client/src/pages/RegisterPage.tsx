import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Building2, GraduationCap, Lock, Mail, User } from 'lucide-react';
import { registerUser } from '../services/api/auth';

interface RegisterPageProps {
  onGoLogin: () => void;
}

export function RegisterPage({ onGoLogin }: RegisterPageProps) {
  const [role, setRole] = useState<'student' | 'company'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      await registerUser(name, email, password, role);
      setSuccessMessage('Registration successful. Please login.');
      setName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Register</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a student or company account.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setRole('student')}
            className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium ${role === 'student' ? 'bg-white text-teal-600' : 'text-slate-600'}`}
          >
            <GraduationCap className="h-4 w-4" />
            Student
          </button>
          <button
            onClick={() => setRole('company')}
            className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium ${role === 'company' ? 'bg-white text-teal-600' : 'text-slate-600'}`}
          >
            <Building2 className="h-4 w-4" />
            Company
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleRegister}>
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </div>
          )}
          <Input
            label="Full Name"
            icon={<User className="h-4 w-4" />}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Input
            label="Email"
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
          <Button className="w-full" type="submit" isLoading={isLoading}>
            Register as {role}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button onClick={onGoLogin} className="font-medium text-teal-600 hover:text-teal-500">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

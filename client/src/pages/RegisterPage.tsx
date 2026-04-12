import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Building2,
  GraduationCap,
  Lock,
  Mail,
  User,
  Phone,
  BookOpen,
  Hash,
  Briefcase,
  Globe,
  MapPin,
} from 'lucide-react';
import { registerStudent, registerCompany } from '../services/api/auth';

interface RegisterPageProps {
  onGoLogin: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain uppercase';
  if (!/[a-z]/.test(password)) return 'Password must contain lowercase';
  if (!/[0-9]/.test(password)) return 'Password must contain number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain special char';
  return null;
};

const validatePhone = (phone: string): boolean => /^\d{10}$/.test(phone);

export function RegisterPage({ onGoLogin }: RegisterPageProps) {
  const [role, setRole] = useState<'student' | 'company'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [phone, setPhone] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [skills, setSkills] = useState('');
  const [hrName, setHrName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');

  const validateStudentForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!name.trim()) newErrors.name = 'Required';
    if (!email.trim()) newErrors.email = 'Required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid email';
    const pwdErr = validatePassword(password);
    if (pwdErr) newErrors.password = pwdErr;
    if (password !== confirmPassword) newErrors.confirmPassword = 'Mismatch';
    if (!enrollmentNumber.trim()) newErrors.enrollmentNumber = 'Required';
    if (!department.trim()) newErrors.department = 'Required';
    if (!year) newErrors.year = 'Required';
    if (!phone.trim()) newErrors.phone = 'Required';
    else if (!validatePhone(phone)) newErrors.phone = 'Invalid';
    if (!cgpa) newErrors.cgpa = 'Required';
    return newErrors;
  };

  const validateCompanyForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!name.trim()) newErrors.name = 'Required';
    if (!email.trim()) newErrors.email = 'Required';
    else if (!validateEmail(email)) newErrors.email = 'Invalid';
    const pwdErr = validatePassword(password);
    if (pwdErr) newErrors.password = pwdErr;
    if (password !== confirmPassword) newErrors.confirmPassword = 'Mismatch';
    if (!hrName.trim()) newErrors.hrName = 'Required';
    if (!companyPhone.trim()) newErrors.companyPhone = 'Required';
    else if (!validatePhone(companyPhone)) newErrors.companyPhone = 'Invalid';
    if (!location.trim()) newErrors.location = 'Required';
    return newErrors;
  };

  const handleRoleChange = (newRole: 'student' | 'company') => {
    setRole(newRole);
    setErrors({});
    setErrorMessage('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const validationErrors = role === 'student' ? validateStudentForm() : validateCompanyForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      if (role === 'student') {
        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
        await registerStudent({
          role: 'student',
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          enrollmentNumber: enrollmentNumber.trim(),
          department: department.trim(),
          year: Number(year),
          phone: phone.trim(),
          cgpa: Number(cgpa),
          skills: skillsArray,
        });
      } else {
        await registerCompany({
          role: 'company',
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          hrName: hrName.trim(),
          companyPhone: companyPhone.trim(),
          location: location.trim(),
          website: website.trim() || undefined,
        });
      }
      setSuccessMessage('Registration successful! Redirecting...');
      setTimeout(() => onGoLogin(), 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="auth-hero-title">Create Your <br/><span className="auth-hero-highlight">Future Today</span></h1>
            <p className="auth-hero-text">
              {role === 'student' 
                ? 'Build your profile and connect with top companies.'
                : 'Post jobs and find the best students.'}
            </p>
          </div>
          <div className="auth-stats-row">
            <div className="auth-stat-item"><span className="auth-stat-number">10K+</span><span className="auth-stat-text">Students</span></div>
            <div className="auth-stat-divider"></div>
            <div className="auth-stat-item"><span className="auth-stat-number">500+</span><span className="auth-stat-text">Companies</span></div>
            <div className="auth-stat-divider"></div>
            <div className="auth-stat-item"><span className="auth-stat-number">2K+</span><span className="auth-stat-text">Placements</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-form-header-section">
            <span className="auth-greeting">Get Started</span>
            <h2 className="auth-form-heading">Create your account</h2>
          </div>

          <div className="auth-role-pills" style={{marginBottom: '1.5rem'}}>
            <button type="button" onClick={() => handleRoleChange('student')} className={`auth-role-pill ${role === 'student' ? 'auth-role-pill-active' : ''}`}>
              <GraduationCap size={16} /><span>Student</span>
            </button>
            <button type="button" onClick={() => handleRoleChange('company')} className={`auth-role-pill ${role === 'company' ? 'auth-role-pill-active' : ''}`}>
              <Building2 size={16} /><span>Company</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-fields">
            {errorMessage && <div className="auth-error-box">{errorMessage}</div>}
            {successMessage && <div style={{padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#16a34a', fontSize: '0.875rem'}}>{successMessage}</div>}

            <div className="auth-field-group">
              <Input label={role === 'student' ? 'Full Name' : 'Company Name'} icon={<User className="h-4 w-4" />} placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required />
            </div>
            <div className="auth-field-group">
              <Input label="Email address" type="email" icon={<Mail className="h-4 w-4" />} placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
              <div className="auth-field-group">
                <Input label="Password" type="password" icon={<Lock className="h-4 w-4" />} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} required />
              </div>
              <div className="auth-field-group">
                <Input label="Confirm" type="password" icon={<Lock className="h-4 w-4" />} placeholder="Confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} required />
              </div>
            </div>

            {role === 'student' && (
              <>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="auth-field-group"><Input label="Enrollment No." icon={<Hash className="h-4 w-4" />} placeholder="ENR number" value={enrollmentNumber} onChange={(e) => setEnrollmentNumber(e.target.value)} error={errors.enrollmentNumber} required /></div>
                  <div className="auth-field-group"><Input label="Department" icon={<BookOpen className="h-4 w-4" />} placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} error={errors.department} required /></div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                  <div className="auth-field-group"><Input label="Year" type="number" placeholder="1-6" value={year} onChange={(e) => setYear(e.target.value)} error={errors.year} required /></div>
                  <div className="auth-field-group"><Input label="Phone" type="tel" icon={<Phone className="h-4 w-4" />} placeholder="10-digit" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} required /></div>
                  <div className="auth-field-group"><Input label="CGPA" type="number" placeholder="0-10" value={cgpa} onChange={(e) => setCgpa(e.target.value)} error={errors.cgpa} required /></div>
                </div>
                <div className="auth-field-group"><Input label="Skills" icon={<Briefcase className="h-4 w-4" />} placeholder="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} /></div>
              </>
            )}

            {role === 'company' && (
              <>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="auth-field-group"><Input label="HR Name" icon={<User className="h-4 w-4" />} placeholder="Contact person" value={hrName} onChange={(e) => setHrName(e.target.value)} error={errors.hrName} required /></div>
                  <div className="auth-field-group"><Input label="Phone" type="tel" icon={<Phone className="h-4 w-4" />} placeholder="10-digit" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} error={errors.companyPhone} required /></div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="auth-field-group"><Input label="Location" icon={<MapPin className="h-4 w-4" />} placeholder="City" value={location} onChange={(e) => setLocation(e.target.value)} error={errors.location} required /></div>
                  <div className="auth-field-group"><Input label="Website" icon={<Globe className="h-4 w-4" />} placeholder="Optional" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
                </div>
              </>
            )}

            <Button type="submit" className="auth-submit-button" size="lg" isLoading={isLoading}>Create Account</Button>
          </form>

          <p className="auth-switch-prompt">Already have an account? <button onClick={onGoLogin} className="auth-switch-link">Sign in</button></p>
        </div>
      </div>
    </div>
  );
}
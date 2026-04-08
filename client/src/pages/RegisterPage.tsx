import React, { useState, useCallback } from 'react';
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
  Award,
  Hash,
  Briefcase,
  Globe,
  MapPin,
  FileText,
  Linkedin,
  Github,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { registerStudent, registerCompany } from '../services/api/auth';

interface RegisterPageProps {
  onGoLogin: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
  return null;
};

const validatePhone = (phone: string): boolean => {
  return /^\d{10}$/.test(phone);
};

const validateUrl = (url: string): boolean => {
  if (!url) return true;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export function RegisterPage({ onGoLogin }: RegisterPageProps) {
  const [role, setRole] = useState<'student' | 'company'>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Student fields
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [phone, setPhone] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [skills, setSkills] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Company fields
  const [hrName, setHrName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEnrollmentNumber('');
    setDepartment('');
    setYear('');
    setPhone('');
    setCgpa('');
    setSkills('');
    setLinkedinUrl('');
    setGithubUrl('');
    setPortfolioUrl('');
    setHrName('');
    setCompanyPhone('');
    setLocation('');
    setWebsite('');
    setIndustry('');
    setDescription('');
    setErrors({});
  }, []);

  const validateStudentForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!name.trim()) newErrors.name = 'Full name is required';
    else if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email address';

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!enrollmentNumber.trim()) newErrors.enrollmentNumber = 'Enrollment number is required';

    if (!department.trim()) newErrors.department = 'Department is required';

    if (!year) newErrors.year = 'Year is required';
    else if (Number(year) < 1 || Number(year) > 6) newErrors.year = 'Year must be between 1 and 6';

    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!validatePhone(phone)) newErrors.phone = 'Phone number must be exactly 10 digits';

    if (!cgpa) newErrors.cgpa = 'CGPA is required';
    else if (Number(cgpa) < 0 || Number(cgpa) > 10) newErrors.cgpa = 'CGPA must be between 0 and 10';

    if (linkedinUrl && !validateUrl(linkedinUrl)) newErrors.linkedinUrl = 'Please enter a valid URL';
    if (githubUrl && !validateUrl(githubUrl)) newErrors.githubUrl = 'Please enter a valid URL';
    if (portfolioUrl && !validateUrl(portfolioUrl)) newErrors.portfolioUrl = 'Please enter a valid URL';

    return newErrors;
  };

  const validateCompanyForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!name.trim()) newErrors.name = 'Company name is required';
    else if (name.trim().length < 2) newErrors.name = 'Company name must be at least 2 characters';

    if (!email.trim()) newErrors.email = 'Official email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email address';

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!hrName.trim()) newErrors.hrName = 'HR/Contact person name is required';
    else if (hrName.trim().length < 2) newErrors.hrName = 'Name must be at least 2 characters';

    if (!companyPhone.trim()) newErrors.companyPhone = 'Phone number is required';
    else if (!validatePhone(companyPhone)) newErrors.companyPhone = 'Phone number must be exactly 10 digits';

    if (!location.trim()) newErrors.location = 'Company location is required';

    if (website && !validateUrl(website)) newErrors.website = 'Please enter a valid URL';

    return newErrors;
  };

  const handleRoleChange = (newRole: 'student' | 'company') => {
    setRole(newRole);
    setErrors({});
    setErrorMessage('');
    setSuccessMessage('');
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
        const skillsArray = skills
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

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
          linkedinUrl: linkedinUrl.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          portfolioUrl: portfolioUrl.trim() || undefined,
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
          industry: industry.trim() || undefined,
          description: description.trim() || undefined,
        });
      }

      setSuccessMessage('Registration successful! Redirecting to login...');
      resetForm();
      setTimeout(() => {
        onGoLogin();
      }, 2000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed. Please try again.');
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
            <h1 className="text-3xl font-bold tracking-tight font-display">
              Place<span className="text-brand-accent">Mate</span>
            </h1>
          </div>

          <h2 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl font-display">
            Start your journey <br />
            <span className="text-brand-accent">today.</span>
          </h2>

          <p className="mb-10 text-lg text-theme-secondary md:text-xl">
            Join thousands of students and companies using PlaceMate for seamless placement management.
          </p>

          <div className="space-y-4">
            {[
              role === 'student'
                ? 'Create your student profile in minutes'
                : 'Register your company and post opportunities',
              'Secure data handling and privacy',
              role === 'student'
                ? 'Apply to jobs and internships easily'
                : 'Access a pool of talented students',
              'Track applications in real-time',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-brand-accent" />
                <span className="text-theme-light">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form (Scrollable) */}
      <div className="ml-0 w-full overflow-y-auto bg-theme-surface md:ml-[50%] md:w-1/2">
        <div className="flex min-h-screen items-start justify-center p-6 md:p-10 lg:p-16">
          <div className="w-full max-w-lg space-y-6">
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
                Create an account
              </h2>
              <p className="mt-2 text-theme-secondary">
                Fill in your details to get started
              </p>
            </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-theme-elevated p-1.5 border border-brand-light">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
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
              onClick={() => handleRoleChange('company')}
              className={`flex flex-col items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                role === 'company'
                  ? 'bg-gradient-brand text-white shadow-brand-icon'
                  : 'text-theme-muted hover:text-theme-primary hover:bg-theme-primary-light'
              }`}
            >
              <Building2 className="mb-1.5 h-5 w-5" />
              Company
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="rounded-lg border border-rose/30 bg-rose-light px-4 py-3 text-sm text-rose-light">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="rounded-lg border border-emerald/30 bg-emerald-light px-4 py-3 text-sm text-emerald-light">
                {successMessage}
              </div>
            )}

            {/* Section: Account Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-muted">
                Account Details
              </h3>

              <Input
                label={role === 'student' ? 'Full Name' : 'Company Name'}
                icon={role === 'student' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                placeholder={role === 'student' ? 'e.g. John Doe' : 'e.g. Acme Corp'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
              />

              <Input
                label={role === 'student' ? 'Email Address' : 'Official Email'}
                type="email"
                icon={<Mail className="h-4 w-4" />}
                placeholder={role === 'student' ? 'e.g. john@university.edu' : 'e.g. hr@acmecorp.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Password"
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="Min 8 chars, A-Z, a-z, 0-9, @$!%*#"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  required
                />
              </div>
            </div>

            {/* Student-specific fields */}
            {role === 'student' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-muted">
                  Academic Details
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Enrollment Number"
                    icon={<Hash className="h-4 w-4" />}
                    placeholder="e.g. ENR2024001"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    error={errors.enrollmentNumber}
                    required
                  />
                  <Input
                    label="Department"
                    icon={<BookOpen className="h-4 w-4" />}
                    placeholder="e.g. Computer Science"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    error={errors.department}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="Year"
                    type="number"
                    icon={<BookOpen className="h-4 w-4" />}
                    placeholder="e.g. 3"
                    min={1}
                    max={6}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    error={errors.year}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={errors.phone}
                    required
                  />
                  <Input
                    label="CGPA"
                    type="number"
                    icon={<Award className="h-4 w-4" />}
                    placeholder="e.g. 8.5"
                    min={0}
                    max={10}
                    step={0.01}
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    error={errors.cgpa}
                    required
                  />
                </div>

                <Input
                  label="Skills"
                  icon={<Briefcase className="h-4 w-4" />}
                  placeholder="e.g. JavaScript, Python, React (comma-separated)"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />

                <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-muted">
                  Online Profiles <span className="font-normal normal-case text-theme-muted">(Optional)</span>
                </h3>

                <Input
                  label="LinkedIn URL"
                  icon={<Linkedin className="h-4 w-4" />}
                  placeholder="e.g. https://linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  error={errors.linkedinUrl}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="GitHub URL"
                    icon={<Github className="h-4 w-4" />}
                    placeholder="e.g. https://github.com/yourusername"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    error={errors.githubUrl}
                  />
                  <Input
                    label="Portfolio URL"
                    icon={<ExternalLink className="h-4 w-4" />}
                    placeholder="e.g. https://yourportfolio.com"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    error={errors.portfolioUrl}
                  />
                </div>
              </div>
            )}

            {/* Company-specific fields */}
            {role === 'company' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-muted">
                  Company Details
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="HR / Contact Person Name"
                    icon={<User className="h-4 w-4" />}
                    placeholder="e.g. Jane Smith"
                    value={hrName}
                    onChange={(e) => setHrName(e.target.value)}
                    error={errors.hrName}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    icon={<Phone className="h-4 w-4" />}
                    placeholder="10-digit mobile number"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    error={errors.companyPhone}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Company Location"
                    icon={<MapPin className="h-4 w-4" />}
                    placeholder="e.g. Bangalore, India"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    error={errors.location}
                    required
                  />
                  <Input
                    label="Company Website"
                    icon={<Globe className="h-4 w-4" />}
                    placeholder="e.g. https://acmecorp.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    error={errors.website}
                  />
                </div>

                <Input
                  label="Industry Type"
                  icon={<Briefcase className="h-4 w-4" />}
                  placeholder="e.g. Information Technology, Finance, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />

                <div className="w-full">
                  <label className="mb-1 block text-sm font-medium text-theme-secondary">
                    Company Description
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-theme-muted">
                      <FileText className="h-4 w-4" />
                    </div>
                    <textarea
                      className="block min-h-[100px] w-full rounded-lg border border-brand-accent bg-theme-elevated py-2.5 pl-10 pr-3 text-sm text-theme-primary placeholder:text-theme-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary-light disabled:bg-theme-surface disabled:text-theme-muted"
                      placeholder="Brief description about your company, culture, and what you do..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={1000}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button className="w-full bg-gradient-brand" type="submit" size="lg" isLoading={isLoading}>
              Create {role === 'student' ? 'Student' : 'Company'} Account
            </Button>
          </form>

          <p className="text-center text-sm text-theme-secondary">
            Already have an account?{' '}
            <button onClick={onGoLogin} className="font-medium text-brand-primary hover:text-brand-accent-hover">
              Sign in
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

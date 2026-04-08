import { useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import './index.css';
import './styles/student.css';
import './styles/company.css';
import './styles/admin.css';
import './styles/chat.css';
import './styles/shared.css';
import './styles/utility.css';
import { useAuth } from './context/AuthContext';
// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { ResumeManagement } from './pages/student/ResumeManagement';
import { BrowseJobs } from './pages/student/BrowseJobs';
import { JobDetails } from './pages/student/JobDetails';
import { MyApplications } from './pages/student/MyApplications';
import { StudentSettings } from './pages/student/StudentSettings';
// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StudentManagement } from './pages/admin/StudentManagement';
import { StudentDetail } from './pages/admin/StudentDetail';
import { CompanyManagement } from './pages/admin/CompanyManagement';
import { JobManagement } from './pages/admin/JobManagement';
import { ApplicationTracking } from './pages/admin/ApplicationTracking';
import { InterviewManagement } from './pages/admin/InterviewManagement';
import { PlacementReports } from './pages/admin/PlacementReports';
import { AdminSettings } from './pages/admin/AdminSettings';
// Company Pages
import { CompanyDashboard } from './pages/company/CompanyDashboard';
import { CompanyJobPostings } from './pages/company/CompanyJobPostings';
import { ApplicantList } from './pages/company/ApplicantList';
import { CompanyProfile } from './pages/company/CompanyProfile';
import { UpcomingInterviews } from './pages/company/UpcomingInterviews';
import { CompanySettings } from './pages/company/CompanySettings';
import { ChatPage } from './pages/shared/ChatPage';

type UserRole = 'student' | 'admin' | 'company';

const getProtectedPath = (role: UserRole, path: string): string => {
  const normalizedPath = path.replace(/^\/+/, '') || 'dashboard';
  return `/${role}/${normalizedPath}`;
};

const getPathFromProtectedUrl = (role: UserRole, pathname: string): string | null => {
  const prefix = `/${role}`;
  if (pathname === prefix || pathname === `${prefix}/`) {
    return 'dashboard';
  }
  if (!pathname.startsWith(`${prefix}/`)) {
    return null;
  }
  return pathname.slice(prefix.length + 1) || 'dashboard';
};

export function App() {
  const { isAuthenticated, isLoading, user, loginUser, loginAdmin, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState('dashboard');
  const [publicPath, setPublicPath] = useState(window.location.pathname || '/');
  useEffect(() => {
    const handleBrowserPath = (): void => {
      setPublicPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handleBrowserPath);
    return () => window.removeEventListener('popstate', handleBrowserPath);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.role) {
      return;
    }
    const parsedPath = getPathFromProtectedUrl(user.role as UserRole, publicPath);
    if (parsedPath) {
      setCurrentPath(parsedPath);
      return;
    }
    const fallbackPath = getProtectedPath(user.role as UserRole, 'dashboard');
    window.history.replaceState({}, '', fallbackPath);
    setPublicPath(fallbackPath);
    setCurrentPath('dashboard');
  }, [isAuthenticated, user?.role, publicPath]);

  const navigatePublic = (path: '/' | '/register' | '/forgot-password'): void => {
    window.history.pushState({}, '', path);
    setPublicPath(path);
  };
  const navigateProtected = (role: UserRole, path: string, replace = false): void => {
    const protectedPath = getProtectedPath(role, path);
    window.history[replace ? 'replaceState' : 'pushState']({}, '', protectedPath);
    setPublicPath(protectedPath);
    setCurrentPath(path.replace(/^\/+/, '') || 'dashboard');
  };

  const handleUserLogin = async (
    email: string,
    password: string,
    role: 'student' | 'company' | 'admin'
  ): Promise<void> => {
    if (role === 'admin') {
      await loginAdmin(email, password);
      navigateProtected('admin', 'dashboard', true);
    } else {
      await loginUser(email, password, role);
      navigateProtected(role, 'dashboard', true);
    }
  };
  const handleLogout = (): void => {
    logout();
    setCurrentPath('dashboard');
    navigatePublic('/');
  };
  const handleNavigate = (path: string): void => {
    if (!user?.role) {
      return;
    }
    navigateProtected(user.role as UserRole, path);
  };
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  if (!isAuthenticated) {
    if (publicPath === '/register') {
      return <RegisterPage onGoLogin={() => navigatePublic('/')} />;
    }
    if (publicPath === '/forgot-password') {
      return <ForgotPasswordPage onGoLogin={() => navigatePublic('/')} />;
    }
    return (
      <LoginPage
        onLogin={handleUserLogin}
        onGoRegister={() => navigatePublic('/register')}
        onGoForgotPassword={() => navigatePublic('/forgot-password')}
      />
    );
  }
  const userRole = user?.role || 'student';
  // Router Logic
  if (userRole === 'student') {
    if (currentPath === 'dashboard')
    return (
      <StudentDashboard onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'profile')
    return (
      <StudentProfile onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'resume')
    return (
      <ResumeManagement onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'jobs')
    return <BrowseJobs onNavigate={handleNavigate} onLogout={handleLogout} />;
    if (currentPath.startsWith('jobs/'))
    return (
      <JobDetails
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        jobId={currentPath.split('/')[1]} />);


    if (currentPath === 'applications')
    return (
      <MyApplications onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'settings')
    return (
      <StudentSettings onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'chat' || currentPath.startsWith('chat/'))
    return (
      <ChatPage
        userRole="student"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        initialConversationId={currentPath.split('/')[1] || ''} />);

    return (
      <StudentDashboard onNavigate={handleNavigate} onLogout={handleLogout} />);

  }
  if (userRole === 'admin') {
    if (currentPath === 'dashboard')
    return (
      <AdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'students')
    return (
      <StudentManagement
        onNavigate={handleNavigate}
        onLogout={handleLogout} />);


    if (currentPath.startsWith('students/'))
    return (
      <StudentDetail
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        studentId={currentPath.split('/')[1]} />);


    if (currentPath === 'companies')
    return (
      <CompanyManagement
        onNavigate={handleNavigate}
        onLogout={handleLogout} />);


    if (currentPath === 'jobs')
    return (
      <JobManagement onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'applications')
    return (
      <ApplicationTracking
        onNavigate={handleNavigate}
        onLogout={handleLogout} />);


    if (currentPath === 'interviews')
    return (
      <InterviewManagement
        onNavigate={handleNavigate}
        onLogout={handleLogout} />);


    if (currentPath === 'reports')
    return (
      <PlacementReports onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'settings')
    return (
      <AdminSettings onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'chat' || currentPath.startsWith('chat/'))
    return (
      <ChatPage
        userRole="admin"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        initialConversationId={currentPath.split('/')[1] || ''} />);

    return (
      <AdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />);

  }
  if (userRole === 'company') {
    if (currentPath === 'dashboard')
    return (
      <CompanyDashboard onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'company-jobs')
    return (
      <CompanyJobPostings
        onNavigate={handleNavigate}
        onLogout={handleLogout} />);


    if (currentPath === 'applicants')
    return (
      <ApplicantList onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'profile')
    return (
      <CompanyProfile onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'interviews')
    return (
      <UpcomingInterviews onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'settings')
    return (
      <CompanySettings onNavigate={handleNavigate} onLogout={handleLogout} />);

    if (currentPath === 'chat' || currentPath.startsWith('chat/'))
    return (
      <ChatPage
        userRole="company"
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        initialConversationId={currentPath.split('/')[1] || ''} />);

    return (
      <CompanyDashboard onNavigate={handleNavigate} onLogout={handleLogout} />);

  }
  return (
    <LoginPage
      onLogin={handleUserLogin}
      onGoRegister={() => navigatePublic('/register')}
      onGoForgotPassword={() => navigatePublic('/forgot-password')}
    />
  );
}

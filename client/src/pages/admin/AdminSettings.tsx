import { type FormEvent, useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import {
  changeAdminPassword,
  getAdminSettings,
  updateAdminEmail,
  updateAdminSettings
} from '../../services/api/admin';
import {
  Bell,
  Lock,
  Mail,
  Save,
  Settings2,
  Shield,
  Sparkles
} from 'lucide-react';

interface AdminSettingsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function AdminSettings({ onNavigate, onLogout }: AdminSettingsProps) {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [newStudentAlerts, setNewStudentAlerts] = useState(true);
  const [companyApprovals, setCompanyApprovals] = useState(true);
  const [reportReadyAlerts, setReportReadyAlerts] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [autoCloseExpiredJobs, setAutoCloseExpiredJobs] = useState(true);
  const [weeklyReportDigest, setWeeklyReportDigest] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getAdminSettings();
        setCurrentEmail(settings.email || user?.email || '');
        setNewStudentAlerts(settings.notifications.newStudentAlerts);
        setCompanyApprovals(settings.notifications.companyApprovals);
        setReportReadyAlerts(settings.notifications.reportReadyAlerts);
        setDarkMode(settings.preferences.darkMode);
        setAutoCloseExpiredJobs(settings.preferences.autoCloseExpiredJobs);
        setWeeklyReportDigest(settings.preferences.weeklyReportDigest);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    void loadSettings();
  }, [user?.email]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 4000);
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showError('All password fields are required');
      return;
    }
    if (newPassword.length < 8) {
      showError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeAdminPassword(currentPassword, newPassword, confirmNewPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showSuccess('Password changed successfully. Please login again.');
      setTimeout(() => {
        logout();
        onNavigate('dashboard');
      }, 2000);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!newEmail || !emailPassword) {
      showError('New email and password are required');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const result = await updateAdminEmail(newEmail, emailPassword);
      setCurrentEmail(result.email);
      setNewEmail('');
      setEmailPassword('');

      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as Record<string, unknown>;
        localStorage.setItem('auth_user', JSON.stringify({ ...parsedUser, email: result.email }));
      }

      showSuccess('Email updated successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await updateAdminSettings({
        notifications: {
          newStudentAlerts,
          companyApprovals,
          reportReadyAlerts
        }
      });
      showSuccess('Notification preferences saved');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await updateAdminSettings({
        preferences: {
          darkMode,
          autoCloseExpiredJobs,
          weeklyReportDigest
        }
      });
      showSuccess('Admin preferences saved');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        userRole="admin"
        currentPath="settings"
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={{ name: user?.name || 'Admin', email: user?.email || '' }}
        breadcrumbs={[{ label: 'Settings' }]}
      >
        <div className="admin-panel admin-card--padded">Loading settings...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole="admin"
      currentPath="settings"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{ name: user?.name || 'Admin', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <div className="admin-page admin-page__narrow">
        <div className="admin-hero admin-hero--teal">
          <div className="admin-hero__row">
            <div className="admin-hero__body">
              <span className="admin-hero__eyebrow">Admin Settings</span>
              <h1 className="admin-hero__title">Control Center</h1>
              <p className="admin-hero__subtitle">
                Manage admin account security, notifications, and platform preferences from one consistent workspace.
              </p>
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="admin-alert admin-alert--success">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="admin-alert admin-alert--error">{errorMessage}</div>
        )}

        <div className="admin-panel">
          <h2 className="admin-section__title">
            <Shield className="h-5 w-5 text-teal-600" />
            Account Settings
          </h2>

          <form onSubmit={handleChangePassword} className="admin-form">
            <h3 className="admin-field__label">
              Change Password
            </h3>
            <div className="admin-grid admin-grid--three">
              <Input label="Current Password" type="password" icon={<Lock className="h-4 w-4" />} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <Input label="New Password" type="password" icon={<Lock className="h-4 w-4" />} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Input label="Confirm New Password" type="password" icon={<Lock className="h-4 w-4" />} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
            </div>
            <Button type="submit" isLoading={isChangingPassword} icon={<Lock className="h-4 w-4" />}>
              Change Password
            </Button>
          </form>

          <div className="admin-form admin-form--section-divider">
            <h3 className="admin-field__label">
              Update Email
            </h3>
            <form onSubmit={handleUpdateEmail} className="admin-form">
              <div className="admin-grid admin-grid--three">
                <Input label="Current Email" type="email" icon={<Mail className="h-4 w-4" />} value={currentEmail} disabled />
                <Input label="New Email" type="email" icon={<Mail className="h-4 w-4" />} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Input label="Password" type="password" icon={<Lock className="h-4 w-4" />} value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
              </div>
              <Button type="submit" isLoading={isUpdatingEmail} icon={<Mail className="h-4 w-4" />}>
                Update Email
              </Button>
            </form>
          </div>
        </div>

        <div className="admin-panel">
          <h2 className="admin-section__title">
            <Bell className="h-5 w-5 text-teal-600" />
            Notification Preferences
          </h2>
          <div className="admin-toggle-group">
            <ToggleSwitch label="New Student Alerts" description="Receive updates when student activity needs admin review." checked={newStudentAlerts} onChange={setNewStudentAlerts} />
            <ToggleSwitch label="Company Activity Alerts" description="Stay informed about company-side hiring updates and changes." checked={companyApprovals} onChange={setCompanyApprovals} />
            <ToggleSwitch label="Report Ready Alerts" description="Get notified when major report summaries are ready to check." checked={reportReadyAlerts} onChange={setReportReadyAlerts} />
          </div>
          <Button onClick={handleSaveNotifications} isLoading={isSavingNotifications} icon={<Save className="h-4 w-4" />}>
            Save Preferences
          </Button>
        </div>

        <div className="admin-panel">
          <h2 className="admin-section__title">
            <Settings2 className="h-5 w-5 text-teal-600" />
            Platform Preferences
          </h2>
          <div className="admin-toggle-group">
            <ToggleSwitch label="Dark Mode Preference" description="Save a visual preference for future admin theme support." checked={darkMode} onChange={setDarkMode} />
            <ToggleSwitch label="Auto Close Expired Jobs" description="Keep stale job postings cleaned up automatically." checked={autoCloseExpiredJobs} onChange={setAutoCloseExpiredJobs} />
            <ToggleSwitch label="Weekly Report Digest" description="Store a recurring reporting preference for the admin workspace." checked={weeklyReportDigest} onChange={setWeeklyReportDigest} />
          </div>
          <Button onClick={handleSavePreferences} isLoading={isSavingPreferences} icon={<Sparkles className="h-4 w-4" />}>
            Save Settings
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="admin-toggle">
      <div className="admin-toggle__copy">
        <p className="admin-toggle__label">{label}</p>
        <p className="admin-toggle__description">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`admin-toggle__button ${checked ? 'admin-toggle__button--active' : ''}`}
      >
        <span className={`admin-toggle__thumb ${checked ? 'admin-toggle__thumb--active' : ''}`} />
      </button>
    </div>
  );
}

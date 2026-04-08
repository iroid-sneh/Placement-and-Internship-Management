import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Bell,
  Calendar,
  Save,
  Shield,
  AlertTriangle,
  XCircle,
  FileX,
  ListX,
} from 'lucide-react';
import {
  getCompanySettings,
  updateCompanySettings,
  changeCompanyPassword,
  updateCompanyEmail,
  deleteCompanyAccount,
  removeAllJobPostings,
  clearApplicationHistory,
} from '../../services/api/company';

interface CompanySettingsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function CompanySettings({ onNavigate, onLogout }: CompanySettingsProps) {
  const { user, logout } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Update Email
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Notification Preferences
  const [applicationNotifications, setApplicationNotifications] = useState(true);
  const [statusUpdateNotifications, setStatusUpdateNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Interview Settings
  const [defaultReminder, setDefaultReminder] = useState<'1h' | '24h'>('24h');
  const [allowRescheduling, setAllowRescheduling] = useState(true);
  const [enableNotes, setEnableNotes] = useState(true);
  const [isSavingInterview, setIsSavingInterview] = useState(false);

  // Danger Zone Modals
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showRemoveJobsModal, setShowRemoveJobsModal] = useState(false);
  const [showClearApplicationsModal, setShowClearApplicationsModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingJobs, setIsRemovingJobs] = useState(false);
  const [isClearingApps, setIsClearingApps] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setCurrentEmail(user?.email || '');
        const settings = await getCompanySettings();
        if (settings.notifications) {
          setApplicationNotifications(settings.notifications.applicationNotifications);
          setStatusUpdateNotifications(settings.notifications.statusUpdateNotifications);
        }
        if (settings.interview) {
          setDefaultReminder(settings.interview.defaultReminder);
          setAllowRescheduling(settings.interview.allowRescheduling);
          setEnableNotes(settings.interview.enableNotes);
        }
      } catch {
        // Settings load failed silently
      } finally {
        setIsLoading(false);
      }
    };
    void loadSettings();
  }, [user?.email]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 4000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

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
      await changeCompanyPassword(currentPassword, newPassword, confirmNewPassword);
      showSuccess('Password changed successfully. Please login again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
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

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newEmail || !emailPassword) {
      showError('New email and password are required');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const result = await updateCompanyEmail(newEmail, emailPassword);
      setCurrentEmail(result.email);
      setNewEmail('');
      setEmailPassword('');
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
      await updateCompanySettings({
        notifications: { applicationNotifications, statusUpdateNotifications },
      });
      showSuccess('Notification preferences saved');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSaveInterviewSettings = async () => {
    setIsSavingInterview(true);
    try {
      await updateCompanySettings({
        interview: { defaultReminder, allowRescheduling, enableNotes },
      });
      showSuccess('Interview settings saved');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSavingInterview(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteCompanyAccount();
      logout();
      window.history.replaceState({}, '', '/');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete account');
      setShowDeleteAccountModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveAllJobs = async () => {
    setIsRemovingJobs(true);
    try {
      const result = await removeAllJobPostings();
      showSuccess(result.message);
      setShowRemoveJobsModal(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to remove job postings');
      setShowRemoveJobsModal(false);
    } finally {
      setIsRemovingJobs(false);
    }
  };

  const handleClearApplications = async () => {
    setIsClearingApps(true);
    try {
      const result = await clearApplicationHistory();
      showSuccess(result.message);
      setShowClearApplicationsModal(false);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to clear applications');
      setShowClearApplicationsModal(false);
    } finally {
      setIsClearingApps(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        userRole="company"
        currentPath="settings"
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={{ name: user?.name || 'Company', email: user?.email || '' }}
        breadcrumbs={[{ label: 'Settings' }]}
      >
        <div className="company-page">Loading settings...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole="company"
      currentPath="settings"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{ name: user?.name || 'Company', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <div className="company-page">
        <div>
          <h1 className="company-page__title">Settings</h1>
          <p className="company-page__subtitle">Manage your account and preferences.</p>
        </div>

        {successMessage && (
          <div className="company-alert company-alert--success">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="company-alert company-alert--error">
            {errorMessage}
          </div>
        )}

        <div className="company-card company-card--padded">
          <h2 className="company-card__title">
            <Shield className="h-5 w-5 text-teal-600" />
            Account Settings
          </h2>

          <form onSubmit={handleChangePassword} className="company-form">
            <h3 className="company-card__section-label">
              Change Password
            </h3>
            <div className="company-grid company-grid--forms">
              <Input
                label="Current Password"
                type="password"
                icon={<Lock className="h-4 w-4" />}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                label="New Password"
                type="password"
                icon={<Lock className="h-4 w-4" />}
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm New Password"
                type="password"
                icon={<Lock className="h-4 w-4" />}
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              isLoading={isChangingPassword}
              icon={<Lock className="h-4 w-4" />}
            >
              Change Password
            </Button>
          </form>

          <div className="company-card company-card--padded">
            <h3 className="company-card__section-label">
              Update Email
            </h3>
            <form onSubmit={handleUpdateEmail} className="company-form">
              <div className="company-grid company-grid--forms">
                <Input
                  label="Current Email"
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  value={currentEmail}
                  disabled
                />
                <Input
                  label="New Email"
                  type="email"
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Input
                  label="Password"
                  type="password"
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="Enter password to confirm"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                isLoading={isUpdatingEmail}
                icon={<Mail className="h-4 w-4" />}
              >
                Update Email
              </Button>
            </form>
          </div>
        </div>

        <div className="company-card company-card--padded">
          <h2 className="company-card__title">
            <Bell className="h-5 w-5 text-teal-600" />
            Notification Preferences
          </h2>
          <div className="company-form">
            <ToggleSwitch
              label="Application Notifications"
              description="Receive notifications when a student applies to a job"
              checked={applicationNotifications}
              onChange={setApplicationNotifications}
            />
            <ToggleSwitch
              label="Status Update Notifications"
              description="Receive notifications when an application status changes"
              checked={statusUpdateNotifications}
              onChange={setStatusUpdateNotifications}
            />
          </div>
          <Button
            onClick={handleSaveNotifications}
            isLoading={isSavingNotifications}
            icon={<Save className="h-4 w-4" />}
          >
            Save Preferences
          </Button>
        </div>

        <div className="company-card company-card--padded">
          <h2 className="company-card__title">
            <Calendar className="h-5 w-5 text-teal-600" />
            Interview Settings
          </h2>
          <div className="company-form">
            <div className="company-field">
              <label className="company-input__label">
                Default Interview Reminder
              </label>
              <select
                value={defaultReminder}
                onChange={(e) => setDefaultReminder(e.target.value as '1h' | '24h')}
                className="company-select"
              >
                <option value="1h">1 hour before interview</option>
                <option value="24h">24 hours before interview</option>
              </select>
            </div>
            <ToggleSwitch
              label="Allow Interview Rescheduling"
              description="Allow candidates to request interview rescheduling"
              checked={allowRescheduling}
              onChange={setAllowRescheduling}
            />
            <ToggleSwitch
              label="Enable Interview Notes"
              description="Enable notes and feedback during interviews"
              checked={enableNotes}
              onChange={setEnableNotes}
            />
          </div>
          <Button
            onClick={handleSaveInterviewSettings}
            isLoading={isSavingInterview}
            icon={<Save className="h-4 w-4" />}
          >
            Save Settings
          </Button>
        </div>

        <div className="company-danger-card">
          <h2 className="company-card__title company-card__title--danger">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h2>
          <p className="company-page__subtitle">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="company-form">
            <div className="company-danger-row">
              <div>
                <p className="company-card__title">Delete Company Account</p>
                <p className="company-page__subtitle">Permanently delete your account and all associated data.</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="h-4 w-4" />}
                onClick={() => setShowDeleteAccountModal(true)}
              >
                Delete Account
              </Button>
            </div>
            <div className="company-danger-row">
              <div>
                <p className="company-card__title">Remove All Job Postings</p>
                <p className="company-page__subtitle">Delete all job postings and their associated applications.</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={<FileX className="h-4 w-4" />}
                onClick={() => setShowRemoveJobsModal(true)}
              >
                Remove All Jobs
              </Button>
            </div>
            <div className="company-danger-row">
              <div>
                <p className="company-card__title">Clear Application History</p>
                <p className="company-page__subtitle">Remove all applications received for your job postings.</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={<ListX className="h-4 w-4" />}
                onClick={() => setShowClearApplicationsModal(true)}
              >
                Clear Applications
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        title="Delete Company Account"
        footer={
          <>
            <Button variant="danger" onClick={handleDeleteAccount} isLoading={isDeleting}>
              Delete Account
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteAccountModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="company-dialog-copy">
          <AlertTriangle className="company-dialog-copy__icon h-6 w-6" />
          <div>
            <p className="company-card__title">
              Are you sure you want to delete your company account?
            </p>
            <p className="company-page__subtitle">
              This action cannot be undone. All your data including company profile, job postings, applications, and notifications will be permanently removed.
            </p>
          </div>
        </div>
      </Modal>

      {/* Remove All Jobs Modal */}
      <Modal
        isOpen={showRemoveJobsModal}
        onClose={() => setShowRemoveJobsModal(false)}
        title="Remove All Job Postings"
        footer={
          <>
            <Button variant="danger" onClick={handleRemoveAllJobs} isLoading={isRemovingJobs}>
              Remove All Jobs
            </Button>
            <Button variant="ghost" onClick={() => setShowRemoveJobsModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="company-dialog-copy">
          <AlertTriangle className="company-dialog-copy__icon h-6 w-6" />
          <div>
            <p className="company-card__title">
              Are you sure you want to remove all job postings?
            </p>
            <p className="company-page__subtitle">
              This will permanently delete all your job postings and all associated student applications. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      {/* Clear Applications Modal */}
      <Modal
        isOpen={showClearApplicationsModal}
        onClose={() => setShowClearApplicationsModal(false)}
        title="Clear Application History"
        footer={
          <>
            <Button variant="danger" onClick={handleClearApplications} isLoading={isClearingApps}>
              Clear Applications
            </Button>
            <Button variant="ghost" onClick={() => setShowClearApplicationsModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="company-dialog-copy">
          <AlertTriangle className="company-dialog-copy__icon h-6 w-6" />
          <div>
            <p className="company-card__title">
              Are you sure you want to clear all application history?
            </p>
            <p className="company-page__subtitle">
              This will permanently remove all applications received for your job postings. The job postings themselves will remain. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
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
    <div className="company-toggle">
      <div>
        <p className="company-card__title">{label}</p>
        <p className="company-page__subtitle">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`company-toggle__button ${
          checked ? 'company-toggle__button--active' : ''
        }`}
      >
        <span
          className={`company-toggle__thumb ${
            checked ? 'company-toggle__thumb--active' : ''
          }`}
        />
      </button>
    </div>
  );
}

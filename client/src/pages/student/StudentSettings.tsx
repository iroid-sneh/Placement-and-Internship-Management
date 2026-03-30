import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  Trash2,
  Bell,
  Briefcase,
  Save,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import {
  getStudentProfile,
  changePassword,
  updateEmail,
  deleteAccount,
  saveNotificationPreferences,
  saveJobPreferences,
} from '../../services/api/student';

interface StudentSettingsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function StudentSettings({ onNavigate, onLogout }: StudentSettingsProps) {
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

  // Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Preferences
  const [jobAlerts, setJobAlerts] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);
  const [interviewNotifications, setInterviewNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Job Preferences
  const [preferredRole, setPreferredRole] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [isSavingJobPrefs, setIsSavingJobPrefs] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const profile = await getStudentProfile();
        setCurrentEmail(user?.email || '');
        if (profile.notificationPreferences) {
          setJobAlerts(profile.notificationPreferences.jobAlerts);
          setApplicationUpdates(profile.notificationPreferences.applicationUpdates);
          setInterviewNotifications(profile.notificationPreferences.interviewNotifications);
        }
        if (profile.jobPreferences) {
          setPreferredRole(profile.jobPreferences.preferredRole || '');
          setPreferredLocation(profile.jobPreferences.preferredLocation || '');
          setExpectedSalary(profile.jobPreferences.expectedSalary || '');
        }
      } catch {
        // Profile load failed silently
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
      await changePassword(currentPassword, newPassword, confirmNewPassword);
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
      const result = await updateEmail(newEmail, emailPassword);
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      logout();
      window.history.replaceState({}, '', '/');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete account');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await saveNotificationPreferences({ jobAlerts, applicationUpdates, interviewNotifications });
      showSuccess('Notification preferences saved');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleSaveJobPreferences = async () => {
    setIsSavingJobPrefs(true);
    try {
      await saveJobPreferences({ preferredRole, preferredLocation, expectedSalary });
      showSuccess('Job preferences saved');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setIsSavingJobPrefs(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout
        userRole="student"
        currentPath="settings"
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={{ name: user?.name || 'Student', email: user?.email || '' }}
        breadcrumbs={[{ label: 'Settings' }]}
      >
        <div className="p-8 text-slate-600">Loading settings...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole="student"
      currentPath="settings"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{ name: user?.name || 'Student', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">Manage your account and preferences.</p>
        </div>

        {successMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Account Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-600" />
            Account Settings
          </h2>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Change Password
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                placeholder="Min 8 chars, A-Z, a-z, 0-9"
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
              className="mt-4"
              isLoading={isChangingPassword}
              icon={<Lock className="h-4 w-4" />}
            >
              Change Password
            </Button>
          </form>

          <div className="border-t border-slate-200 pt-6 mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Update Email
            </h3>
            <form onSubmit={handleUpdateEmail}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                className="mt-4"
                isLoading={isUpdatingEmail}
                icon={<Mail className="h-4 w-4" />}
              >
                Update Email
              </Button>
            </form>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Delete Account
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-600" />
            Notification Preferences
          </h2>
          <div className="space-y-4">
            <ToggleSwitch
              label="Job Alerts"
              description="Receive notifications when new jobs match your preferences"
              checked={jobAlerts}
              onChange={setJobAlerts}
            />
            <ToggleSwitch
              label="Application Updates"
              description="Receive notifications when your application status changes"
              checked={applicationUpdates}
              onChange={setApplicationUpdates}
            />
            <ToggleSwitch
              label="Interview Notifications"
              description="Receive notifications when interviews are scheduled or updated"
              checked={interviewNotifications}
              onChange={setInterviewNotifications}
            />
          </div>
          <Button
            className="mt-6"
            onClick={handleSaveNotifications}
            isLoading={isSavingNotifications}
            icon={<Save className="h-4 w-4" />}
          >
            Save Preferences
          </Button>
        </div>

        {/* Job Preferences */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-teal-600" />
            Job Preferences
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Preferred Role
              </label>
              <input
                type="text"
                className="block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                placeholder="e.g. Frontend Developer"
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Preferred Location
              </label>
              <input
                type="text"
                className="block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                placeholder="e.g. Remote, Bangalore"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Expected Salary
              </label>
              <select
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                className="block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              >
                <option value="">Select range</option>
                <option value="0-10k">0 - 10k</option>
                <option value="10k-20k">10k - 20k</option>
                <option value="20k-50k">20k - 50k</option>
                <option value="50k+">50k+</option>
              </select>
            </div>
          </div>
          <Button
            className="mt-6"
            onClick={handleSaveJobPreferences}
            isLoading={isSavingJobPrefs}
            icon={<Save className="h-4 w-4" />}
          >
            Save Preferences
          </Button>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        footer={
          <>
            <Button variant="danger" onClick={handleDeleteAccount} isLoading={isDeleting}>
              Delete Account
            </Button>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-700 font-medium">
              Are you sure you want to delete your account?
            </p>
            <p className="mt-2 text-sm text-slate-500">
              This action cannot be undone. All your data including profile, applications, and resume will be permanently removed.
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
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
          checked ? 'bg-teal-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

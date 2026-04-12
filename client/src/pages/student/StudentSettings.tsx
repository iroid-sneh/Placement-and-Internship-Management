import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Trash2, Bell, Briefcase, Save, Shield, AlertTriangle } from 'lucide-react';
import { getStudentProfile, changePassword, updateEmail, deleteAccount, saveNotificationPreferences, saveJobPreferences } from '../../services/api/student';

interface StudentSettingsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function StudentSettings({ onNavigate, onLogout }: StudentSettingsProps) {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);
  const [interviewNotifications, setInterviewNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
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
    if (!currentPassword || !newPassword || !confirmNewPassword) return showError('All password fields are required');
    if (newPassword.length < 8) return showError('New password must be at least 8 characters');
    if (newPassword !== confirmNewPassword) return showError('New passwords do not match');
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
    if (!newEmail || !emailPassword) return showError('New email and password are required');
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
      <DashboardLayout userRole="student" currentPath="settings" onNavigate={onNavigate} onLogout={onLogout} user={{ name: user?.name || 'Student', email: user?.email || '' }} breadcrumbs={[{ label: 'Settings' }]}>
        <div className="student-page student-page--narrow">Loading settings...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="student" currentPath="settings" onNavigate={onNavigate} onLogout={onLogout} user={{ name: user?.name || 'Student', email: user?.email || '' }} breadcrumbs={[{ label: 'Settings' }]}>
      <div className="student-page student-page--narrow">
        <div className="student-card student-card--padded">
          <h1 className="student-page__title">Settings</h1>
          <p className="student-page__subtitle">Manage your account, alerts, and job preferences in one place.</p>
        </div>

        {successMessage && <div className="student-alert student-alert--success">{successMessage}</div>}
        {errorMessage && <div className="student-alert student-alert--error">{errorMessage}</div>}

        <div className="student-card student-card--padded">
          <h2 className="student-card__title"><Shield className="h-5 w-5 text-teal-600" />Account Settings</h2>
          <form onSubmit={handleChangePassword} className="student-form">
            <h3 className="student-card__section-label">Change Password</h3>
            <div className="student-grid student-grid--settings">
              <Input label="Current Password" type="password" icon={<Lock className="h-4 w-4" />} placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <Input label="New Password" type="password" icon={<Lock className="h-4 w-4" />} placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Input label="Confirm New Password" type="password" icon={<Lock className="h-4 w-4" />} placeholder="Re-enter new password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
            </div>
            <Button type="submit" isLoading={isChangingPassword} icon={<Lock className="h-4 w-4" />}>Change Password</Button>
          </form>

          <div className="student-form-section">
            <h3 className="student-card__section-label">Update Email</h3>
            <form onSubmit={handleUpdateEmail} className="student-form">
              <div className="student-grid student-grid--settings">
                <Input label="Current Email" type="email" icon={<Mail className="h-4 w-4" />} placeholder="Current account email" value={currentEmail} disabled />
                <Input label="New Email" type="email" icon={<Mail className="h-4 w-4" />} placeholder="Enter new email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Input label="Password" type="password" icon={<Lock className="h-4 w-4" />} placeholder="Enter password to confirm" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} />
              </div>
              <Button type="submit" isLoading={isUpdatingEmail} icon={<Mail className="h-4 w-4" />}>Update Email</Button>
            </form>
          </div>

          <div className="student-form-section">
            <h3 className="student-card__section-label">Delete Account</h3>
            <p className="student-page__subtitle">Permanently delete your account and all associated data. This action cannot be undone.</p>
            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setShowDeleteModal(true)}>Delete Account</Button>
          </div>
        </div>

        <div className="student-card student-card--padded">
          <h2 className="student-card__title"><Bell className="h-5 w-5 text-teal-600" />Notification Preferences</h2>
          <div className="student-form">
            <ToggleSwitch label="Job Alerts" description="Receive notifications when new jobs match your preferences" checked={jobAlerts} onChange={setJobAlerts} />
            <ToggleSwitch label="Application Updates" description="Receive notifications when your application status changes" checked={applicationUpdates} onChange={setApplicationUpdates} />
            <ToggleSwitch label="Interview Notifications" description="Receive notifications when interviews are scheduled or updated" checked={interviewNotifications} onChange={setInterviewNotifications} />
          </div>
          <Button className="mt-6" onClick={handleSaveNotifications} isLoading={isSavingNotifications} icon={<Save className="h-4 w-4" />}>Save Preferences</Button>
        </div>

        <div className="student-card student-card--padded">
          <h2 className="student-card__title"><Briefcase className="h-5 w-5 text-teal-600" />Job Preferences</h2>
          <div className="student-grid student-grid--settings">
            <div>
              <label className="student-input__label">Preferred Role</label>
              <input className="student-input" value={preferredRole} onChange={(e) => setPreferredRole(e.target.value)} placeholder="e.g. Frontend Developer" />
            </div>
            <div>
              <label className="student-input__label">Preferred Location</label>
              <input className="student-input" value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} placeholder="e.g. Remote, Bangalore" />
            </div>
            <div>
              <label className="student-input__label">Expected Salary</label>
              <select className="student-select" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)}>
                <option value="">Select range</option>
                <option value="0-10k">0 - 10k</option>
                <option value="10k-20k">10k - 20k</option>
                <option value="20k-50k">20k - 50k</option>
                <option value="50k+">50k+</option>
              </select>
            </div>
          </div>
          <Button className="mt-6" onClick={handleSaveJobPreferences} isLoading={isSavingJobPrefs} icon={<Save className="h-4 w-4" />}>Save Preferences</Button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        footer={
          <>
            <Button variant="danger" onClick={handleDeleteAccount} isLoading={isDeleting}>Delete Account</Button>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          </>
        }
      >
        <div className="student-page__actions student-page__actions--align-start">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <p className="student-card__title">Are you sure you want to delete your account?</p>
            <p className="student-page__subtitle">This action cannot be undone. All your data including profile, applications, and resume will be permanently removed.</p>
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
    <div className="student-toggle">
      <div>
        <p className="student-card__title">{label}</p>
        <p className="student-page__subtitle">{description}</p>
      </div>
      <button type="button" onClick={() => onChange(!checked)} className={`student-toggle__button ${checked ? 'student-toggle__button--active' : ''}`}>
        <span className={`student-toggle__thumb ${checked ? 'student-toggle__thumb--active' : ''}`} />
      </button>
    </div>
  );
}

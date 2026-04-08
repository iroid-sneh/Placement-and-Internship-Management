import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { User, Mail, Phone, BookOpen, Award, Save, X } from 'lucide-react';
import { getStudentProfile, updateStudentProfile } from '../../services/api/student';
import { useAuth } from '../../context/AuthContext';
import type { StudentProfile as StudentProfileType } from '../../types/app';

interface StudentProfileProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function StudentProfile({ onNavigate, onLogout }: StudentProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [formData, setFormData] = useState({
    enrollmentNumber: '',
    department: '',
    year: 6,
    phone: '',
    cgpa: 0
  });

  const parseSkills = (skillsValue: unknown): string[] => {
    if (Array.isArray(skillsValue)) {
      return skillsValue.map((value) => String(value).trim()).filter(Boolean);
    }
    if (typeof skillsValue === 'string') {
      return skillsValue.split(',').map((value) => value.trim()).filter(Boolean);
    }
    return [];
  };

  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const data = await getStudentProfile();
        const resolvedSkills = parseSkills((data as unknown as { skills?: unknown }).skills);
        setProfile(data);
        setSkills(resolvedSkills);
        setFormData({
          enrollmentNumber: data.enrollmentNumber || '',
          department: data.department || '',
          year: data.year || 6,
          phone: data.phone || '',
          cgpa: data.cgpa || 0
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const executeSave = async (): Promise<void> => {
    try {
      setIsSaving(true);
      setErrorMessage('');
      const updated = await updateStudentProfile({
        ...formData,
        skills
      });
      setProfile(updated);
      setIsEditing(false);
      setNewSkill('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (newSkill.trim()) {
      setShowUnsavedModal(true);
      return;
    }
    await executeSave();
  };

  const handleAddAndSave = async (): Promise<void> => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills((prev) => [...prev, newSkill.trim()]);
    }
    setShowUnsavedModal(false);
    await executeSave();
  };

  const handleSaveWithoutAdding = async (): Promise<void> => {
    setShowUnsavedModal(false);
    await executeSave();
  };

  if (isLoading) {
    return <div className="student-page student-page--narrow">Loading profile...</div>;
  }

  const profileCompletionPercentage = profile?.resumeUrl ? 100 : 80;
  const isProfileComplete = profileCompletionPercentage === 100;

  return (
    <DashboardLayout
      userRole="student"
      currentPath="profile"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{ name: user?.name || 'Student', email: user?.email || '' }}
      breadcrumbs={[{ label: 'My Profile' }]}
    >
      <div className="student-page student-page--narrow">
        <div className="student-page__header">
          <div>
            <h1 className="student-page__title">My Profile</h1>
            <p className="student-page__subtitle">Manage your personal and academic information.</p>
          </div>
          <Button variant={isEditing ? 'secondary' : 'primary'} onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
        </div>

        {!isProfileComplete && (
          <div className="student-card student-card--padded">
            <div className="student-card__title-row">
              <h3 className="student-card__title">Profile Completion</h3>
              <span className="student-badge student-badge--progress">{profileCompletionPercentage}%</span>
            </div>
            <div className="student-progress">
              <div className="student-progress__bar" style={{ width: `${profileCompletionPercentage}%` }} />
            </div>
            <p className="student-page__subtitle">Upload resume to complete profile.</p>
          </div>
        )}

        <form className="student-form" onSubmit={handleSaveProfile}>
          {errorMessage && <div className="student-alert student-alert--error">{errorMessage}</div>}

          <div className="student-card student-card--padded">
            <h3 className="student-card__title">
              <User className="h-5 w-5 text-teal-600" />
              Personal Details
            </h3>
            <div className="student-grid student-grid--profile">
              <Input label="Full Name" value={user?.name || ''} disabled icon={<User className="h-4 w-4" />} />
              <Input label="Enrollment Number" value={formData.enrollmentNumber} onChange={(event) => setFormData((prev) => ({ ...prev, enrollmentNumber: event.target.value }))} disabled={!isEditing} icon={<BookOpen className="h-4 w-4" />} />
              <Input label="Email Address" value={user?.email || ''} disabled icon={<Mail className="h-4 w-4" />} />
              <Input label="Phone Number" value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} disabled={!isEditing} icon={<Phone className="h-4 w-4" />} />
            </div>
          </div>

          <div className="student-card student-card--padded">
            <h3 className="student-card__title">
              <Award className="h-5 w-5 text-teal-600" />
              Academic Information
            </h3>
            <div className="student-grid student-grid--profile">
              <Input label="Department" value={formData.department} onChange={(event) => setFormData((prev) => ({ ...prev, department: event.target.value }))} disabled={!isEditing} />
              <Input label="Current Year/Semester" value={String(formData.year)} onChange={(event) => setFormData((prev) => ({ ...prev, year: Number(event.target.value) || 1 }))} disabled={!isEditing} />
              <Input label="CGPA (Aggregate)" value={String(formData.cgpa)} onChange={(event) => setFormData((prev) => ({ ...prev, cgpa: Number(event.target.value) || 0 }))} disabled={!isEditing} />
            </div>

            <div>
              <label className="student-input__label">Skills</label>
              <div className="student-skills">
                {skills.length === 0 && <p className="student-page__subtitle">No skills added yet.</p>}
                {skills.map((skill) => (
                  <span key={skill} className="student-skill">
                    {skill}
                    {isEditing && (
                      <button type="button" onClick={() => removeSkill(skill)} className="student-inline-button">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <Input placeholder="Type a skill and press Enter..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={handleAddSkill} />
              )}
            </div>
          </div>

          {isEditing && (
            <div className="student-page__actions student-page__actions--end">
              <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setNewSkill(''); }}>
                Cancel
              </Button>
              <Button type="submit" icon={<Save className="h-4 w-4" />} isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          )}
        </form>

        <Modal
          isOpen={showUnsavedModal}
          onClose={() => setShowUnsavedModal(false)}
          title="Unsaved Input Detected"
          footer={
            <>
              <Button variant="primary" onClick={handleAddAndSave}>Add &amp; Save</Button>
              <Button variant="outline" onClick={handleSaveWithoutAdding}>Save Without Adding</Button>
              <Button variant="ghost" onClick={() => setShowUnsavedModal(false)}>Cancel</Button>
            </>
          }
        >
          <p className="student-page__subtitle">You have unsaved input <strong>"{newSkill}"</strong> that hasn't been added as a skill.</p>
          <p className="student-page__subtitle">Would you like to add it before saving?</p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

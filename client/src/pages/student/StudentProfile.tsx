import React, { useEffect, useState } from 'react';
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
  const [pendingFormEvent, setPendingFormEvent] = useState<React.FormEvent | null>(null);
  const [formData, setFormData] = useState({
    enrollmentNumber: '',
    department: '',
    year: 6,
    phone: '',
    cgpa: 0
  });
  const parseSkills = (skillsValue: unknown): string[] => {
    if (Array.isArray(skillsValue)) {
      return skillsValue
        .map((value) => String(value).trim())
        .filter((value) => value.length > 0);
    }
    if (typeof skillsValue === 'string') {
      return skillsValue
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
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
      setPendingFormEvent(e);
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
    setPendingFormEvent(null);
    await executeSave();
  };

  const handleSaveWithoutAdding = async (): Promise<void> => {
    setShowUnsavedModal(false);
    setPendingFormEvent(null);
    await executeSave();
  };

  const handleCancelModal = (): void => {
    setShowUnsavedModal(false);
    setPendingFormEvent(null);
  };

  if (isLoading) {
    return <div className="p-8">Loading profile...</div>;
  }

  const profileCompletionPercentage = profile?.resumeUrl ? 100 : 80;
  const isProfileComplete = profileCompletionPercentage === 100;

  return (
    <DashboardLayout
      userRole="student"
      currentPath="profile"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Student',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'My Profile'
      }]
      }>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600">
              Manage your personal and academic information.
            </p>
          </div>
          <Button
            variant={isEditing ? 'secondary' : 'primary'}
            onClick={() => setIsEditing(!isEditing)}>

            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
        </div>

        {/* Profile Completion Card - hidden when 100% */}
        {!isProfileComplete && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">Profile Completion</h3>
              <span className="text-teal-600 font-bold">{profileCompletionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-teal-600 h-2.5 rounded-full"
                style={{
                  width: `${profileCompletionPercentage}%`
                }}>
              </div>
            </div>
              <p className="text-sm text-slate-500 mt-2">
                Upload resume to complete profile.
              </p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSaveProfile}>
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          {/* Personal Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={user?.name || ''}
                disabled={true}
                icon={<User className="h-4 w-4" />} />

              <Input
                label="Enrollment Number"
                value={formData.enrollmentNumber}
                onChange={(event) => setFormData((prev) => ({ ...prev, enrollmentNumber: event.target.value }))}
                disabled={!isEditing}
                icon={<BookOpen className="h-4 w-4" />} />

              <Input
                label="Email Address"
                value={user?.email || ''}
                disabled={true}
                icon={<Mail className="h-4 w-4" />} />

              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                disabled={!isEditing}
                icon={<Phone className="h-4 w-4" />} />

            </div>
          </div>

          {/* Academic Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-teal-600" />
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Input
                label="Department"
                value={formData.department}
                onChange={(event) => setFormData((prev) => ({ ...prev, department: event.target.value }))}
                disabled={!isEditing} />

              <Input
                label="Current Year/Semester"
                value={String(formData.year)}
                onChange={(event) => setFormData((prev) => ({ ...prev, year: Number(event.target.value) || 1 }))}
                disabled={!isEditing} />

              <Input
                label="CGPA (Aggregate)"
                value={String(formData.cgpa)}
                onChange={(event) => setFormData((prev) => ({ ...prev, cgpa: Number(event.target.value) || 0 }))}
                disabled={!isEditing} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No skills added yet.
                  </p>
                )}
                {skills.map((skill) =>
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-50 text-teal-700 border border-teal-100">

                    {skill}
                    {isEditing &&
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-teal-500 hover:text-teal-700">

                        <X className="h-3 w-3" />
                      </button>
                    }
                  </span>
                )}
              </div>
              {isEditing &&
                <Input
                  placeholder="Type a skill and press Enter..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleAddSkill} />
              }
            </div>
          </div>

          {isEditing &&
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setNewSkill('');
                }}>

                Cancel
              </Button>
              <Button type="submit" icon={<Save className="h-4 w-4" />} isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          }
        </form>

        {/* Unsaved Skill Confirmation Modal */}
        <Modal
          isOpen={showUnsavedModal}
          onClose={handleCancelModal}
          title="Unsaved Input Detected"
          footer={
            <>
              <Button variant="primary" onClick={handleAddAndSave}>
                Add &amp; Save
              </Button>
              <Button variant="outline" onClick={handleSaveWithoutAdding}>
                Save Without Adding
              </Button>
              <Button variant="ghost" onClick={handleCancelModal}>
                Cancel
              </Button>
            </>
          }
        >
          <p className="text-slate-600">
            You have unsaved input <span className="font-medium text-slate-900">"{newSkill}"</span> that hasn't been added as a skill.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Would you like to add it before saving?
          </p>
        </Modal>
      </div>
    </DashboardLayout>);

}

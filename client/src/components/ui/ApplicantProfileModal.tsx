import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Loader2, ExternalLink } from 'lucide-react';
import type { StudentProfileDetail } from '../../types/app';

const SERVER_BASE_URL = "http://localhost:5001";

interface ApplicantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadProfile: () => Promise<StudentProfileDetail>;
}

export function ApplicantProfileModal({
  isOpen,
  onClose,
  loadProfile
}: ApplicantProfileModalProps) {
  const [profileData, setProfileData] = useState<StudentProfileDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setProfileData(null);
      setErrorMessage('');
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await loadProfile();
        if (!cancelled) setProfileData(data);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load profile');
          setProfileData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetch();
    return () => { cancelled = true; };
  }, [isOpen, loadProfile]);

  const handleClose = () => {
    setProfileData(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Applicant Profile"
      size="xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : errorMessage ? (
        <div className="space-y-3 py-4">
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        </div>
      ) : profileData ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xl">
              {profileData.user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{profileData.user.name}</h3>
              <p className="text-sm text-slate-500">{profileData.user.email}</p>
            </div>
          </div>

          {profileData.profile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Department</label>
                  <p className="text-sm text-slate-900 font-medium">{profileData.profile.department || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Year</label>
                  <p className="text-sm text-slate-900 font-medium">{profileData.profile.year || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">CGPA</label>
                  <p className="text-sm text-slate-900 font-medium">{profileData.profile.cgpa || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Phone</label>
                  <p className="text-sm text-slate-900 font-medium">{profileData.profile.phone || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">Enrollment No.</label>
                  <p className="text-sm text-slate-900 font-medium">{profileData.profile.enrollmentNumber || '-'}</p>
                </div>
              </div>

              {profileData.profile.skills && profileData.profile.skills.length > 0 && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 border border-teal-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                {profileData.profile.resumeUrl && (
                  <a
                    href={profileData.profile.resumeUrl.startsWith('http')
                      ? profileData.profile.resumeUrl
                      : `${SERVER_BASE_URL}${profileData.profile.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Resume
                  </a>
                )}
                {profileData.profile.linkedinUrl && (
                  <a
                    href={profileData.profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> LinkedIn
                  </a>
                )}
                {profileData.profile.githubUrl && (
                  <a
                    href={profileData.profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> GitHub
                  </a>
                )}
                {profileData.profile.portfolioUrl && (
                  <a
                    href={profileData.profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" /> Portfolio
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No profile information available.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-4">No profile data available.</p>
      )}
    </Modal>
  );
}

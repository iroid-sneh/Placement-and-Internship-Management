import { useEffect, useState } from 'react';
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
        <div className="shared-profile-modal__loading">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : errorMessage ? (
        <div className="shared-profile-modal__error-wrap">
          <div className="shared-profile-modal__error">
            {errorMessage}
          </div>
        </div>
      ) : profileData ? (
        <div className="shared-profile-modal">
          <div className="shared-profile-modal__header">
            <div className="shared-profile-modal__avatar">
              {profileData.user.name.charAt(0)}
            </div>
            <div>
              <h3 className="shared-profile-modal__name">{profileData.user.name}</h3>
              <p className="shared-profile-modal__email">{profileData.user.email}</p>
            </div>
          </div>

          {profileData.profile ? (
            <div className="shared-profile-modal__content">
              <div className="shared-profile-modal__grid shared-profile-modal__grid--wide">
                <div>
                  <label className="shared-profile-modal__field-label">Department</label>
                  <p className="shared-profile-modal__field-value">{profileData.profile.department || '-'}</p>
                </div>
                <div>
                  <label className="shared-profile-modal__field-label">Year</label>
                  <p className="shared-profile-modal__field-value">{profileData.profile.year || '-'}</p>
                </div>
                <div>
                  <label className="shared-profile-modal__field-label">CGPA</label>
                  <p className="shared-profile-modal__field-value">{profileData.profile.cgpa || '-'}</p>
                </div>
                <div>
                  <label className="shared-profile-modal__field-label">Phone</label>
                  <p className="shared-profile-modal__field-value">{profileData.profile.phone || '-'}</p>
                </div>
                <div>
                  <label className="shared-profile-modal__field-label">Enrollment No.</label>
                  <p className="shared-profile-modal__field-value">{profileData.profile.enrollmentNumber || '-'}</p>
                </div>
              </div>

              {profileData.profile.skills && profileData.profile.skills.length > 0 && (
                <div>
                  <label className="shared-profile-modal__section-label">Skills</label>
                  <div className="shared-profile-modal__skills">
                    {profileData.profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="shared-profile-modal__skill"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="shared-profile-modal__links">
                {profileData.profile.resumeUrl && (
                  <a
                    href={profileData.profile.resumeUrl.startsWith('http')
                      ? profileData.profile.resumeUrl
                      : `${SERVER_BASE_URL}${profileData.profile.resumeUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shared-profile-modal__link shared-profile-modal__link--primary"
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
                    className="shared-profile-modal__link shared-profile-modal__link--blue"
                  >
                    <ExternalLink className="h-4 w-4" /> LinkedIn
                  </a>
                )}
                {profileData.profile.githubUrl && (
                  <a
                    href={profileData.profile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shared-profile-modal__link"
                  >
                    <ExternalLink className="h-4 w-4" /> GitHub
                  </a>
                )}
                {profileData.profile.portfolioUrl && (
                  <a
                    href={profileData.profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shared-profile-modal__link"
                  >
                    <ExternalLink className="h-4 w-4" /> Portfolio
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="shared-profile-modal__empty">No profile information available.</p>
          )}
        </div>
      ) : (
        <p className="shared-profile-modal__empty shared-profile-modal__empty--center">No profile data available.</p>
      )}
    </Modal>
  );
}

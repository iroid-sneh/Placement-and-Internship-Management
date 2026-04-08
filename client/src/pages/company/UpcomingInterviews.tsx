import { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ApplicantProfileModal } from '../../components/ui/ApplicantProfileModal';
import { ScheduleInterviewModal } from '../../components/ui/ScheduleInterviewModal';
import type { ScheduleInterviewData } from '../../components/ui/ScheduleInterviewModal';
import { useAuth } from '../../context/AuthContext';
import { getUpcomingInterviews, updateCompanyApplicantStatus, getStudentProfileById } from '../../services/api/company';
import type { Application, StudentProfileDetail } from '../../types/app';
import { Calendar, Clock, Edit, XCircle, User } from 'lucide-react';

interface UpcomingInterviewsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function getStudentId(studentId: string | { id?: string; _id?: string } | undefined | null): string {
  if (!studentId) return '';
  if (typeof studentId === 'string') return studentId;
  return studentId.id || studentId._id || '';
}

export function UpcomingInterviews({ onNavigate, onLogout }: UpcomingInterviewsProps) {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleTargetId, setRescheduleTargetId] = useState('');
  const [rescheduleApplicantName, setRescheduleApplicantName] = useState('');
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Application | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileLoader, setProfileLoader] = useState<(() => Promise<StudentProfileDetail>) | null>(null);

  const loadInterviews = async () => {
    try {
      const data = await getUpcomingInterviews();
      setInterviews(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load interviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInterviews();
  }, []);

  const groupedInterviews = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayList: Application[] = [];
    const upcomingList: Application[] = [];
    interviews.forEach((interview) => {
      if (!interview.interviewDate) return;
      const d = new Date(interview.interviewDate);
      if (d >= today && d < tomorrow) todayList.push(interview);
      else upcomingList.push(interview);
    });
    return { today: todayList, upcoming: upcomingList };
  }, [interviews]);

  const getStudentName = (interview: Application) =>
    typeof interview.studentId === 'string' ? '-' : interview.studentId.name;

  const getJobTitle = (interview: Application) =>
    typeof interview.jobId === 'string' ? '-' : interview.jobId.title;

  const openReschedule = (interview: Application) => {
    setRescheduleTargetId(interview._id);
    setRescheduleApplicantName(getStudentName(interview));
    setIsRescheduleOpen(true);
  };

  const handleReschedule = async (data: ScheduleInterviewData) => {
    const dateTime = data.time
      ? new Date(`${data.date}T${data.time}`).toISOString()
      : new Date(data.date).toISOString();
    await updateCompanyApplicantStatus(rescheduleTargetId, 'Interview Scheduled', dateTime);
    setIsRescheduleOpen(false);
    await loadInterviews();
  };

  const openCancel = (interview: Application) => {
    setCancelTarget(interview);
    setIsCancelOpen(true);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await updateCompanyApplicantStatus(cancelTarget._id, 'Shortlisted');
      setIsCancelOpen(false);
      await loadInterviews();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel interview');
    } finally {
      setIsCancelling(false);
    }
  };

  const openProfile = useCallback((interview: Application) => {
    const studentId = getStudentId(interview.studentId);
    if (!studentId) {
      setErrorMessage('Unable to identify the student for this application');
      return;
    }
    setProfileLoader(() => () => getStudentProfileById(studentId));
    setIsProfileOpen(true);
  }, []);

  const formatInterviewDate = (date: string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatInterviewTime = (date: string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderInterviewCard = (interview: Application) => (
    <div key={interview._id} className="company-interview-card">
      <div className="company-interview-card__top">
        <div className="company-interview-card__person">
          <div className="company-interview-card__avatar">
            {getStudentName(interview).charAt(0)}
          </div>
          <div>
            <h4 className="company-interview-card__name">{getStudentName(interview)}</h4>
            <p className="company-interview-card__role">{getJobTitle(interview)}</p>
          </div>
        </div>
        <div className="company-interview-card__actions">
          <button onClick={() => openProfile(interview)} className="company-icon-button" title="View Profile">
            <User className="h-4 w-4" />
          </button>
          <button onClick={() => openReschedule(interview)} className="company-icon-button company-icon-button--info" title="Reschedule">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={() => openCancel(interview)} className="company-icon-button company-icon-button--danger" title="Cancel Interview">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="company-interview-card__meta">
        <span className="company-inline-meta">
          <Calendar className="h-4 w-4 text-slate-400" />
          {formatInterviewDate(interview.interviewDate)}
        </span>
        <span className="company-inline-meta">
          <Clock className="h-4 w-4 text-slate-400" />
          {formatInterviewTime(interview.interviewDate)}
        </span>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      userRole="company"
      currentPath="interviews"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{ name: user?.name || 'Company', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Upcoming Interviews' }]}
    >
      <div className="company-page">
        <div>
          <h1 className="company-page__title">Upcoming Interviews</h1>
          <p className="company-page__subtitle">Manage your scheduled interviews.</p>
        </div>

        {errorMessage && <div className="company-alert company-alert--error">{errorMessage}</div>}

        {isLoading ? (
          <div className="company-card company-card--padded">Loading interviews...</div>
        ) : interviews.length === 0 ? (
          <div className="company-empty-state">
            <Calendar className="company-empty-state__icon h-12 w-12" />
            <p className="company-page__title">No upcoming interviews</p>
            <p className="company-page__subtitle">Schedule interviews from the dashboard to see them here.</p>
          </div>
        ) : (
          <div className="company-page">
            {groupedInterviews.today.length > 0 && (
              <div>
                <h2 className="company-section-title">
                  <span className="company-section-dot company-section-dot--today" />
                  Today ({groupedInterviews.today.length})
                </h2>
                <div className="company-grid company-grid--interviews">
                  {groupedInterviews.today.map((i) => renderInterviewCard(i))}
                </div>
              </div>
            )}

            {groupedInterviews.upcoming.length > 0 && (
              <div>
                <h2 className="company-section-title">
                  <span className="company-section-dot company-section-dot--upcoming" />
                  Upcoming ({groupedInterviews.upcoming.length})
                </h2>
                <div className="company-grid company-grid--interviews">
                  {groupedInterviews.upcoming.map((i) => renderInterviewCard(i))}
                </div>
              </div>
            )}
          </div>
        )}

        <ScheduleInterviewModal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          onSchedule={handleReschedule}
          applicantName={rescheduleApplicantName}
        />

        <Modal
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          title="Cancel Interview"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsCancelOpen(false)}>Keep Interview</Button>
              <Button variant="danger" onClick={handleCancel} isLoading={isCancelling}>Cancel Interview</Button>
            </>
          }
        >
          <div className="company-page">
            <p className="company-page__subtitle">
              Are you sure you want to cancel the interview with <strong>{cancelTarget ? getStudentName(cancelTarget) : ''}</strong> for the position of <strong>{cancelTarget ? getJobTitle(cancelTarget) : ''}</strong>?
            </p>
            <p className="company-page__subtitle">The applicant will be moved back to the Shortlisted stage.</p>
          </div>
        </Modal>

        {profileLoader && (
          <ApplicantProfileModal
            isOpen={isProfileOpen}
            onClose={() => { setIsProfileOpen(false); setProfileLoader(null); }}
            loadProfile={profileLoader}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

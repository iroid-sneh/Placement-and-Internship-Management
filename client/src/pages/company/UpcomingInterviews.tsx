import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ApplicantProfileModal } from '../../components/ui/ApplicantProfileModal';
import { ScheduleInterviewModal } from '../../components/ui/ScheduleInterviewModal';
import type { ScheduleInterviewData } from '../../components/ui/ScheduleInterviewModal';
import { useAuth } from '../../context/AuthContext';
import {
  getUpcomingInterviews,
  updateCompanyApplicantStatus,
  getStudentProfileById
} from '../../services/api/company';
import type { Application, StudentProfileDetail } from '../../types/app';
import {
  Calendar,
  Clock,
  Edit,
  XCircle,
  User
} from 'lucide-react';

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

  // Reschedule modal
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleTargetId, setRescheduleTargetId] = useState('');
  const [rescheduleApplicantName, setRescheduleApplicantName] = useState('');

  // Cancel confirmation
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Application | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Profile modal
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
      if (d >= today && d < tomorrow) {
        todayList.push(interview);
      } else {
        upcomingList.push(interview);
      }
    });

    return { today: todayList, upcoming: upcomingList };
  }, [interviews]);

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

  const getStudentName = (interview: Application) => {
    return typeof interview.studentId === 'string' ? '-' : interview.studentId.name;
  };

  const getJobTitle = (interview: Application) => {
    return typeof interview.jobId === 'string' ? '-' : interview.jobId.title;
  };

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
    <div
      key={interview._id}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
            {getStudentName(interview).charAt(0)}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{getStudentName(interview)}</h4>
            <p className="text-sm text-slate-500">{getJobTitle(interview)}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => openProfile(interview)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="View Profile"
          >
            <User className="h-4 w-4" />
          </button>
          <button
            onClick={() => openReschedule(interview)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
            title="Reschedule"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => openCancel(interview)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Cancel Interview"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-400" />
          {formatInterviewDate(interview.interviewDate)}
        </span>
        <span className="flex items-center gap-1.5">
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
      user={{
        name: user?.name || 'Company',
        email: user?.email || ''
      }}
      breadcrumbs={[{ label: 'Upcoming Interviews' }]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upcoming Interviews</h1>
          <p className="text-slate-600">Manage your scheduled interviews.</p>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Loading interviews...
          </div>
        ) : interviews.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-medium text-slate-700">No upcoming interviews</p>
            <p className="mt-1 text-sm text-slate-500">
              Schedule interviews from the dashboard to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Today */}
            {groupedInterviews.today.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  Today ({groupedInterviews.today.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedInterviews.today.map((i) => renderInterviewCard(i))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {groupedInterviews.upcoming.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Upcoming ({groupedInterviews.upcoming.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedInterviews.upcoming.map((i) => renderInterviewCard(i))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reschedule Modal - Reusable */}
        <ScheduleInterviewModal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          onSchedule={handleReschedule}
          applicantName={rescheduleApplicantName}
        />

        {/* Cancel Confirmation Modal */}
        <Modal
          isOpen={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          title="Cancel Interview"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsCancelOpen(false)}>
                Keep Interview
              </Button>
              <Button variant="danger" onClick={handleCancel} isLoading={isCancelling}>
                Cancel Interview
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Are you sure you want to cancel the interview with{' '}
              <strong>{cancelTarget ? getStudentName(cancelTarget) : ''}</strong> for the position of{' '}
              <strong>{cancelTarget ? getJobTitle(cancelTarget) : ''}</strong>?
            </p>
            <p className="text-sm text-slate-500">
              The applicant will be moved back to the Shortlisted stage.
            </p>
          </div>
        </Modal>

        {/* Profile Modal - Reusable */}
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { Modal } from '../../components/ui/Modal';
import { ApplicantProfileModal } from '../../components/ui/ApplicantProfileModal';
import { ScheduleInterviewModal } from '../../components/ui/ScheduleInterviewModal';
import type { ScheduleInterviewData } from '../../components/ui/ScheduleInterviewModal';
import { useAuth } from '../../context/AuthContext';
import {
  getCompanyApplicants,
  getCompanyJobs,
  updateCompanyApplicantStatus,
  getStudentProfileById
} from '../../services/api/company';
import type { Application, Job, StudentProfileDetail } from '../../types/app';
import {
  Users,
  FileText,
  CheckCircle,
  Plus,
  MoreHorizontal,
  Calendar,
  XCircle,
  Briefcase,
  User
} from 'lucide-react';

interface CompanyDashboardProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function getStudentId(studentId: string | { id?: string; _id?: string } | undefined | null): string {
  if (!studentId) return '';
  if (typeof studentId === 'string') return studentId;
  return studentId.id || studentId._id || '';
}

export function CompanyDashboard({
  onNavigate,
  onLogout
}: CompanyDashboardProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicantsData, setApplicantsData] = useState<Application[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Profile modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileLoader, setProfileLoader] = useState<(() => Promise<StudentProfileDetail>) | null>(null);

  // Schedule interview modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTargetId, setScheduleTargetId] = useState('');
  const [scheduleApplicantName, setScheduleApplicantName] = useState('');

  // Reject confirmation modal state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState('');
  const [rejectTargetName, setRejectTargetName] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const loadDashboard = async (): Promise<void> => {
    try {
      const [jobsResponse, applicantsResponse] = await Promise.all([
        getCompanyJobs(),
        getCompanyApplicants()
      ]);
      setJobs(jobsResponse);
      setApplicantsData(applicantsResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load company dashboard');
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  // View Profile handler - uses callback to load profile
  const handleViewProfile = useCallback((application: Application) => {
    const studentId = getStudentId(application.studentId);
    if (!studentId) {
      setErrorMessage('Unable to identify the student for this application');
      return;
    }
    setProfileLoader(() => () => getStudentProfileById(studentId));
    setIsProfileOpen(true);
  }, []);

  // Schedule Interview handler
  const openScheduleModal = (applicationId: string, name: string) => {
    setScheduleTargetId(applicationId);
    setScheduleApplicantName(name);
    setIsScheduleOpen(true);
  };

  const handleScheduleInterview = async (data: ScheduleInterviewData) => {
    const dateTime = data.time
      ? new Date(`${data.date}T${data.time}`).toISOString()
      : new Date(data.date).toISOString();
    await updateCompanyApplicantStatus(scheduleTargetId, 'Interview Scheduled', dateTime);
    setIsScheduleOpen(false);
    await loadDashboard();
  };

  // Reject handlers
  const openRejectModal = (applicationId: string, name: string) => {
    setRejectTargetId(applicationId);
    setRejectTargetName(name);
    setIsRejectOpen(true);
  };

  const handleRejectApplicant = async () => {
    setIsRejecting(true);
    try {
      await updateCompanyApplicantStatus(rejectTargetId, 'Rejected');
      setIsRejectOpen(false);
      await loadDashboard();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to reject applicant');
    } finally {
      setIsRejecting(false);
    }
  };

  const applicants = useMemo(
    () =>
      applicantsData.map((application) => {
        const student = typeof application.studentId === 'string' ? null : application.studentId;
        const job = typeof application.jobId === 'string' ? null : application.jobId;
        const column =
          application.status === 'Applied'
            ? 'new'
            : application.status === 'Shortlisted'
              ? 'screening'
              : application.status === 'Interview Scheduled' || application.status === 'Pending Decision'
                ? 'interview'
                : application.status === 'Selected'
                  ? 'hired'
                  : 'offer';
        return {
          id: application._id,
          applicationId: application._id,
          name: student?.name || '-',
          role: job?.title || '-',
          date: new Date(application.createdAt).toLocaleDateString(),
          column
        };
      }),
    [applicantsData]
  );

  const kanbanColumns = useMemo(
    () => [
      {
        id: 'new',
        title: 'New Applications',
        color: 'bg-slate-100',
        borderColor: 'border-slate-300',
        count: applicants.filter((applicant) => applicant.column === 'new').length
      },
      {
        id: 'screening',
        title: 'Shortlisted',
        color: 'bg-blue-50',
        borderColor: 'border-blue-300',
        count: applicants.filter((applicant) => applicant.column === 'screening').length
      },
      {
        id: 'interview',
        title: 'Interview',
        color: 'bg-purple-50',
        borderColor: 'border-purple-300',
        count: applicants.filter((applicant) => applicant.column === 'interview').length
      },
      {
        id: 'offer',
        title: 'Rejected',
        color: 'bg-red-50',
        borderColor: 'border-red-300',
        count: applicants.filter((applicant) => applicant.column === 'offer').length
      },
      {
        id: 'hired',
        title: 'Selected',
        color: 'bg-green-50',
        borderColor: 'border-green-300',
        count: applicants.filter((applicant) => applicant.column === 'hired').length
      }
    ],
    [applicants]
  );

  const openJobs = jobs.filter((job) => job.status === 'Open').length;
  const shortlisted = applicantsData.filter((application) => application.status === 'Shortlisted').length;
  const hired = applicantsData.filter((application) => application.status === 'Selected').length;

  return (
    <DashboardLayout
      userRole="company"
      currentPath="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Company',
        email: user?.email || ''
      }}
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Recruitment Pipeline</h1>
            <p className="text-slate-600">Manage your job postings and applicants.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Briefcase className="h-4 w-4" />}
              onClick={() => onNavigate('company-jobs')}
            >
              Manage Jobs
            </Button>
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => onNavigate('company-jobs')}
            >
              Post New Job
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Open Positions"
            value={String(openJobs)}
            icon={<FileText className="h-6 w-6" />}
            gradient="blue"
          />
          <StatCard
            title="Total Applicants"
            value={String(applicantsData.length)}
            icon={<Users className="h-6 w-6" />}
            gradient="teal"
            trend={{
              value: String(applicantsData.length),
              direction: 'up'
            }}
          />
          <StatCard
            title="Shortlisted"
            value={String(shortlisted)}
            icon={<CheckCircle className="h-6 w-6" />}
            gradient="purple"
          />
          <StatCard
            title="Hired"
            value={String(hired)}
            icon={<Users className="h-6 w-6" />}
            gradient="orange"
            trend={{
              value: String(hired),
              direction: hired > 0 ? 'up' : 'neutral'
            }}
          />
        </div>

        {/* Kanban Board - Grid Layout */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {kanbanColumns.map((column) => (
            <div
              key={column.id}
              className="flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className={`flex items-center justify-between px-4 py-3 border-b ${column.color}`}>
                <h3 className="font-semibold text-slate-900 text-sm">{column.title}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
                  {column.count}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[480px]">
                {applicants
                  .filter((a) => a.column === column.id)
                  .map((applicant) => (
                    <div
                      key={applicant.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-900 text-sm truncate">
                            {applicant.name}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">{applicant.role}</p>
                        </div>
                        <DropdownMenu
                          items={[
                            {
                              label: 'View Profile',
                              icon: <User className="h-4 w-4" />,
                              onClick: () => {
                                const application = applicantsData.find(
                                  (a) => a._id === applicant.applicationId
                                );
                                if (application) handleViewProfile(application);
                              }
                            },
                            {
                              label: 'Schedule Interview',
                              icon: <Calendar className="h-4 w-4" />,
                              onClick: () => openScheduleModal(applicant.applicationId, applicant.name)
                            },
                            {
                              label: 'Reject',
                              icon: <XCircle className="h-4 w-4" />,
                              variant: 'danger',
                              onClick: () => openRejectModal(applicant.applicationId, applicant.name)
                            }
                          ]}
                          trigger={
                            <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-md hover:bg-slate-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          }
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Applied {applicant.date}</span>
                        <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                          {applicant.name.charAt(0)}
                        </div>
                      </div>
                    </div>
                  ))}

                {applicants.filter((a) => a.column === column.id).length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-xs text-slate-400">
                    No applicants
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View Profile Modal - Reusable */}
        {profileLoader && (
          <ApplicantProfileModal
            isOpen={isProfileOpen}
            onClose={() => { setIsProfileOpen(false); setProfileLoader(null); }}
            loadProfile={profileLoader}
          />
        )}

        {/* Schedule Interview Modal - Reusable */}
        <ScheduleInterviewModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          onSchedule={handleScheduleInterview}
          applicantName={scheduleApplicantName}
        />

        {/* Reject Confirmation Modal */}
        <Modal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          title="Reject Applicant"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRejectApplicant} isLoading={isRejecting}>
                Reject
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Are you sure you want to reject <strong>{rejectTargetName}</strong>?
            </p>
            <p className="text-sm text-slate-500">
              This action will mark the applicant as rejected. This cannot be undone.
            </p>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ScheduleInterviewModal } from '../../components/ui/ScheduleInterviewModal';
import type { ScheduleInterviewData } from '../../components/ui/ScheduleInterviewModal';
import { StatusDot } from '../../components/ui/StatusDot';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import { getAdminApplications, updateAdminApplicationStatus } from '../../services/api/admin';
import type { Application } from '../../types/app';
import {
  CalendarDays,
  CheckCircle2,
  MoreHorizontal,
  Trash,
  Calendar,
  TimerReset,
  Users
} from 'lucide-react';

interface InterviewManagementProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function InterviewManagement({ onNavigate, onLogout }: InterviewManagementProps) {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadApplications = async (): Promise<void> => {
    try {
      const response = await getAdminApplications();
      setApplications(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load interviews');
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const interviews = useMemo(
    () =>
      applications
        .filter(
          (application) =>
            application.status === 'Interview Scheduled' && application.interviewDate
        )
        .map((application) => {
          const student =
            application.studentId && typeof application.studentId !== 'string'
              ? application.studentId
              : null;
          const job =
            application.jobId && typeof application.jobId !== 'string'
              ? application.jobId
              : null;
          const company =
            job?.companyId && typeof job.companyId !== 'string'
              ? job.companyId.name
              : '-';
          const dateObject = application.interviewDate ? new Date(application.interviewDate) : null;

          return {
            id: application._id,
            student: student?.name || '-',
            company,
            role: job?.title || '-',
            date: dateObject ? dateObject.toLocaleDateString() : '-',
            time: dateObject
              ? dateObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '-',
            type: 'Interview',
            status:
              application.status === 'Selected'
                ? 'success'
                : application.status === 'Rejected'
                  ? 'error'
                  : 'pending'
          };
        }),
    [applications]
  );

  const totalInterviews = interviews.length;
  const todayDateKey = new Date().toDateString();
  const todaysInterviews = applications.filter((application) => {
    if (!application.interviewDate || application.status !== 'Interview Scheduled') return false;
    return new Date(application.interviewDate).toDateString() === todayDateKey;
  }).length;
  const pendingResults = applications.filter(
    (application) => application.status === 'Pending Decision'
  ).length;

  const columns = [
    { key: 'student', header: 'Student', sortable: true },
    { key: 'company', header: 'Company', sortable: true },
    { key: 'role', header: 'Role' },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'time', header: 'Time' },
    { key: 'type', header: 'Round' },
    {
      key: 'status',
      header: 'Status',
      render: (item: { status: string }) => (
        <StatusDot
          status={item.status as 'success' | 'error' | 'pending'}
          label={
            item.status === 'success'
              ? 'Completed'
              : item.status === 'error'
                ? 'Cancelled'
                : 'Scheduled'
          }
        />
      )
    }
  ];

  const handleScheduleInterview = async (data: ScheduleInterviewData) => {
    if (!selectedApplicationId) {
      throw new Error('Please select an application');
    }

    const combinedDate = data.time
      ? new Date(`${data.date}T${data.time}`).toISOString()
      : new Date(data.date).toISOString();

    await updateAdminApplicationStatus(
      selectedApplicationId,
      'Interview Scheduled',
      combinedDate
    );

    setIsAddModalOpen(false);
    setSelectedApplicationId('');
    await loadApplications();
  };

  return (
    <DashboardLayout
      userRole="admin"
      currentPath="interviews"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{ name: user?.name || 'Admin', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Interview Management' }]}
    >
      <div className="admin-page">
        <div className="admin-hero admin-hero--violet">
          <div className="admin-hero__row">
            <div className="admin-hero__body">
              <span className="admin-hero__eyebrow">Interview Management</span>
              <h1 className="admin-hero__title">Interview Schedule Hub</h1>
              <p className="admin-hero__subtitle">
                Coordinate upcoming interviews and keep hiring timelines visible in a focused,
                table-first workspace.
              </p>
            </div>
            <Button
              className="company-secondary-button"
              icon={<Calendar className="h-4 w-4" />}
              onClick={() => {
                setSelectedApplicationId('');
                setIsAddModalOpen(true);
              }}
            >
              Schedule Interview
            </Button>
          </div>
        </div>

        {errorMessage && <div className="admin-alert admin-alert--error">{errorMessage}</div>}

        <div className="admin-stat-grid admin-grid admin-grid--three">
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--violet">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Scheduled Interviews</p>
                <p className="admin-stat-card__value">{totalInterviews}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--sky">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Today</p>
                <p className="admin-stat-card__value">{todaysInterviews}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--amber">
                <TimerReset className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Pending Results</p>
                <p className="admin-stat-card__value">{pendingResults}</p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          title="Interview Schedule"
          data={interviews}
          columns={columns}
          keyField="id"
          actions={(item) => (
            <DropdownMenu
              items={[
                {
                  label: 'Mark Result Pending',
                  icon: <CheckCircle2 className="h-4 w-4" />,
                  onClick: async () => {
                    await updateAdminApplicationStatus(item.id, 'Pending Decision');
                    await loadApplications();
                  }
                },
                {
                  label: 'Cancel Interview',
                  icon: <Trash className="h-4 w-4" />,
                  variant: 'danger',
                  onClick: async () => {
                    await updateAdminApplicationStatus(item.id, 'Shortlisted');
                    await loadApplications();
                  }
                }
              ]}
              trigger={
                <button className="company-icon-button" type="button">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              }
            />
          )}
        />

        <Modal
          isOpen={isAddModalOpen && !selectedApplicationId}
          onClose={() => setIsAddModalOpen(false)}
          title="Select Application"
          preventCloseOnBackdrop
          footer={
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
          }
        >
          <div className="admin-select-card">
            <label className="admin-field__label">
              Select the application to schedule an interview for:
            </label>
            <select
              value={selectedApplicationId}
              onChange={(event) => setSelectedApplicationId(event.target.value)}
              className="shared-select-reset"
            >
              <option value="">Select Application</option>
              {applications
                .filter((application) =>
                  ['Applied', 'Shortlisted', 'Pending Decision', 'Interview Scheduled'].includes(
                    application.status
                  )
                )
                .map((application) => {
                  const student =
                    application.studentId && typeof application.studentId !== 'string'
                      ? application.studentId.name
                      : '-';
                  const job =
                    application.jobId && typeof application.jobId !== 'string'
                      ? application.jobId.title
                      : '-';
                  return (
                    <option key={application._id} value={application._id}>
                      {student} - {job} ({application.status})
                    </option>
                  );
                })}
            </select>
          </div>
        </Modal>

        <ScheduleInterviewModal
          isOpen={isAddModalOpen && !!selectedApplicationId}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedApplicationId('');
          }}
          onSchedule={handleScheduleInterview}
          applicantName={
            (() => {
              const application = applications.find((item) => item._id === selectedApplicationId);
              return application?.studentId && typeof application.studentId !== 'string'
                ? application.studentId.name
                : '';
            })()
          }
        />
      </div>
    </DashboardLayout>
  );
}

import { Fragment, useEffect, useMemo, useState } from 'react';
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
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);

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

  const getWeekDates = (offset: number) => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  };

  const weekDates = getWeekDates(weekOffset);
  const calendarDays = weekDates.map((date) =>
    date.toLocaleDateString('en-US', { weekday: 'short' })
  );
  const calendarDateLabels = weekDates.map((date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );
  const timeSlots = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM'
  ];

  const getInterviewsForSlot = (dayIndex: number, timeSlot: string) =>
    interviews.filter((interview) => {
      const interviewDate = new Date(
        applications.find((application) => application._id === interview.id)?.interviewDate || ''
      );
      if (Number.isNaN(interviewDate.getTime())) return false;

      const slotDate = weekDates[dayIndex];
      const parsedSlotHour =
        timeSlot === '12:00 PM'
          ? 12
          : parseInt(timeSlot.split(':')[0], 10) + (timeSlot.includes('PM') ? 12 : 0);

      return (
        interviewDate.getFullYear() === slotDate.getFullYear() &&
        interviewDate.getMonth() === slotDate.getMonth() &&
        interviewDate.getDate() === slotDate.getDate() &&
        interviewDate.getHours() === parsedSlotHour
      );
    });

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
                Coordinate upcoming interviews, switch between table and calendar views, and keep
                hiring timelines visible at a glance.
              </p>
            </div>
            <div className="admin-actions-row">
              <div className="admin-hero-switch">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={
                    viewMode === 'table'
                      ? 'admin-hero-switch__button admin-hero-switch__button--active'
                      : 'admin-hero-switch__button'
                  }
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={
                    viewMode === 'calendar'
                      ? 'admin-hero-switch__button admin-hero-switch__button--active'
                      : 'admin-hero-switch__button'
                  }
                >
                  Calendar
                </button>
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

        {viewMode === 'table' ? (
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
        ) : (
          <div className="admin-calendar">
            <div className="admin-calendar__header">
              <h3 className="admin-calendar__title">
                {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} -{' '}
                {weekDates[4].toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <div className="admin-calendar__actions">
                <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev + 1)}>
                  Next
                </Button>
              </div>
            </div>
            <div className="admin-calendar__scroll">
              <div className="admin-calendar__grid">
                <div className="admin-calendar__head" />
                {calendarDays.map((day, index) => (
                  <div key={`${day}-${index}`} className="admin-calendar__head">
                    <p className="admin-calendar__head-day">{day}</p>
                    <p className="admin-calendar__head-date">{calendarDateLabels[index]}</p>
                  </div>
                ))}

                {timeSlots.map((time) => (
                  <Fragment key={time}>
                    <div className="admin-calendar__time">{time}</div>
                    {calendarDays.map((day, dayIndex) => {
                      const slotInterviews = getInterviewsForSlot(dayIndex, time);
                      return (
                        <div key={`${time}-${day}-${dayIndex}`} className="admin-calendar__cell">
                          {slotInterviews.map((interview) => (
                            <div key={interview.id} className="admin-calendar__event">
                              <p className="admin-calendar__event-title">{interview.student}</p>
                              <p className="admin-calendar__event-copy">
                                {interview.company} - {interview.role}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

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

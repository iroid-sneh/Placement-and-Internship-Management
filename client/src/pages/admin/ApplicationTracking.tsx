import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { StatusDot } from '../../components/ui/StatusDot';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import {
  Activity,
  Briefcase,
  MoreHorizontal,
  Calendar,
  CheckCircle,
  Clock3,
  UserCheck,
  XCircle } from
'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminApplications,
  updateAdminApplicationStatus
} from '../../services/api/admin';
import type { Application } from '../../types/app';
interface ApplicationTrackingProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
export function ApplicationTracking({
  onNavigate,
  onLogout
}: ApplicationTrackingProps) {
  const { user } = useAuth();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusValue, setStatusValue] = useState<Application['status']>('Applied');
  const [interviewDate, setInterviewDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const loadApplications = async (): Promise<void> => {
    try {
      const response = await getAdminApplications();
      setApplications(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load applications');
    }
  };
  useEffect(() => {
    void loadApplications();
  }, []);

  const totalApplications = applications.length;
  const scheduledApplications = applications.filter((item) => item.status === 'Interview Scheduled').length;
  const selectedApplications = applications.filter((item) => item.status === 'Selected').length;
  const shortlistedApplications = applications.filter(
    (item) => item.status === 'Shortlisted' || item.status === 'Pending Decision'
  ).length;

  const rows = applications.map((item) => ({
    id: item._id,
    student:
      item.studentId && typeof item.studentId !== 'string'
        ? item.studentId.name
        : '-',
    company:
      !item.jobId ||
      typeof item.jobId === 'string' ||
      !item.jobId.companyId ||
      typeof item.jobId.companyId === 'string'
        ? '-'
        : item.jobId.companyId.name,
    role:
      item.jobId && typeof item.jobId !== 'string'
        ? item.jobId.title
        : '-',
    date: new Date(item.createdAt).toLocaleDateString(),
    status: item.status,
    interviewDate: item.interviewDate
      ? new Date(item.interviewDate).toLocaleDateString()
      : '-'
  }));

  const columns = [
  {
    key: 'student',
    header: 'Student Name',
    sortable: true
  },
  {
    key: 'company',
    header: 'Company',
    sortable: true
  },
  {
    key: 'role',
    header: 'Job Role',
    sortable: true
  },
  {
    key: 'date',
    header: 'Applied Date',
    sortable: true
  },
  {
    key: 'status',
    header: 'Status',
    render: (item: any) =>
    <StatusDot
      status={
      item.status === 'Selected' ?
      'success' :
      item.status === 'Interview Scheduled' ?
      'info' :
      item.status === 'Pending Decision' ?
      'warning' :
      item.status === 'Shortlisted' ?
      'warning' :
      item.status === 'Rejected' ?
      'error' :
      'pending'
      }
      label={
      item.status === 'Selected' ?
      'Selected' :
      item.status === 'Interview Scheduled' ?
      'Interview Scheduled' :
      item.status === 'Pending Decision' ?
      'Pending Decision' :
      item.status === 'Shortlisted' ?
      'Shortlisted' :
      item.status === 'Rejected' ?
      'Rejected' :
      'Applied'
      } />


  },
  {
    key: 'interviewDate',
    header: 'Interview Date'
  }];

  const handleStatusUpdate = (item: any) => {
    setSelectedApplication(item);
    setStatusValue(item.status);
    setModalErrorMessage('');
    setIsStatusModalOpen(true);
  };
  const handleScheduleInterview = (item: any) => {
    setSelectedApplication(item);
    setInterviewDate('');
    setModalErrorMessage('');
    setIsInterviewModalOpen(true);
  };
  const submitStatusUpdate = async (): Promise<void> => {
    try {
      await updateAdminApplicationStatus(selectedApplication.id, statusValue);
      setModalErrorMessage('');
      setIsStatusModalOpen(false);
      await loadApplications();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to update status');
    }
  };
  const submitInterviewDate = async (): Promise<void> => {
    try {
      if (!interviewDate) {
        setModalErrorMessage('Please select interview date');
        return;
      }
      await updateAdminApplicationStatus(
        selectedApplication.id,
        'Interview Scheduled',
        interviewDate
      );
      setModalErrorMessage('');
      setIsInterviewModalOpen(false);
      await loadApplications();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to schedule interview');
    }
  };
  return (
    <DashboardLayout
      userRole="admin"
      currentPath="applications"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Admin',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'Application Tracking'
      }]
      }>

      <div className="admin-page">
        <div className="admin-hero admin-hero--sky">
          <div className="admin-hero__row">
            <div className="admin-hero__body">
              <span className="admin-hero__eyebrow">Application Tracking</span>
              <h1 className="admin-hero__title">Placement Pipeline</h1>
              <p className="admin-hero__subtitle">
                Review every application, update outcomes quickly, and keep interview scheduling tightly coordinated.
              </p>
            </div>
            <div className="admin-hero__stats admin-grid admin-grid--four">
              <div className="admin-hero__stat">
                <p className="admin-hero__stat-label">Applications</p>
                <p className="admin-hero__stat-value">{totalApplications}</p>
              </div>
              <div className="admin-hero__stat">
                <p className="admin-hero__stat-label">Scheduled</p>
                <p className="admin-hero__stat-value">{scheduledApplications}</p>
              </div>
              <div className="admin-hero__stat">
                <p className="admin-hero__stat-label">Selected</p>
                <p className="admin-hero__stat-value">{selectedApplications}</p>
              </div>
              <div className="admin-hero__stat">
                <p className="admin-hero__stat-label">In Review</p>
                <p className="admin-hero__stat-value">{shortlistedApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="admin-alert admin-alert--error">{errorMessage}</div>
        )}

        <div className="admin-stat-grid admin-grid--four">
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--sky">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">All Applications</p>
                <p className="admin-stat-card__value">{totalApplications}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--violet">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Interviews Scheduled</p>
                <p className="admin-stat-card__value">{scheduledApplications}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--emerald">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Selected</p>
                <p className="admin-stat-card__value">{selectedApplications}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--amber">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Shortlisted / Pending</p>
                <p className="admin-stat-card__value">{shortlistedApplications}</p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          title="Applications Overview"
          data={rows}
          columns={columns}
          keyField="id"
          actions={(item) =>
          <DropdownMenu
            items={[
            {
              label: 'Update Status',
              icon: <CheckCircle className="h-4 w-4" />,
              onClick: () => handleStatusUpdate(item)
            },
            {
              label: 'Schedule Interview',
              icon: <Calendar className="h-4 w-4" />,
              onClick: () => handleScheduleInterview(item)
            },
            {
              label: 'Mark as Rejected',
              icon: <XCircle className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => {
                setSelectedApplication(item);
                setStatusValue('Rejected');
                setModalErrorMessage('');
                setIsStatusModalOpen(true);
              }
            }]
            }
            trigger={
            <button className="company-icon-button" type="button">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
            } />

          }
        />


        {/* Status Update Modal */}
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setModalErrorMessage('');
          }}
          title="Update Application Status"
          footer={
          <>
              <Button
              variant="ghost"
              onClick={() => {
                setIsStatusModalOpen(false);
                setModalErrorMessage('');
              }}>

                Cancel
              </Button>
              <Button onClick={submitStatusUpdate}>
                Update Status
              </Button>
            </>
          }>

          <div className="admin-form">
            {modalErrorMessage && (
              <div className="admin-alert admin-alert--error">{modalErrorMessage}</div>
            )}
            <div className="admin-preview">
              <p className="admin-preview__subtitle">
                Student:{' '}
                <span className="admin-preview__title">
                  {selectedApplication?.student}
                </span>
              </p>
              <p className="admin-preview__subtitle">
                Company:{' '}
                <span className="admin-preview__title">
                  {selectedApplication?.company}
                </span>
              </p>
              <p className="admin-preview__subtitle">
                Role:{' '}
                <span className="admin-preview__title">
                  {selectedApplication?.role}
                </span>
              </p>
            </div>
            <div className="admin-field">
              <label className="admin-field__label">
                New Status
              </label>
              <select
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value as Application['status'])}
                className="shared-select-reset">
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Pending Decision">Pending Decision</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </Modal>

        {/* Schedule Interview Modal */}
        <Modal
          isOpen={isInterviewModalOpen}
          onClose={() => {
            setIsInterviewModalOpen(false);
            setModalErrorMessage('');
          }}
          title="Schedule Interview"
          footer={
          <>
              <Button
              variant="ghost"
              onClick={() => {
                setIsInterviewModalOpen(false);
                setModalErrorMessage('');
              }}>

                Cancel
              </Button>
              <Button onClick={submitInterviewDate}>
                Schedule
              </Button>
            </>
          }>

          <div className="admin-form">
            {modalErrorMessage && (
              <div className="admin-alert admin-alert--error">{modalErrorMessage}</div>
            )}
            <div className="admin-preview">
              <p className="admin-preview__subtitle">
                Student:{' '}
                <span className="admin-preview__title">
                  {selectedApplication?.student}
                </span>
              </p>
              <p className="admin-preview__subtitle">
                Company:{' '}
                <span className="admin-preview__title">
                  {selectedApplication?.company}
                </span>
              </p>
            </div>
            <Input
              label="Interview Date"
              type="datetime-local"
              value={interviewDate}
              onChange={(event) => setInterviewDate(event.target.value)}
            />

          </div>
        </Modal>
      </div>
    </DashboardLayout>);

}

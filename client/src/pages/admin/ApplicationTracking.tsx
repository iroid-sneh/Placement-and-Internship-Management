import React, { useState } from 'react';
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
  React.useEffect(() => {
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

      <div className="space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                Application Tracking
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Placement Pipeline</h1>
                <p className="mt-2 text-sm text-slate-200 sm:text-base">
                  Review every application, update outcomes quickly, and keep interview scheduling tightly coordinated.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">Applications</p>
                <p className="mt-1 text-2xl font-semibold">{totalApplications}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">Scheduled</p>
                <p className="mt-1 text-2xl font-semibold">{scheduledApplications}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">Selected</p>
                <p className="mt-1 text-2xl font-semibold">{selectedApplications}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">In Review</p>
                <p className="mt-1 text-2xl font-semibold">{shortlistedApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">All Applications</p>
                <p className="text-2xl font-bold text-slate-900">{totalApplications}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Interviews Scheduled</p>
                <p className="text-2xl font-bold text-slate-900">{scheduledApplications}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Selected</p>
                <p className="text-2xl font-bold text-slate-900">{selectedApplications}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Shortlisted / Pending</p>
                <p className="text-2xl font-bold text-slate-900">{shortlistedApplications}</p>
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
            <button className="p-1 text-slate-400 hover:text-slate-600">
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

          <div className="space-y-4">
            {modalErrorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalErrorMessage}
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Student:{' '}
                <span className="font-medium text-slate-900">
                  {selectedApplication?.student}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                Company:{' '}
                <span className="font-medium text-slate-900">
                  {selectedApplication?.company}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                Role:{' '}
                <span className="font-medium text-slate-900">
                  {selectedApplication?.role}
                </span>
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                New Status
              </label>
              <select
                value={statusValue}
                onChange={(event) => setStatusValue(event.target.value as Application['status'])}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none">
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

          <div className="space-y-4">
            {modalErrorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalErrorMessage}
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Student:{' '}
                <span className="font-medium text-slate-900">
                  {selectedApplication?.student}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                Company:{' '}
                <span className="font-medium text-slate-900">
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

import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { StatusDot } from '../../components/ui/StatusDot';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import {
  MoreHorizontal,
  Calendar,
  CheckCircle,
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
  const rows = applications.map((item) => ({
    id: item._id,
    student:
      typeof item.studentId === 'string' ? '-' : item.studentId.name,
    company:
      typeof item.jobId === 'string' || typeof item.jobId.companyId === 'string'
        ? '-'
        : item.jobId.companyId.name,
    role: typeof item.jobId === 'string' ? '-' : item.jobId.title,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Application Tracking
            </h1>
            <p className="text-slate-600">
              Monitor and update student application statuses.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        <DataTable
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
            <div className="p-4 bg-slate-50 rounded-lg">
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
            <div className="p-4 bg-slate-50 rounded-lg">
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
              type="date"
              value={interviewDate}
              onChange={(event) => setInterviewDate(event.target.value)}
            />

          </div>
        </Modal>
      </div>
    </DashboardLayout>);

}
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { StatusDot } from '../../components/ui/StatusDot';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ApplicantProfileModal } from '../../components/ui/ApplicantProfileModal';
import { ScheduleInterviewModal } from '../../components/ui/ScheduleInterviewModal';
import type { ScheduleInterviewData } from '../../components/ui/ScheduleInterviewModal';
import { MoreHorizontal, User, Calendar, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getCompanyApplicants,
  updateCompanyApplicantStatus,
  getStudentProfileById
} from '../../services/api/company';
import type { Application, StudentProfileDetail } from '../../types/app';

interface ApplicantListProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function getStudentId(studentId: string | { id?: string; _id?: string } | undefined | null): string {
  if (!studentId) return '';
  if (typeof studentId === 'string') return studentId;
  return studentId.id || studentId._id || '';
}

export function ApplicantList({ onNavigate, onLogout }: ApplicantListProps) {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Application['status']>('Applied');
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  // Profile modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileLoader, setProfileLoader] = useState<(() => Promise<StudentProfileDetail>) | null>(null);

  // Schedule interview modal
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTargetId, setScheduleTargetId] = useState('');
  const [scheduleApplicantName, setScheduleApplicantName] = useState('');

  const loadApplicants = async (): Promise<void> => {
    try {
      const response = await getCompanyApplicants();
      setApplicants(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load applicants');
    }
  };

  useEffect(() => {
    void loadApplicants();
  }, []);

  const pendingDecisionCount = useMemo(
    () => applicants.filter((a) => a.status === 'Pending Decision').length,
    [applicants]
  );

  const handleViewProfile = useCallback((application: Application) => {
    const studentId = getStudentId(application.studentId);
    if (!studentId) {
      setErrorMessage('Unable to identify the student for this application');
      return;
    }
    setProfileLoader(() => () => getStudentProfileById(studentId));
    setIsProfileOpen(true);
  }, []);

  const rows = useMemo(
    () =>
      applicants.map((application) => ({
        id: application._id,
        application,
        name:
          typeof application.studentId === 'string'
            ? '-'
            : application.studentId.name,
        job: typeof application.jobId === 'string' ? '-' : application.jobId.title,
        appliedDate: new Date(application.createdAt).toLocaleDateString(),
        status: application.status
      })),
    [applicants]
  );

  const handleOpenStatusModal = (applicationId: string, status: Application['status']): void => {
    if (status === 'Applied' || status === 'Shortlisted' || status === 'Pending Decision') {
      // Open full schedule interview modal for scheduling
      setSelectedApplicationId(applicationId);
      const applicant = applicants.find((a) => a._id === applicationId);
      const name = applicant && typeof applicant.studentId !== 'string' ? applicant.studentId.name : '';
      setScheduleApplicantName(name);
      setScheduleTargetId(applicationId);
      setIsScheduleOpen(true);
    } else {
      // For other status updates, use the simple modal
      setSelectedApplicationId(applicationId);
      setSelectedStatus(status);
      setModalErrorMessage('');
      setIsStatusModalOpen(true);
    }
  };

  const handleOpenUpdateStatusModal = (applicationId: string): void => {
    setSelectedApplicationId(applicationId);
    const applicant = applicants.find((a) => a._id === applicationId);
    setSelectedStatus(applicant ? applicant.status : 'Applied');
    setModalErrorMessage('');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (): Promise<void> => {
    try {
      await updateCompanyApplicantStatus(
        selectedApplicationId,
        selectedStatus
      );
      setModalErrorMessage('');
      setIsStatusModalOpen(false);
      await loadApplicants();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to update applicant status');
    }
  };

  const handleScheduleInterview = async (data: ScheduleInterviewData) => {
    const dateTime = data.time
      ? new Date(`${data.date}T${data.time}`).toISOString()
      : new Date(data.date).toISOString();
    await updateCompanyApplicantStatus(scheduleTargetId, 'Interview Scheduled', dateTime);
    setIsScheduleOpen(false);
    await loadApplicants();
  };

  const columns = [
    {
      key: 'name',
      header: 'Applicant',
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
            {item.name.charAt(0)}
          </div>
          <span className="font-medium text-slate-900">{item.name}</span>
        </div>
      )
    },
    {
      key: 'job',
      header: 'Applied For',
      sortable: true
    },
    {
      key: 'appliedDate',
      header: 'Applied Date',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        const statusMap: Record<string, { status: 'success' | 'info' | 'warning' | 'error' | 'pending'; label: string }> = {
          'Selected': { status: 'success', label: 'Selected' },
          'Interview Scheduled': { status: 'info', label: 'Interview Scheduled' },
          'Pending Decision': { status: 'warning', label: 'Pending Decision' },
          'Shortlisted': { status: 'warning', label: 'Shortlisted' },
          'Rejected': { status: 'error', label: 'Rejected' },
          'Applied': { status: 'pending', label: 'Applied' }
        };
        const s = statusMap[item.status] || statusMap['Applied'];
        return <StatusDot status={s.status} label={s.label} />;
      }
    }
  ];

  return (
    <DashboardLayout
      userRole="company"
      currentPath="applicants"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Company',
        email: user?.email || ''
      }}
      breadcrumbs={[{ label: 'Applicants' }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
            <p className="text-slate-600">Review and manage job applications.</p>
          </div>
          <div />
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {pendingDecisionCount > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {pendingDecisionCount} application{pendingDecisionCount === 1 ? '' : 's'} had an interview date that has
            passed. Please update each to <strong>Selected</strong> or <strong>Rejected</strong> (or reschedule the
            interview).
          </div>
        )}

        <DataTable
          data={rows}
          columns={columns}
          keyField="id"
          actions={(item: { id: string; status: Application['status']; application: Application }) =>
            <DropdownMenu
              items={[
                {
                  label: 'View Profile',
                  icon: <User className="h-4 w-4" />,
                  onClick: () => handleViewProfile(item.application)
                },
                {
                  label: item.status === 'Interview Scheduled' ? 'Reschedule Interview' : 'Schedule Interview',
                  icon: <Calendar className="h-4 w-4" />,
                  onClick: () => handleOpenStatusModal(item.id, item.status)
                },
                {
                  label: 'Update Status',
                  icon: <Edit3 className="h-4 w-4" />,
                  onClick: () => handleOpenUpdateStatusModal(item.id)
                }
              ]}
              trigger={
                <button className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              }
            />
          }
        />

        {/* Simple Status Update Modal (for non-interview status changes) */}
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setModalErrorMessage('');
          }}
          title="Update Applicant Status"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setModalErrorMessage('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>Save</Button>
            </>
          }
        >
          <div className="space-y-4">
            {modalErrorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalErrorMessage}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as Application['status'])}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              >
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
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

        {/* Schedule Interview Modal - Reusable */}
        <ScheduleInterviewModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          onSchedule={handleScheduleInterview}
          applicantName={scheduleApplicantName}
        />
      </div>
    </DashboardLayout>
  );
}

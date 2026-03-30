import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { StatusDot } from '../../components/ui/StatusDot';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCompanyApplicants, updateCompanyApplicantStatus } from '../../services/api/company';
import type { Application } from '../../types/app';
interface ApplicantListProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
export function ApplicantList({ onNavigate, onLogout }: ApplicantListProps) {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Application['status']>('Applied');
  const [interviewDate, setInterviewDate] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
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

  const rows = useMemo(
    () =>
      applicants.map((application) => ({
        id: application._id,
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
    setSelectedApplicationId(applicationId);
    setSelectedStatus(status === 'Pending Decision' ? 'Selected' : status);
    setInterviewDate('');
    setModalErrorMessage('');
    setIsStatusModalOpen(true);
  };
  const handleUpdateStatus = async (): Promise<void> => {
    try {
      if (selectedStatus === 'Interview Scheduled' && !interviewDate) {
        setModalErrorMessage('Please select interview date');
        return;
      }
      await updateCompanyApplicantStatus(
        selectedApplicationId,
        selectedStatus,
        selectedStatus === 'Interview Scheduled' ? interviewDate : undefined
      );
      setModalErrorMessage('');
      setIsStatusModalOpen(false);
      await loadApplicants();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to update applicant status');
    }
  };

  const columns = [
  {
    key: 'name',
    header: 'Applicant',
    sortable: true,
    render: (item: any) =>
    <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
            {item.name.charAt(0)}
          </div>
          <span className="font-medium text-slate-900">{item.name}</span>
        </div>

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


  }];

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
      breadcrumbs={[
      {
        label: 'Applicants'
      }]
      }>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
            <p className="text-slate-600">
              Review and manage job applications.
            </p>
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
          actions={(item: { id: string; status: Application['status'] }) =>
            <DropdownMenu
              items={[
                {
                  label: 'Update Status',
                  onClick: () => handleOpenStatusModal(item.id, item.status)
                },
                {
                  label: 'View Jobs',
                  onClick: () => onNavigate('company-jobs')
                }
              ]}
              trigger={
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              }
            />
          }
        />
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
                }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>
                Save
              </Button>
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
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none">
                <option value="Applied">Applied</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            {selectedStatus === 'Interview Scheduled' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Interview Date</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(event) => setInterviewDate(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>
            )}
          </div>
        </Modal>
      </div>
    </DashboardLayout>);

}
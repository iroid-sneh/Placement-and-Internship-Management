import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { StatusDot } from '../../components/ui/StatusDot';
import { Button } from '../../components/ui/Button';
import { Eye } from 'lucide-react';
import { getStudentApplications } from '../../services/api/student';
import { useAuth } from '../../context/AuthContext';
import type { Application } from '../../types/app';
interface MyApplicationsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
export function MyApplications({ onNavigate, onLogout }: MyApplicationsProps) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const loadApplications = async (): Promise<void> => {
      try {
        const response = await getStudentApplications();
        setApplications(response);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    };
    void loadApplications();
  }, []);
  const mappedApplications = useMemo(
    () =>
      applications.map((item) => {
        const job = typeof item.jobId === 'string' ? null : item.jobId;
        const company =
          job && typeof job.companyId !== 'string' ? job.companyId.name : 'Company';
        return {
          id: item._id,
          company,
          role: job?.title || '-',
          appliedDate: new Date(item.createdAt).toLocaleDateString(),
          status: item.status,
          interviewDate: item.interviewDate
            ? new Date(item.interviewDate).toLocaleDateString()
            : '-'
        };
      }),
    [applications]
  );
  const columns = [
  {
    key: 'company',
    header: 'Company',
    sortable: true,
    render: (item: any) =>
    <span className="font-medium text-slate-900">{item.company}</span>

  },
  {
    key: 'role',
    header: 'Job Role',
    sortable: true
  },
  {
    key: 'appliedDate',
    header: 'Applied On',
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
      item.status === 'Rejected' ?
      'error' :
      item.status === 'Shortlisted' ?
      'warning' :
      'pending'
      }
      label={
      item.status === 'Selected' ?
      'Selected' :
      item.status === 'Interview Scheduled' ?
      'Interview Scheduled' :
      item.status === 'Rejected' ?
      'Rejected' :
      item.status === 'Shortlisted' ?
      'Shortlisted' :
      'Applied'
      } />


  },
  {
    key: 'interviewDate',
    header: 'Interview Date'
  }];

  return (
    <DashboardLayout
      userRole="student"
      currentPath="applications"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Student',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'My Applications'
      }]
      }>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
          <p className="text-slate-600">
            Track the status of your job applications.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-slate-600">Loading applications...</div>
        ) : (
        <DataTable
          data={mappedApplications}
          columns={columns}
          keyField="id"
          actions={(item) =>
          <Button
            variant="ghost"
            size="sm"
            icon={<Eye className="h-4 w-4" />}>

              Details
            </Button>
          } />
        )}
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

      </div>
    </DashboardLayout>);

}
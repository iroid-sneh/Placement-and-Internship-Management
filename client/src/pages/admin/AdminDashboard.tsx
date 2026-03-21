import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusDot } from '../../components/ui/StatusDot';
import { Button } from '../../components/ui/Button';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import { getAdminApplications, getAdminCompanies, getAdminJobs, getAdminReportSummary } from '../../services/api/admin';
import type { Application } from '../../types/app';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  Download,
  Mail,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  TrendingUp,
  Calendar } from
'lucide-react';
interface AdminDashboardProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
interface StudentApplication {
  id: string;
  studentName: string;
  company: string;
  role: string;
  date: string;
  status: 'success' | 'warning' | 'info' | 'error' | 'pending';
  gpa: string;
}
export function AdminDashboard({ onNavigate, onLogout }: AdminDashboardProps) {
  const { user } = useAuth();
  const [applicationsData, setApplicationsData] = useState<Application[]>([]);
  const [reportSummary, setReportSummary] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    selectedCount: 0,
    openJobs: 0
  });
  const [companiesCount, setCompaniesCount] = useState(0);
  const [jobsCount, setJobsCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const loadDashboardData = async (): Promise<void> => {
      try {
        const [applicationsResponse, reportResponse, companiesResponse, jobsResponse] = await Promise.all([
          getAdminApplications(),
          getAdminReportSummary(),
          getAdminCompanies(),
          getAdminJobs()
        ]);
        setApplicationsData(applicationsResponse);
        setReportSummary(reportResponse);
        setCompaniesCount(companiesResponse.length);
        setJobsCount(jobsResponse.length);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load dashboard');
      }
    };
    void loadDashboardData();
  }, []);
  const applications: StudentApplication[] = useMemo(
    () =>
      applicationsData.slice(0, 10).map((application) => {
        const student = typeof application.studentId === 'string' ? null : application.studentId;
        const job = typeof application.jobId === 'string' ? null : application.jobId;
        const company =
          job && typeof job.companyId !== 'string' ? job.companyId.name : '-';
        const status =
          application.status === 'Selected'
            ? 'success'
            : application.status === 'Interview Scheduled'
              ? 'info'
              : application.status === 'Shortlisted'
                ? 'warning'
                : application.status === 'Rejected'
                  ? 'error'
                  : 'pending';
        return {
          id: application._id,
          studentName: student?.name || '-',
          company,
          role: job?.title || '-',
          date: new Date(application.createdAt).toLocaleDateString(),
          status,
          gpa: '-'
        };
      }),
    [applicationsData]
  );
  const placementRate = reportSummary.totalStudents
    ? Math.round((reportSummary.selectedCount / reportSummary.totalStudents) * 100)
    : 0;
  const chartValues = [
    applicationsData.filter((application) => application.status === 'Applied').length,
    applicationsData.filter((application) => application.status === 'Shortlisted').length,
    applicationsData.filter((application) => application.status === 'Interview Scheduled').length,
    applicationsData.filter((application) => application.status === 'Selected').length,
    applicationsData.filter((application) => application.status === 'Rejected').length
  ];
  const chartLabels = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];
  const maxChartValue = Math.max(...chartValues, 1);

  const columns: Column<StudentApplication>[] = [
  {
    key: 'studentName',
    header: 'Student',
    sortable: true
  },
  {
    key: 'company',
    header: 'Company',
    sortable: true
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true
  },
  {
    key: 'gpa',
    header: 'GPA',
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
    render: (item) =>
    <StatusDot
      status={item.status}
      label={
      item.status === 'success' ?
      'Placed' :
      item.status === 'info' ?
      'Interviewing' :
      item.status === 'error' ?
      'Rejected' :
      item.status === 'pending' ?
      'Pending' :
      'Unknown'
      } />


  }];

  return (
    <DashboardLayout
      userRole="admin"
      currentPath="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Admin',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'Dashboard'
      }]
      }>

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Placement Overview
            </h1>
            <p className="text-slate-600">
              Track placement progress and student statistics.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Download className="h-4 w-4" />}
              onClick={() => onNavigate('reports')}>

              Export Report
            </Button>
            <Button icon={<Mail className="h-4 w-4" />}>
              Send Notifications
            </Button>
          </div>
        </div>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Users className="h-4 w-4" />}
            onClick={() => onNavigate('students')}>

            Manage Students
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Building2 className="h-4 w-4" />}
            onClick={() => onNavigate('companies')}>

            Manage Companies
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Briefcase className="h-4 w-4" />}
            onClick={() => onNavigate('jobs')}>

            Job Postings
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Calendar className="h-4 w-4" />}
            onClick={() => onNavigate('interviews')}>

            Schedule Interviews
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value={String(reportSummary.totalStudents)}
            icon={<Users className="h-6 w-6" />}
            gradient="blue" />

          <StatCard
            title="Companies"
            value={String(companiesCount || reportSummary.totalCompanies)}
            icon={<Building2 className="h-6 w-6" />}
            gradient="purple" />

          <StatCard
            title="Placed Students"
            value={String(reportSummary.selectedCount)}
            icon={<CheckCircle className="h-6 w-6" />}
            gradient="teal"
            trend={{
              value: `${placementRate}%`,
              direction: 'neutral'
            }} />

          <StatCard
            title="Open Jobs"
            value={String(reportSummary.openJobs || jobsCount)}
            icon={<TrendingUp className="h-6 w-6" />}
            gradient="orange" />

        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">
              Placement Statistics
            </h3>
            <div className="flex h-64 items-end justify-between gap-2 px-4">
              {chartValues.map((value, i) =>
              <div
                key={i}
                className="w-full bg-slate-100 rounded-t-md relative group">

                  <div
                  style={{
                    height: `${Math.max((value / maxChartValue) * 100, 8)}%`
                  }}
                  className="absolute bottom-0 w-full rounded-t-md bg-teal-500 transition-all group-hover:bg-teal-600" />

                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between text-xs text-slate-500 px-4">
              {chartLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Application Distribution</h3>
            <div className="flex h-64 items-center justify-center">
              <div className="relative h-48 w-48 rounded-full border-[16px] border-slate-100">
                <div className="absolute inset-0 rounded-full border-[16px] border-teal-500 border-l-transparent border-b-transparent rotate-45" />
                <div className="absolute inset-0 rounded-full border-[16px] border-purple-500 border-l-transparent border-t-transparent border-r-transparent -rotate-12" />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-slate-900">{applicationsData.length}</span>
                  <span className="text-xs text-slate-500">Applications</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-teal-500" /> Selected
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-500" /> Interview
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-200" /> Others
              </div>
            </div>
          </div>
        </div>

        {/* Recent Applications Table */}
        <DataTable
          title="Recent Applications"
          data={applications}
          columns={columns}
          keyField="id"
          actions={(item) =>
          <DropdownMenu
            items={[
            {
              label: 'View Details',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => onNavigate('applications')
            },
            {
              label: 'Edit Status',
              icon: <Edit className="h-4 w-4" />,
              onClick: () => onNavigate('applications')
            },
            {
              label: 'Delete',
              icon: <Trash className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => onNavigate('applications')
            }]
            }
            trigger={
            <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
            } />

          }
          bulkActions={[]} />

      </div>
    </DashboardLayout>);

}
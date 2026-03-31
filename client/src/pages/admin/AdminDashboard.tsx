import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable, Column } from '../../components/ui/DataTable';
import { StatusDot } from '../../components/ui/StatusDot';
import { Button } from '../../components/ui/Button';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import {
  getAdminApplications,
  getAdminCompanies,
  getAdminJobs,
  getAdminReportSummary
} from '../../services/api/admin';
import type { Application } from '../../types/app';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  Calendar,
  Clock,
  Loader2,
  BarChart3
} from 'lucide-react';

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

const STATUS_COLORS: Record<string, string> = {
  Applied: '#94a3b8',
  Shortlisted: '#a78bfa',
  'Interview Scheduled': '#38bdf8',
  'Pending Decision': '#fbbf24',
  Selected: '#14b8a6',
  Rejected: '#f87171'
};

const STATUS_LABELS: Record<string, string> = {
  Applied: 'Applied',
  Shortlisted: 'Shortlisted',
  'Interview Scheduled': 'Interview',
  'Pending Decision': 'Pending',
  Selected: 'Selected',
  Rejected: 'Rejected'
};

const STATUS_ORDER = [
  'Applied',
  'Shortlisted',
  'Interview Scheduled',
  'Pending Decision',
  'Selected',
  'Rejected'
] as const;

function mapStatusToDot(status: Application['status']): 'success' | 'warning' | 'info' | 'error' | 'pending' {
  switch (status) {
    case 'Selected':
      return 'success';
    case 'Interview Scheduled':
      return 'info';
    case 'Pending Decision':
    case 'Shortlisted':
      return 'warning';
    case 'Rejected':
      return 'error';
    default:
      return 'pending';
  }
}

export function AdminDashboard({ onNavigate, onLogout }: AdminDashboardProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [applicationsData, setApplicationsData] = useState<Application[]>([]);
  const [reportSummary, setReportSummary] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    selectedCount: 0,
    openJobs: 0,
    scheduledInterviews: 0
  });
  const [companiesCount, setCompaniesCount] = useState(0);
  const [jobsCount, setJobsCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadDashboardData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const [applicationsResponse, reportResponse, companiesResponse, jobsResponse] =
          await Promise.all([
            getAdminApplications(),
            getAdminReportSummary(),
            getAdminCompanies(),
            getAdminJobs()
          ]);

        setApplicationsData(applicationsResponse);
        setReportSummary({
          ...reportResponse,
          scheduledInterviews:
            reportResponse.scheduledInterviews ??
            applicationsResponse.filter((a) => a.status === 'Interview Scheduled').length
        });
        setCompaniesCount(companiesResponse.length);
        setJobsCount(jobsResponse.length);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    void loadDashboardData();
  }, []);

  const applications: StudentApplication[] = useMemo(
    () =>
      applicationsData.slice(0, 10).map((application) => {
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
        return {
          id: application._id,
          studentName: student?.name || '-',
          company,
          role: job?.title || '-',
          date: new Date(application.createdAt).toLocaleDateString(),
          status: mapStatusToDot(application.status),
          gpa: '-'
        };
      }),
    [applicationsData]
  );

  const placementRate = reportSummary.totalStudents
    ? Math.round((reportSummary.selectedCount / reportSummary.totalStudents) * 100)
    : 0;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      STATUS_ORDER.map((status) => [status, 0])
    ) as Record<string, number>;
    for (const a of applicationsData) {
      counts[a.status] = (counts[a.status] || 0) + 1;
    }
    return counts;
  }, [applicationsData]);

  const totalStatusCount = applicationsData.length;
  const chartEntries = STATUS_ORDER
    .map((status) => ({
      status,
      count: statusCounts[status] || 0,
      percentage: totalStatusCount ? Math.round(((statusCounts[status] || 0) / totalStatusCount) * 100) : 0
    }))
    .filter((entry) => entry.count > 0);

  // Recent activity timeline (last 5 applications)
  const recentActivity = useMemo(
    () =>
      applicationsData.slice(0, 5).map((application) => {
        const student =
          application.studentId && typeof application.studentId !== 'string'
            ? application.studentId.name
            : 'Student';
        const job =
          application.jobId && typeof application.jobId !== 'string'
            ? application.jobId
            : null;
        const company =
          job?.companyId && typeof job.companyId !== 'string'
            ? job.companyId.name
            : '-';
        return {
          id: application._id,
          student,
          company,
          role: job?.title || '-',
          status: application.status,
          date: new Date(application.createdAt).toLocaleDateString()
        };
      }),
    [applicationsData]
  );

  const topStatus = chartEntries.reduce<{ status: string; count: number; percentage: number } | null>(
    (currentTop, entry) => {
      if (!currentTop || entry.count > currentTop.count) {
        return entry;
      }
      return currentTop;
    },
    null
  );

  // SVG donut chart data
  const donutSegments = useMemo(() => {
    const total = applicationsData.length;
    if (total === 0) return [];
    const entries = Object.entries(statusCounts).filter(([, v]) => v > 0);
    let cumulative = 0;
    return entries.map(([status, count]) => {
      const pct = (count / total) * 100;
      const segment = {
        status,
        count,
        pct,
        offset: cumulative
      };
      cumulative += pct;
      return segment;
    });
  }, [applicationsData, statusCounts]);

  const columns: Column<StudentApplication>[] = [
    { key: 'studentName', header: 'Student', sortable: true },
    { key: 'company', header: 'Company', sortable: true },
    { key: 'role', header: 'Role', sortable: true },
    { key: 'gpa', header: 'GPA', sortable: true },
    { key: 'date', header: 'Applied Date', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <StatusDot
          status={item.status}
          label={
            item.status === 'success'
              ? 'Selected'
              : item.status === 'info'
                ? 'Interview'
                : item.status === 'warning'
                  ? 'Shortlisted'
                  : item.status === 'error'
                    ? 'Rejected'
                    : 'Applied'
          }
        />
      )
    }
  ];

  if (isLoading) {
    return (
      <DashboardLayout
        userRole="admin"
        currentPath="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={{ name: user?.name || 'Admin', email: user?.email || '' }}
        breadcrumbs={[{ label: 'Dashboard' }]}
      >
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/90 px-8 py-10 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm text-slate-500">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userRole="admin"
      currentPath="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{ name: user?.name || 'Admin', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 px-6 py-7 text-white shadow-xl sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
                Admin Dashboard
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Placement Overview</h1>
                <p className="max-w-xl text-sm text-slate-200 sm:text-base">
                  Monitor applications, interviews, placements, and hiring momentum from one
                  well-structured workspace.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">Placement Rate</p>
                <p className="mt-1 text-2xl font-semibold">{placementRate}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">Applications</p>
                <p className="mt-1 text-2xl font-semibold">{reportSummary.totalApplications}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="bg-teal-500 text-white shadow-sm hover:bg-teal-400 focus:ring-teal-300"
              icon={<BarChart3 className="h-4 w-4" />}
              onClick={() => onNavigate('reports')}
            >
              View Reports
            </Button>
            <Button
              variant="ghost"
              className="border border-white/15 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              icon={<Users className="h-4 w-4" />}
              onClick={() => onNavigate('students')}
            >
              Review Students
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <Button
            variant="secondary"
            size="sm"
            icon={<Users className="h-4 w-4" />}
            onClick={() => onNavigate('students')}
          >
            Manage Students
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Building2 className="h-4 w-4" />}
            onClick={() => onNavigate('companies')}
          >
            Manage Companies
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Briefcase className="h-4 w-4" />}
            onClick={() => onNavigate('jobs')}
          >
            Job Postings
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Calendar className="h-4 w-4" />}
            onClick={() => onNavigate('interviews')}
          >
            Interviews
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<FileText className="h-4 w-4" />}
            onClick={() => onNavigate('applications')}
          >
            Applications
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            title="Total Students"
            value={String(reportSummary.totalStudents)}
            icon={<Users className="h-6 w-6" />}
            gradient="blue"
          />
          <StatCard
            title="Companies"
            value={String(companiesCount || reportSummary.totalCompanies)}
            icon={<Building2 className="h-6 w-6" />}
            gradient="purple"
          />
          <StatCard
            title="Open Jobs"
            value={String(reportSummary.openJobs || jobsCount)}
            icon={<Briefcase className="h-6 w-6" />}
            gradient="orange"
          />
          <StatCard
            title="Applications"
            value={String(reportSummary.totalApplications)}
            icon={<FileText className="h-6 w-6" />}
            gradient="blue"
          />
          <StatCard
            title="Placed Students"
            value={String(reportSummary.selectedCount)}
            icon={<CheckCircle className="h-6 w-6" />}
            gradient="teal"
            trend={{
              value: `${placementRate}%`,
              direction: placementRate > 0 ? 'up' : 'neutral'
            }}
            trendLabel="overall placement rate"
          />
          <StatCard
            title="Interviews"
            value={String(reportSummary.scheduledInterviews)}
            icon={<Calendar className="h-6 w-6" />}
            gradient="purple"
          />
        </div>

        {/* Insights Row */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Application Status Breakdown</p>
                <p className="mt-1 text-sm text-slate-500">
                  Share of all applications by current stage.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Top Status</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {topStatus ? STATUS_LABELS[topStatus.status] : 'No Data'}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Live Records</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{totalStatusCount}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {chartEntries.map((entry) => (
                <div key={entry.status} className="rounded-2xl bg-slate-50/80 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                      />
                      <span className="font-medium text-slate-700">
                        {STATUS_LABELS[entry.status]}
                      </span>
                    </div>
                    <span className="text-slate-500">
                      {entry.count} ({entry.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(entry.percentage, 6)}%`,
                        backgroundColor: STATUS_COLORS[entry.status]
                      }}
                    />
                  </div>
                </div>
              ))}
              {chartEntries.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-400">No application data yet</p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">Application Distribution</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Visual snapshot of application flow across statuses.
                </p>
              </div>
              <div className="rounded-2xl bg-teal-50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-wide text-teal-700">Interviews</p>
                <p className="mt-1 text-lg font-semibold text-teal-900">
                  {reportSummary.scheduledInterviews}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              {applicationsData.length > 0 ? (
                <div className="flex flex-col items-center gap-6 lg:flex-row">
                  <div className="relative h-44 w-44">
                    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                      {donutSegments.map((seg) => (
                        <circle
                          key={seg.status}
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke={STATUS_COLORS[seg.status]}
                          strokeWidth="3.5"
                          strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                          strokeDashoffset={`${-seg.offset}`}
                          className="transition-all duration-500"
                        />
                      ))}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-900">
                        {applicationsData.length}
                      </span>
                      <span className="text-xs text-slate-500">Total</span>
                    </div>
                  </div>
                  <div className="grid w-full gap-3">
                    {chartEntries.map((entry) => (
                      <div
                        key={entry.status}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                          />
                          <span className="text-slate-700">{STATUS_LABELS[entry.status]}</span>
                        </div>
                        <span className="font-medium text-slate-500">
                          {entry.count} apps
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-8 text-sm text-slate-400">No application data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Activity + Navigation Row */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Performance Snapshot</h3>
                <p className="mt-1 text-sm text-slate-500">
                  A quick, user-friendly summary of current platform activity.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Active Companies</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{companiesCount}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Companies currently available in the recruitment ecosystem.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Published Jobs</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{jobsCount}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Open and recently managed opportunities visible to students.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Successful Placements</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {reportSummary.selectedCount}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Confirmed selections contributing to overall placement success.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Upcoming Interviews</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {reportSummary.scheduledInterviews}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Students waiting for the next step in the hiring pipeline.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Recent Activity</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Latest updates from student applications and hiring progress.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('applications')}
              >
                View All
              </Button>
            </div>
            {recentActivity.length > 0 ? (
              <div className="relative ml-3 space-y-0 border-l border-slate-200">
                {recentActivity.map((item) => {
                  const dotColor =
                    item.status === 'Selected'
                      ? 'bg-green-500'
                      : item.status === 'Rejected'
                        ? 'bg-red-500'
                        : item.status === 'Interview Scheduled'
                          ? 'bg-blue-500'
                          : item.status === 'Shortlisted'
                            ? 'bg-purple-500'
                            : 'bg-amber-400';
                  const bgColor =
                    item.status === 'Selected'
                      ? 'bg-green-100 text-green-600'
                      : item.status === 'Rejected'
                        ? 'bg-red-100 text-red-600'
                        : item.status === 'Interview Scheduled'
                          ? 'bg-blue-100 text-blue-600'
                          : item.status === 'Shortlisted'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-yellow-100 text-yellow-600';
                  return (
                    <div key={item.id} className="relative ml-6 pb-6">
                      <span
                        className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${bgColor}`}
                      >
                        <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                      </span>
                      <h4 className="flex items-center text-sm font-semibold text-slate-900">
                        {item.student}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          {item.date}
                        </span>
                      </h4>
                      <p className="text-sm text-slate-600">
                        {item.role} at {item.company}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{item.status}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center">
                <div className="text-center">
                  <Clock className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-400">No recent activity</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Applications Table */}
        <DataTable
          title="Recent Applications"
          data={applications}
          columns={columns}
          keyField="id"
          actions={(_item) => (
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
                  variant: 'danger' as const,
                  onClick: () => onNavigate('applications')
                }
              ]}
              trigger={
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              }
            />
          )}
          bulkActions={[]}
        />
      </div>
    </DashboardLayout>
  );
}

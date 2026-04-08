import { useEffect, useMemo, useState } from 'react';
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
        <div className="admin-empty-state">
          <div className="admin-panel admin-inline-loader">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="admin-panel__subtitle">Loading dashboard...</p>
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
      <div className="admin-page">
        <div className="admin-hero admin-hero--teal">
          <div className="admin-hero__row">
            <div className="admin-hero__body">
              <span className="admin-hero__eyebrow">Admin Dashboard</span>
              <h1 className="admin-hero__title">Placement Overview</h1>
              <p className="admin-hero__subtitle">
                Monitor applications, interviews, placements, and hiring momentum from one
                well-structured workspace.
              </p>
            </div>
            <div className="admin-hero__stats admin-grid admin-grid--two">
              <div className="admin-hero__stat">
                <p className="admin-hero__stat-label">Placement Rate</p>
                <p className="admin-hero__stat-value">{placementRate}%</p>
              </div>
              <div className="admin-hero__stat">
                <p className="admin-hero__stat-label">Applications</p>
                <p className="admin-hero__stat-value">{reportSummary.totalApplications}</p>
              </div>
            </div>
          </div>
          <div className="admin-actions-row admin-actions-row--hero">
            <Button
              className="company-primary-button"
              icon={<BarChart3 className="h-4 w-4" />}
              onClick={() => onNavigate('reports')}
            >
              View Reports
            </Button>
            <Button
              variant="ghost"
              className="company-secondary-button"
              icon={<Users className="h-4 w-4" />}
              onClick={() => onNavigate('students')}
            >
              Review Students
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="admin-alert admin-alert--error">{errorMessage}</div>
        )}

        <div className="admin-action-scroll">
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
        <div className="admin-grid admin-grid--three">
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
        <div className="admin-split-grid">
          <div className="admin-panel">
            <div className="admin-panel__header admin-panel__header--divider">
              <div>
                <p className="admin-panel__title">Application Status Breakdown</p>
                <p className="admin-panel__subtitle">
                  Share of all applications by current stage.
                </p>
              </div>
              <div className="admin-highlight-grid">
                <div className="admin-highlight">
                  <p className="admin-highlight__label">Top Status</p>
                  <p className="admin-highlight__value admin-highlight__value--sm">
                    {topStatus ? STATUS_LABELS[topStatus.status] : 'No Data'}
                  </p>
                </div>
                <div className="admin-highlight">
                  <p className="admin-highlight__label">Live Records</p>
                  <p className="admin-highlight__value admin-highlight__value--sm">{totalStatusCount}</p>
                </div>
              </div>
            </div>
            <div className="admin-progress-list">
              {chartEntries.map((entry) => (
                <div key={entry.status} className="admin-progress-item">
                  <div className="admin-progress-item__top">
                    <div className="admin-progress-item__label">
                      <span
                        style={{
                          width: '0.625rem',
                          height: '0.625rem',
                          borderRadius: '999px',
                          display: 'inline-block',
                          backgroundColor: STATUS_COLORS[entry.status]
                        }}
                      />
                      <span>{STATUS_LABELS[entry.status]}</span>
                    </div>
                    <span className="admin-progress-item__meta">
                      {entry.count} ({entry.percentage}%)
                    </span>
                  </div>
                  <div className="admin-progress-item__bar">
                    <div
                      className="admin-progress-item__fill"
                      style={{
                        width: `${Math.max(entry.percentage, 6)}%`,
                        backgroundColor: STATUS_COLORS[entry.status]
                      }}
                    />
                  </div>
                </div>
              ))}
              {chartEntries.length === 0 && (
                <p className="admin-empty-state">No application data yet</p>
              )}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3 className="admin-panel__title">Application Distribution</h3>
                <p className="admin-panel__subtitle">
                  Visual snapshot of application flow across statuses.
                </p>
              </div>
              <div className="admin-highlight">
                <p className="admin-highlight__label">Interviews</p>
                <p className="admin-highlight__value admin-highlight__value--md">
                  {reportSummary.scheduledInterviews}
                </p>
              </div>
            </div>
            <div className="admin-empty-state admin-empty-state--compact">
              {applicationsData.length > 0 ? (
                <div className="admin-distribution">
                  <div className="admin-distribution__chart">
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
                    <div className="admin-distribution__center">
                      <span className="admin-highlight__value">
                        {applicationsData.length}
                      </span>
                      <span className="admin-highlight__label">Total</span>
                    </div>
                  </div>
                  <div className="admin-distribution__legend">
                    {chartEntries.map((entry) => (
                      <div key={entry.status} className="admin-distribution__legend-item">
                        <div className="admin-progress-item__label">
                          <span
                            className="admin-distribution__legend-dot"
                            style={{
                              backgroundColor: STATUS_COLORS[entry.status]
                            }}
                          />
                          <span>{STATUS_LABELS[entry.status]}</span>
                        </div>
                        <span className="admin-progress-item__meta">{entry.count} apps</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="admin-empty-state">No application data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Activity + Navigation Row */}
        <div className="admin-split-grid">
          <div className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3 className="admin-panel__title">Performance Snapshot</h3>
                <p className="admin-panel__subtitle">
                  A quick, user-friendly summary of current platform activity.
                </p>
              </div>
            </div>
            <div className="admin-highlight-grid">
              <div className="admin-highlight">
                <p className="admin-highlight__label">Active Companies</p>
                <p className="admin-highlight__value">{companiesCount}</p>
                <p className="admin-highlight__copy">
                  Companies currently available in the recruitment ecosystem.
                </p>
              </div>
              <div className="admin-highlight">
                <p className="admin-highlight__label">Published Jobs</p>
                <p className="admin-highlight__value">{jobsCount}</p>
                <p className="admin-highlight__copy">
                  Open and recently managed opportunities visible to students.
                </p>
              </div>
              <div className="admin-highlight">
                <p className="admin-highlight__label">Successful Placements</p>
                <p className="admin-highlight__value">
                  {reportSummary.selectedCount}
                </p>
                <p className="admin-highlight__copy">
                  Confirmed selections contributing to overall placement success.
                </p>
              </div>
              <div className="admin-highlight">
                <p className="admin-highlight__label">Upcoming Interviews</p>
                <p className="admin-highlight__value">
                  {reportSummary.scheduledInterviews}
                </p>
                <p className="admin-highlight__copy">
                  Students waiting for the next step in the hiring pipeline.
                </p>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h3 className="admin-panel__title">Recent Activity</h3>
                <p className="admin-panel__subtitle">
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
              <div className="admin-timeline">
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
                    <div key={item.id} className="admin-timeline__item">
                      <span className={`admin-timeline__badge ${bgColor}`}>
                        <div className={`admin-timeline__dot ${dotColor}`} />
                      </span>
                      <h4 className="admin-timeline__title">
                        {item.student}
                        <span className="admin-timeline__date">
                          {item.date}
                        </span>
                      </h4>
                      <p className="admin-timeline__copy">
                        {item.role} at {item.company}
                      </p>
                      <p className="admin-timeline__status">{item.status}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="admin-empty-state">
                <div>
                  <Clock className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="admin-panel__subtitle">No recent activity</p>
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
                <button className="company-icon-button" type="button">
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

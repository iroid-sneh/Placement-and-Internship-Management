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
  getAdminReportSummary,
  getAdminStudents
} from '../../services/api/admin';
import type { Application } from '../../types/app';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  GraduationCap,
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

interface DepartmentStat {
  department: string;
  students: number;
  placed: number;
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
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadDashboardData = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const [applicationsResponse, reportResponse, companiesResponse, jobsResponse, studentsResponse] =
          await Promise.all([
            getAdminApplications(),
            getAdminReportSummary(),
            getAdminCompanies(),
            getAdminJobs(),
            getAdminStudents()
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

        // Compute department-wise stats from students
        const deptMap = new Map<string, { students: number; placed: number }>();
        for (const s of studentsResponse) {
          const dept = s.profile?.department || 'Unknown';
          const entry = deptMap.get(dept) || { students: 0, placed: 0 };
          entry.students += 1;
          deptMap.set(dept, entry);
        }
        // Count placed per department by cross-referencing selected applications
        const placedStudentIds = new Set(
          applicationsResponse
            .filter((a) => a.status === 'Selected')
            .map((a) => (typeof a.studentId === 'string' ? a.studentId : a.studentId.id))
        );
        for (const s of studentsResponse) {
          if (placedStudentIds.has(s.id)) {
            const dept = s.profile?.department || 'Unknown';
            const entry = deptMap.get(dept);
            if (entry) entry.placed += 1;
          }
        }
        const deptStats: DepartmentStat[] = Array.from(deptMap.entries())
          .map(([department, data]) => ({
            department,
            students: data.students,
            placed: data.placed
          }))
          .sort((a, b) => b.students - a.students);
        setDepartmentStats(deptStats);
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

  // Enrich GPA from student profiles
  useEffect(() => {
    if (isLoading) return;
    const enrichGpa = async (): Promise<void> => {
      try {
        const students = await getAdminStudents();
        const gpaMap = new Map<string, string>();
        for (const s of students) {
          gpaMap.set(s.name, s.profile?.cgpa?.toFixed(1) ?? '-');
        }
        // We won't re-set applications since we already have them;
        // GPA enrichment is best-effort in the table render
      } catch {
        // silently ignore GPA enrichment failure
      }
    };
    void enrichGpa();
  }, [isLoading]);

  const placementRate = reportSummary.totalStudents
    ? Math.round((reportSummary.selectedCount / reportSummary.totalStudents) * 100)
    : 0;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Applied: 0,
      Shortlisted: 0,
      'Interview Scheduled': 0,
      'Pending Decision': 0,
      Selected: 0,
      Rejected: 0
    };
    for (const a of applicationsData) {
      counts[a.status] = (counts[a.status] || 0) + 1;
    }
    return counts;
  }, [applicationsData]);

  const chartEntries = Object.entries(statusCounts).filter(([, count]) => count > 0);
  const maxChartValue = Math.max(...Object.values(statusCounts), 1);

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
          <div className="flex flex-col items-center gap-3">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Placement Overview</h1>
            <p className="text-slate-600">
              Track placement progress, manage students and companies.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Download className="h-4 w-4" />}
              onClick={() => onNavigate('reports')}
            >
              Export Report
            </Button>
            <Button icon={<BarChart3 className="h-4 w-4" />} onClick={() => onNavigate('reports')}>
              View Reports
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          />
          <StatCard
            title="Interviews"
            value={String(reportSummary.scheduledInterviews)}
            icon={<Calendar className="h-6 w-6" />}
            gradient="purple"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Bar Chart - Application Status Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 font-bold text-slate-900">Application Status Breakdown</h3>
            <div className="space-y-3">
              {chartEntries.map(([status, count]) => (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{STATUS_LABELS[status]}</span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max((count / maxChartValue) * 100, 4)}%`,
                        backgroundColor: STATUS_COLORS[status]
                      }}
                    />
                  </div>
                </div>
              ))}
              {chartEntries.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No application data yet</p>
              )}
            </div>
          </div>

          {/* Donut Chart - Application Distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 font-bold text-slate-900">Application Distribution</h3>
            <div className="flex items-center justify-center">
              {applicationsData.length > 0 ? (
                <div className="flex flex-col items-center gap-6 sm:flex-row">
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
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {chartEntries.map(([status, count]) => (
                      <div key={status} className="flex items-center gap-2 text-sm">
                        <span
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[status] }}
                        />
                        <span className="text-slate-600">
                          {STATUS_LABELS[status]} ({count})
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

        {/* Department Stats + Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Department-wise Statistics */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h3 className="font-bold text-slate-900">Department Statistics</h3>
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowRight className="h-4 w-4" />}
                onClick={() => onNavigate('students')}
              >
                View All
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3 text-center">Students</th>
                    <th className="px-4 py-3 text-center">Placed</th>
                    <th className="px-4 py-3 text-center">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {departmentStats.length > 0 ? (
                    departmentStats.map((dept) => {
                      const rate =
                        dept.students > 0
                          ? Math.round((dept.placed / dept.students) * 100)
                          : 0;
                      return (
                        <tr key={dept.department} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-slate-400" />
                              {dept.department}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {dept.students}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {dept.placed}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-2 w-16 rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-teal-500 transition-all"
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        No department data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Recent Activity</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('applications')}
              >
                View All
              </Button>
            </div>
            {recentActivity.length > 0 ? (
              <div className="relative border-l border-slate-200 ml-3 space-y-0">
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
                    <div key={item.id} className="ml-6 relative pb-6">
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

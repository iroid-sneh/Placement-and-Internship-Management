import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import {
  Download,
  Users,
  Building2,
  CheckCircle,
  FileSpreadsheet,
  Sparkles,
  TrendingUp } from
'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAdminReportSummary, type ReportSummary, type ReportStudent } from '../../services/api/admin';
interface PlacementReportsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
export function PlacementReports({
  onNavigate,
  onLogout
}: PlacementReportsProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReportSummary>({
    totalStudents: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    selectedCount: 0,
    openJobs: 0,
    scheduledInterviews: 0,
    students: []
  });
  const [students, setStudents] = useState<ReportStudent[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const loadSummary = async (): Promise<void> => {
      try {
        const response = await getAdminReportSummary();
        setSummary(response);
        setStudents(response.students || []);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load report');
      }
    };
    void loadSummary();
  }, []);

  const placementPercentage =
    summary.totalStudents > 0 ? Math.round((summary.selectedCount / summary.totalStudents) * 100) : 0;
  const unplacedCount = Math.max(summary.totalStudents - summary.selectedCount, 0);

  const handleExportReport = (): void => {
    const summaryRows = [
      ['Metric', 'Value'],
      ['Total Students', String(summary.totalStudents)],
      ['Students Placed', String(summary.selectedCount)],
      ['Placement Percentage', `${placementPercentage}%`],
      ['Companies Visited', String(summary.totalCompanies)],
      ['Total Jobs', String(summary.totalJobs)],
      ['Open Jobs', String(summary.openJobs)],
      ['Total Applications', String(summary.totalApplications)],
      ['Scheduled Interviews', String(summary.scheduledInterviews)]
    ];

    const studentRows = [
      ['Name', 'Email', 'Department', 'CGPA', 'Skills'],
      ...students.map((student) => [
        student.name,
        student.email,
        student.department,
        String(student.cgpa),
        student.skills.join(', ')
      ])
    ];

    const sections = [
      'Placement Summary',
      ...summaryRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
      '',
      'Students Overview',
      ...studentRows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    ];

    const blob = new Blob([sections.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'placement-report.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <DashboardLayout
      userRole="admin"
      currentPath="reports"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Admin',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'Placement Reports'
      }]
      }>

      <div className="space-y-8">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Placement Reports
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Performance Insights</h1>
                <p className="mt-2 text-sm text-slate-200 sm:text-base">
                  Track placement outcomes, monitor active hiring, and export a clean report snapshot for the current academic cycle.
                </p>
              </div>
            </div>
            <Button
              className="h-12 rounded-2xl border border-white/15 bg-white/10 px-5 text-white shadow-none backdrop-blur hover:bg-white/15"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportReport}
            >
              Export Report
            </Button>
          </div>
        </div>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Placement Rate</p>
                <p className="text-2xl font-bold text-slate-900">{placementPercentage}%</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Applications</p>
                <p className="text-2xl font-bold text-slate-900">{summary.totalApplications}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Unplaced Students</p>
                <p className="text-2xl font-bold text-slate-900">{unplacedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={String(summary.totalStudents)}
            icon={<Users className="h-6 w-6" />}
            gradient="blue" />

          <StatCard
            title="Students Placed"
            value={String(summary.selectedCount)}
            icon={<CheckCircle className="h-6 w-6" />}
            gradient="teal"
            trend={{
              value: `${placementPercentage}%`,
              direction: 'up'
            }} />

          <StatCard
            title="Companies Visited"
            value={String(summary.totalCompanies)}
            icon={<Building2 className="h-6 w-6" />}
            gradient="purple" />

          <StatCard
            title="Open Jobs"
            value={String(summary.openJobs)}
            icon={<TrendingUp className="h-6 w-6" />}
            gradient="orange" />

        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">
              Company-wise Placements
            </h3>
            <div className="space-y-4">
              {[{
                id: '1',
                company: 'Applications',
                hired: summary.totalApplications
              },
              {
                id: '2',
                company: 'Selected',
                hired: summary.selectedCount
              },
              {
                id: '3',
                company: 'Open Jobs',
                hired: summary.openJobs
              }].map((item) =>
              <div key={item.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">
                      {item.company}
                    </span>
                    <span className="text-slate-500">
                      {item.hired}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                    className="bg-teal-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${summary.totalApplications > 0 ? item.hired / summary.totalApplications * 100 : 0}%`
                    }}>
                  </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Placement Ring Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">
              Placement Distribution
            </h3>
            <div className="flex items-center justify-center h-48">
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 36 36" className="h-full w-full">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3" />

                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="3"
                    strokeDasharray={`${placementPercentage}, 100`} />

                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">{placementPercentage}%</span>
                  <span className="text-sm text-slate-500">Placed</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-teal-500"></span>
                <span className="text-slate-600">Placed ({summary.selectedCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-200"></span>
                <span className="text-slate-600">Unplaced ({unplacedCount})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">
              Basic Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">Total Jobs</td><td className="px-4 py-3">{summary.totalJobs}</td></tr>
                <tr className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">Total Applications</td><td className="px-4 py-3">{summary.totalApplications}</td></tr>
                <tr className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">Scheduled Interviews</td><td className="px-4 py-3">{summary.scheduledInterviews}</td></tr>
                <tr className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">Placement Percentage</td><td className="px-4 py-3">{placementPercentage}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Table with Skills */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">
              Students Overview
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              All registered students with their skills.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">CGPA</th>
                  <th className="px-4 py-3">Skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
                      <td className="px-4 py-3 text-slate-600">{student.department}</td>
                      <td className="px-4 py-3 text-slate-600">{student.cgpa}</td>
                      <td className="px-4 py-3">
                        {student.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {student.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">No skills listed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>);

}

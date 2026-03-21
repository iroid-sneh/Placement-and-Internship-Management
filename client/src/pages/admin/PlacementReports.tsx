import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import {
  Download,
  Users,
  Building2,
  CheckCircle,
  TrendingUp } from
'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAdminReportSummary, type ReportSummary } from '../../services/api/admin';
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
    openJobs: 0
  });
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const loadSummary = async (): Promise<void> => {
      try {
        const response = await getAdminReportSummary();
        setSummary(response);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load report');
      }
    };
    void loadSummary();
  }, []);

  const placementPercentage =
    summary.totalStudents > 0 ? Math.round((summary.selectedCount / summary.totalStudents) * 100) : 0;

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Placement Reports
            </h1>
            <p className="text-slate-600">
              Academic Year 2025-2026 placement statistics.
            </p>
          </div>
          <Button icon={<Download className="h-4 w-4" />}>Export Report</Button>
        </div>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

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
                <span className="text-slate-600">Unplaced ({Math.max(summary.totalStudents - summary.selectedCount, 0)})</span>
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
                <tr className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">Placement Percentage</td><td className="px-4 py-3">{placementPercentage}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>);

}
import { useEffect, useState } from 'react';
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
import {
  getAdminApplications,
  getAdminReportSummary,
  type ReportSummary,
  type ReportStudent
} from '../../services/api/admin';
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
  const [companyPlacements, setCompanyPlacements] = useState<{ company: string; hired: number }[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const loadSummary = async (): Promise<void> => {
      try {
        const [response, applications] = await Promise.all([
          getAdminReportSummary(),
          getAdminApplications()
        ]);
        setSummary(response);
        setStudents(response.students || []);
        const placementsMap = new Map<string, number>();
        applications.forEach((application) => {
          if (application.status !== 'Selected') return;
          const job = application.jobId && typeof application.jobId !== 'string' ? application.jobId : null;
          const companyName =
            job?.companyId && typeof job.companyId !== 'string'
              ? job.companyId.name
              : 'Unknown Company';
          placementsMap.set(companyName, (placementsMap.get(companyName) || 0) + 1);
        });
        setCompanyPlacements(
          Array.from(placementsMap.entries())
            .map(([company, hired]) => ({ company, hired }))
            .sort((a, b) => b.hired - a.hired)
            .slice(0, 6)
        );
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

      <div className="admin-page">
        <div className="admin-hero admin-hero--emerald">
          <div className="admin-hero__row">
            <div className="admin-hero__body">
              <span className="admin-hero__eyebrow">Placement Reports</span>
              <h1 className="admin-hero__title">Performance Insights</h1>
              <p className="admin-hero__subtitle">
                Track placement outcomes, monitor active hiring, and export a clean report snapshot for the current academic cycle.
              </p>
            </div>
            <Button
              className="company-secondary-button"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportReport}
            >
              Export Report
            </Button>
          </div>
        </div>
        {errorMessage && <div className="admin-alert admin-alert--error">{errorMessage}</div>}

        <div className="admin-stat-grid admin-grid admin-grid--three">
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--emerald">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Placement Rate</p>
                <p className="admin-stat-card__value">{placementPercentage}%</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--sky">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Applications</p>
                <p className="admin-stat-card__value">{summary.totalApplications}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--amber">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Unplaced Students</p>
                <p className="admin-stat-card__value">{unplacedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="admin-grid admin-grid--four">
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
        <div className="admin-split-grid">
          <div className="admin-panel">
            <h3 className="admin-panel__title">Company-wise Placements</h3>
            <div className="admin-progress-list admin-progress-list--spaced">
              {companyPlacements.length === 0 ? (
                <div className="admin-note">
                  No company placement data available yet.
                </div>
              ) : companyPlacements.map((item) =>
              <div key={item.company} className="admin-progress-item">
                  <div className="admin-progress-item__top">
                    <span className="admin-progress-item__label">
                      {item.company}
                    </span>
                    <span className="admin-progress-item__meta">
                      {item.hired}
                    </span>
                  </div>
                  <div className="admin-progress-item__bar">
                    <div
                      className="admin-progress-item__fill"
                      style={{
                        width: `${summary.selectedCount > 0 ? (item.hired / summary.selectedCount) * 100 : 0}%`,
                        backgroundColor: '#14b8a6'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="admin-panel">
            <h3 className="admin-panel__title">Placement Distribution</h3>
            <div className="admin-chart-placeholder">
              <div className="admin-chart-ring-wrap">
                <svg viewBox="0 0 36 36" className="h-full w-full">
                  <path
                    className="admin-chart-ring__track"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                  />

                  <path
                    className="admin-chart-ring__fill"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                    strokeDasharray={`${placementPercentage}, 100`}
                  />

                </svg>
                <div className="admin-chart-ring-center">
                  <span className="admin-highlight__value">{placementPercentage}%</span>
                  <span className="admin-highlight__label">Placed</span>
                </div>
              </div>
            </div>
            <div className="admin-actions-row admin-actions-row--center">
              <div className="admin-progress-item__label">
                <span className="admin-legend-dot admin-legend-dot--placed" />
                <span>Placed ({summary.selectedCount})</span>
              </div>
              <div className="admin-progress-item__label">
                <span className="admin-legend-dot admin-legend-dot--unplaced" />
                <span>Unplaced ({unplacedCount})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-card__header">
            <h3 className="admin-panel__title">Basic Summary</h3>
          </div>
          <div className="admin-table-card__scroll">
            <table className="admin-table-card__table">
              <thead className="admin-table-card__head">
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Total Jobs</strong></td><td>{summary.totalJobs}</td></tr>
                <tr><td><strong>Total Applications</strong></td><td>{summary.totalApplications}</td></tr>
                <tr><td><strong>Scheduled Interviews</strong></td><td>{summary.scheduledInterviews}</td></tr>
                <tr><td><strong>Placement Percentage</strong></td><td>{placementPercentage}%</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Table with Skills */}
        <div className="admin-table-card">
          <div className="admin-table-card__header">
            <h3 className="admin-panel__title">Students Overview</h3>
            <p className="admin-panel__subtitle">
              All registered students with their skills.
            </p>
          </div>
          <div className="admin-table-card__scroll">
            <table className="admin-table-card__table">
              <thead className="admin-table-card__head">
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>CGPA</th>
                  <th>Skills</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-empty-state">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td><strong>{student.name}</strong></td>
                      <td>{student.department}</td>
                      <td>{student.cgpa}</td>
                      <td>
                        {student.skills.length > 0 ? (
                          <div className="admin-table-card__skills">
                            {student.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="admin-pill admin-pill--resume"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="admin-panel__subtitle">No skills listed</span>
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

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import {
  Eye,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  SlidersHorizontal,
  X } from
'lucide-react';
import { getStudentApplications } from '../../services/api/student';
import { useAuth } from '../../context/AuthContext';
import type { Application } from '../../types/app';

interface MyApplicationsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

type StatusFilter =
  | ''
  | 'Applied'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Pending Decision'
  | 'Selected'
  | 'Rejected';

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All Status', value: '' },
  { label: 'Applied', value: 'Applied' },
  { label: 'Shortlisted', value: 'Shortlisted' },
  { label: 'Interview Scheduled', value: 'Interview Scheduled' },
  { label: 'Pending Decision', value: 'Pending Decision' },
  { label: 'Selected', value: 'Selected' },
  { label: 'Rejected', value: 'Rejected' }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Selected':
      return 'student-status-badge--selected';
    case 'Shortlisted':
      return 'student-status-badge--shortlisted';
    case 'Interview Scheduled':
      return 'student-status-badge--interview';
    case 'Pending Decision':
      return 'student-status-badge--pending';
    case 'Rejected':
      return 'student-status-badge--rejected';
    default:
      return 'student-status-badge--default';
  }
};

export function MyApplications({ onNavigate, onLogout }: MyApplicationsProps) {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const applicationsResponse = await getStudentApplications();
        setApplications(applicationsResponse);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, []);

  const filteredApplications = useMemo(
    () =>
      applications.filter((item) => {
        const job = typeof item.jobId === 'string' ? null : item.jobId;
        const matchStatus = !statusFilter || item.status === statusFilter;
        const matchType = !typeFilter || (job && job.type === typeFilter);
        return matchStatus && matchType;
      }),
    [applications, statusFilter, typeFilter]
  );

  const pendingDecisionCount = useMemo(
    () => applications.filter((a) => a.status === 'Pending Decision').length,
    [applications]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (typeFilter) count++;
    return count;
  }, [statusFilter, typeFilter]);

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
  };

  const handleViewDetails = (application: Application): void => {
    const job = typeof application.jobId === 'string' ? null : application.jobId;
    if (job) {
      onNavigate(`jobs/${job._id}`);
    }
  };

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
        { label: 'My Applications' }
      ]}
    >
      <div className="student-page">
        <div className="student-page__header">
          <div>
            <h1 className="student-page__title">My Applications</h1>
            <p className="student-page__subtitle">
              Track the status of your job applications.
            </p>
          </div>
          <div className="student-page__actions">
            <Button variant="outline" onClick={() => onNavigate('jobs')}>
              Browse Jobs
            </Button>
          </div>
        </div>

        {pendingDecisionCount > 0 && (
          <div className="student-alert student-alert--warning">
            {pendingDecisionCount} of your interview{pendingDecisionCount === 1 ? ' has' : 's have'} passed.
            The company will update the result soon. Awaiting final decision.
          </div>
        )}

        {errorMessage && (
          <div className="student-alert student-alert--error">
            {errorMessage}
          </div>
        )}

        <div className="student-filter-bar">
          <div className="student-filter-bar__row">
            <div className="student-page__actions">
              <h2 className="student-card__title">
                {filteredApplications.length} Application{filteredApplications.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`student-filter-toggle ${
                  showFilters || activeFilterCount > 0
                    ? 'student-filter-toggle--active'
                    : ''
                }`}
              >
                <SlidersHorizontal />
                Filters
                {activeFilterCount > 0 && (
                  <span className="student-badge student-badge--progress">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div className="student-page__actions">
              {STATUS_OPTIONS.slice(0, 5).map((opt) => {
                const count = opt.value
                  ? applications.filter((a) => a.status === opt.value).length
                  : applications.length;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(statusFilter === opt.value ? '' : opt.value)}
                    className={`student-chip ${
                      statusFilter === opt.value
                        ? 'student-chip--active'
                        : ''
                    }`}
                  >
                    {opt.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {showFilters && (
            <div className="student-form-section">
              <div className="student-grid student-grid--filters">
                <div>
                  <label className="student-card__section-label">
                    Application Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="student-select"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="student-card__section-label">
                    Job Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="student-select"
                  >
                    <option value="">All Types</option>
                    <option value="Internship">Internship</option>
                    <option value="Job">Job</option>
                  </select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="student-page__actions">
                  <button
                    onClick={clearFilters}
                    className="student-inline-button"
                  >
                    <span className="student-icon-inline"><X /> Clear filters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="student-card student-results-empty">
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="student-card student-results-empty">
            <p className="student-card__title">No applications found</p>
            <p className="student-page__subtitle">
              {activeFilterCount > 0
                ? 'Try adjusting your filters.'
                : 'Start applying to jobs to see them here.'}
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
            {activeFilterCount === 0 && (
              <Button className="mt-4" onClick={() => onNavigate('jobs')}>
                Browse Jobs
              </Button>
            )}
          </div>
        ) : (
          <div className="student-page">
            {filteredApplications.map((item) => {
              const job = typeof item.jobId === 'string' ? null : item.jobId;
              const company = job && typeof job.companyId !== 'string' ? job.companyId.name : 'Company';
              const location = job && typeof job.companyId !== 'string' ? job.companyId.location : '-';
              const statusBadge = getStatusBadge(item.status);
              const appliedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={item._id}
                  className="student-application-card"
                >
                  <div className="student-application-card__row">
                    <div className="student-application-card__company">
                      <div className="student-application-card__logo">
                        {company.charAt(0).toUpperCase()}
                      </div>
                      <div className="student-flex-grow">
                        <h3 className="student-card__title">
                          {job?.title || 'Unknown Position'}
                        </h3>
                        <div className="student-application-card__meta">
                          <span className="student-icon-inline">
                            <Building2 className="h-3.5 w-3.5" />
                            {company}
                          </span>
                          <span className="student-icon-inline">
                            <MapPin className="h-3.5 w-3.5" />
                            {location}
                          </span>
                          <span className="student-icon-inline">
                            <Briefcase className="h-3.5 w-3.5" />
                            {job?.type || '-'}
                          </span>
                          <span className="student-icon-inline">
                            <Calendar className="h-3.5 w-3.5" />
                            Applied {appliedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="student-page__actions">
                      <span
                        className={`student-badge ${statusBadge}`}
                      >
                        {item.status}
                      </span>

                      <div className="student-page__actions">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="h-4 w-4" />}
                          onClick={() => handleViewDetails(item)}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>

                  {item.interviewDate && item.status === 'Interview Scheduled' && (
                    <div className="student-page__subtitle">
                      <div className="student-badge student-badge--progress">
                        <Calendar className="h-4 w-4" />
                        Interview on {new Date(item.interviewDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import {
  Search,
  MapPin,
  IndianRupee,
  Clock,
  SlidersHorizontal,
  X } from
'lucide-react';
import { applyForJob, getStudentJobs, getStudentApplications } from '../../services/api/student';
import { useAuth } from '../../context/AuthContext';
import type { Job } from '../../types/app';

interface BrowseJobsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const DEADLINE_OPTIONS = [
  { label: 'Any Deadline', value: '' },
  { label: 'Closing in 3 days', value: '3' },
  { label: 'Closing in 7 days', value: '7' },
  { label: 'Closing this month', value: '30' }
];

export function BrowseJobs({ onNavigate, onLogout }: BrowseJobsProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async (): Promise<void> => {
      try {
        const [jobsResponse, applicationsResponse] = await Promise.all([
          getStudentJobs(),
          getStudentApplications()
        ]);
        setJobs(jobsResponse);
        setAppliedJobIds(
          new Set(
            applicationsResponse.map((a) =>
              typeof a.jobId === 'string' ? a.jobId : a.jobId._id
            )
          )
        );
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    };
    void loadJobs();
  }, []);

  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    jobs.forEach((job) => {
      const loc = typeof job.companyId === 'string' ? '' : job.companyId.location;
      if (loc) locations.add(loc);
    });
    return Array.from(locations).sort();
  }, [jobs]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter) count++;
    if (locationFilter) count++;
    if (deadlineFilter) count++;
    return count;
  }, [typeFilter, locationFilter, deadlineFilter]);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const companyName = typeof job.companyId === 'string' ? '' : job.companyId.name;
        const location = typeof job.companyId === 'string' ? '' : job.companyId.location;

        const matchSearch = `${job.title} ${companyName}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = !typeFilter || job.type === typeFilter;
        const matchLocation = !locationFilter || location === locationFilter;

        let matchDeadline = true;
        if (deadlineFilter) {
          const now = new Date();
          const deadline = new Date(job.lastDate);
          const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const maxDays = Number(deadlineFilter);
          matchDeadline = diffDays >= 0 && diffDays <= maxDays;
        }

        return matchSearch && matchType && matchLocation && matchDeadline;
      }),
    [jobs, searchTerm, typeFilter, locationFilter, deadlineFilter]
  );

  const clearFilters = () => {
    setTypeFilter('');
    setLocationFilter('');
    setDeadlineFilter('');
  };

  const handleApply = async (jobId: string): Promise<void> => {
    setApplyingJobId(jobId);
    setErrorMessage('');
    try {
      await applyForJob(jobId);
      setAppliedJobIds((prev) => new Set(prev).add(jobId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to apply');
    } finally {
      setApplyingJobId(null);
    }
  };

  const getInrText = (value: string): string => {
    if (!value) return 'Not specified';
    if (value.toLowerCase().includes('inr') || value.includes('₹')) return value;
    return `INR ${value}`;
  };

  const getDaysLeft = (lastDate: string): number => {
    const now = new Date();
    const deadline = new Date(lastDate);
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <DashboardLayout
      userRole="student"
      currentPath="jobs"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Student',
        email: user?.email || ''
      }}
      breadcrumbs={[
        { label: 'Browse Jobs' }
      ]}
    >
      <div className="student-page">
        <div className="student-page__header">
          <div>
            <h1 className="student-page__title">
              Browse Jobs &amp; Internships
            </h1>
            <p className="student-page__subtitle">
              Find your next opportunity from top companies.
            </p>
          </div>
          <Button onClick={() => onNavigate('applications')}>
            View My Applications
          </Button>
        </div>

        {errorMessage && (
          <div className="student-alert student-alert--error">
            {errorMessage}
          </div>
        )}

        <div className="student-filter-bar">
          <div className="student-filter-bar__row">
            <div className="student-search">
              <Search className="student-search__icon" />
              <input
                type="text"
                placeholder="Search by role or company..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="student-input student-search__input"
              />
            </div>
            <div className="student-page__actions">
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
          </div>

          {showFilters && (
            <div className="student-form-section">
              <div className="student-grid student-grid--filters">
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

                <div>
                  <label className="student-card__section-label">
                    Location
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="student-select"
                  >
                    <option value="">All Locations</option>
                    {uniqueLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="student-card__section-label">
                    Application Deadline
                  </label>
                  <select
                    value={deadlineFilter}
                    onChange={(e) => setDeadlineFilter(e.target.value)}
                    className="student-select"
                  >
                    {DEADLINE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="student-card__title-row">
                  <p className="student-page__subtitle">
                    {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={clearFilters}
                    className="student-inline-button"
                  >
                    <span className="student-icon-inline"><X /> Clear all filters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="student-card student-card--padded">
            Loading jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="student-card student-results-empty">
            <p className="student-card__title">No jobs found</p>
            <p className="student-page__subtitle">
              Try adjusting your search or filters.
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="student-grid student-grid--cards">
            {filteredJobs.map((job) => {
              const location = typeof job.companyId === 'string' ? '-' : job.companyId.location;
              const companyName = typeof job.companyId === 'string' ? 'Company' : job.companyId.name;
              const daysLeft = getDaysLeft(job.lastDate);
              const isUrgent = daysLeft <= 3 && daysLeft >= 0;
              const alreadyApplied = appliedJobIds.has(job._id);

              return (
                <div
                  key={job._id}
                  className="student-job-card"
                >
                  <div className="student-card__title-row">
                    <div className="student-job-card__logo">
                      {companyName.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`student-badge ${
                        job.type === 'Internship'
                          ? 'student-job-card__feedback--success'
                          : 'student-badge--progress'
                      }`}
                    >
                      {job.type}
                    </span>
                  </div>

                  <div className="student-flex-grow">
                    <h3 className="student-card__title">
                      {job.title}
                    </h3>
                    <p className="student-page__subtitle">{companyName}</p>
                    <p className="student-job-card__meta">
                      <MapPin className="h-3.5 w-3.5" />
                      {location}
                      <span>|</span>
                      {job.type}
                      {job.jobMode && (
                        <>
                          <span>|</span>
                          {job.jobMode}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="student-job-card__meta">
                    <div className="student-job-card__meta-item">
                      <IndianRupee className="h-4 w-4" />
                      {getInrText(job.packageOrStipend)}
                    </div>
                    <div className="student-job-card__meta-item">
                      <Clock className="h-4 w-4" />
                      {isUrgent ? (
                        <span>
                          Closing in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span>Closes {new Date(job.lastDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="student-job-card__actions">
                    <Button
                      className="student-flex-grow"
                      variant="outline"
                      onClick={() => onNavigate(`jobs/${job._id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      className="student-flex-grow"
                      onClick={() => handleApply(job._id)}
                      isLoading={applyingJobId === job._id}
                      disabled={alreadyApplied || applyingJobId === job._id}
                    >
                      {alreadyApplied ? 'Applied' : 'Apply Now'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Browse Jobs &amp; Internships
            </h1>
            <p className="text-slate-600">
              Find your next opportunity from top companies.
            </p>
          </div>
          <Button onClick={() => onNavigate('applications')}>
            View My Applications
          </Button>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by role or company..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-11 inline-flex items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="border-t border-slate-200 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Job Type */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Job Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="Internship">Internship</option>
                    <option value="Job">Job</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Location
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  >
                    <option value="">All Locations</option>
                    {uniqueLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Application Deadline
                  </label>
                  <select
                    value={deadlineFilter}
                    onChange={(e) => setDeadlineFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  >
                    {DEADLINE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Job Grid */}
        {isLoading ? (
          <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-slate-600">
            Loading jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-lg font-medium text-slate-700">No jobs found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search or filters.
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const location = typeof job.companyId === 'string' ? '-' : job.companyId.location;
              const companyName = typeof job.companyId === 'string' ? 'Company' : job.companyId.name;
              const daysLeft = getDaysLeft(job.lastDate);
              const isUrgent = daysLeft <= 3 && daysLeft >= 0;
              const alreadyApplied = appliedJobIds.has(job._id);

              return (
                <div
                  key={job._id}
                  className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center font-bold text-lg bg-blue-100 text-blue-600">
                      {companyName.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        job.type === 'Internship'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      {job.type}
                    </span>
                  </div>

                  <div className="mb-4 flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-slate-600 font-medium">{companyName}</p>
                    <p className="mt-1 text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {location}
                      <span className="mx-1.5 text-slate-300">|</span>
                      {job.type}
                      {job.jobMode && (
                        <>
                          <span className="mx-1.5 text-slate-300">|</span>
                          {job.jobMode}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2 mb-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      {getInrText(job.packageOrStipend)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {isUrgent ? (
                        <span className="font-medium text-red-600">
                          Closing in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span>Closes {new Date(job.lastDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => onNavigate(`jobs/${job._id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      className="w-full"
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

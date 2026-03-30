import React, { useEffect, useMemo, useState } from 'react';
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
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'Shortlisted':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'Interview Scheduled':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'Pending Decision':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'Rejected':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
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
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
            <p className="text-slate-600">
              Track the status of your job applications.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onNavigate('jobs')}>
              Browse Jobs
            </Button>
          </div>
        </div>

        {pendingDecisionCount > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {pendingDecisionCount} of your interview{pendingDecisionCount === 1 ? ' has' : 's have'} passed.
            The company will update the result soon. Awaiting final decision.
          </div>
        )}

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-700">
                {filteredApplications.length} Application{filteredApplications.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Status Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.slice(0, 5).map((opt) => {
                const count = opt.value
                  ? applications.filter((a) => a.status === opt.value).length
                  : applications.length;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(statusFilter === opt.value ? '' : opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      statusFilter === opt.value
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {showFilters && (
            <div className="border-t border-slate-200 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Application Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

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
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Application Cards */}
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-600">
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-lg font-medium text-slate-700">No applications found</p>
            <p className="mt-1 text-sm text-slate-500">
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
          <div className="space-y-4">
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
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Company Logo & Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center font-bold text-lg bg-blue-100 text-blue-600 flex-shrink-0">
                        {company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 truncate">
                          {job?.title || 'Unknown Position'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {job?.type || '-'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Applied {appliedDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-3 md:flex-shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                      >
                        {item.status}
                      </span>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
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

                  {/* Interview Date */}
                  {item.interviewDate && item.status === 'Interview Scheduled' && (
                    <div className="mt-3 ml-0 md:ml-16">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm text-blue-700 border border-blue-200">
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

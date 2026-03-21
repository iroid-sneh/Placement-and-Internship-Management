import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import {
  Search,
  MapPin,
  IndianRupee,
  Clock } from
'lucide-react';
import { applyForJob, getStudentJobs } from '../../services/api/student';
import { useAuth } from '../../context/AuthContext';
import type { Job } from '../../types/app';
interface BrowseJobsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
export function BrowseJobs({ onNavigate, onLogout }: BrowseJobsProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    const loadJobs = async (): Promise<void> => {
      try {
        const response = await getStudentJobs();
        setJobs(response);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    };
    void loadJobs();
  }, []);
  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const companyName = typeof job.companyId === 'string' ? '' : job.companyId.name;
        const matchSearch = `${job.title} ${companyName}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = !typeFilter || job.type === typeFilter;
        return matchSearch && matchType;
      }),
    [jobs, searchTerm, typeFilter]
  );
  const handleApply = async (jobId: string): Promise<void> => {
    try {
      await applyForJob(jobId);
      setErrorMessage('');
      onNavigate('applications');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to apply');
    }
  };
  const getInrText = (value: string): string => {
    if (!value) {
      return 'INR -';
    }
    if (value.toLowerCase().includes('inr') || value.includes('₹')) {
      return value;
    }
    return `INR ${value}`;
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
      {
        label: 'Browse Jobs'
      }]
      }>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Browse Jobs & Internships
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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none" />

          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none">
              <option value="">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Job">Job</option>
            </select>
          </div>
        </div>

        {/* Job Grid */}
        {isLoading ? (
          <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-slate-600">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-slate-600">No jobs available right now.</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) =>
          <div
            key={job._id}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">

              <div className="flex items-start justify-between mb-4">
                <div
                className="h-12 w-12 rounded-lg flex items-center justify-center font-bold text-lg bg-blue-100 text-blue-600">

                  {(typeof job.companyId === 'string' ? 'C' : job.companyId.name[0] || 'C').toUpperCase()}
                </div>
                <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${job.type === 'Internship' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>

                  {job.type}
                </span>
              </div>

              <div className="mb-4 flex-1">
                <h3 className="font-bold text-lg text-slate-900 mb-1">
                  {job.title}
                </h3>
                <p className="text-slate-600 font-medium">{typeof job.companyId === 'string' ? 'Company' : job.companyId.name}</p>
              </div>

              <div className="space-y-2 mb-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {typeof job.companyId === 'string' ? '-' : job.companyId.location}
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  {getInrText(job.packageOrStipend)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(job.lastDate).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => onNavigate(`jobs/${job._id}`)}>
                  Details
                </Button>
                <Button className="w-full" onClick={() => handleApply(job._id)}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </DashboardLayout>);

}
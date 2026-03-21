import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { applyForJob, getStudentApplications, getStudentJobs } from '../../services/api/student';
import type { Application, Job } from '../../types/app';
import {
  MapPin,
  Briefcase,
  IndianRupee,
  Clock,
  Calendar,
  CheckCircle,
  ArrowLeft } from
'lucide-react';
interface JobDetailsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
  jobId?: string;
}
export function JobDetails({ onNavigate, onLogout, jobId }: JobDetailsProps) {
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  useEffect(() => {
    const loadJob = async (): Promise<void> => {
      try {
        const [jobsResponse, applicationsResponse] = await Promise.all([
          getStudentJobs(),
          getStudentApplications()
        ]);
        const matchedJob = jobsResponse.find((item) => item._id === jobId) || null;
        setJob(matchedJob);
        setApplications(applicationsResponse);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load job details');
      }
    };
    void loadJob();
  }, [jobId]);
  const isApplied = useMemo(
    () =>
      applications.some(
        (application) =>
          typeof application.jobId !== 'string' && application.jobId._id === jobId
      ),
    [applications, jobId]
  );
  const handleApply = async (): Promise<void> => {
    if (!job?._id || isApplied) return;
    setIsApplying(true);
    try {
      await applyForJob(job._id);
      const applicationsResponse = await getStudentApplications();
      setApplications(applicationsResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to apply');
    } finally {
      setIsApplying(false);
    }
  };
  if (!job) {
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
            label: 'Browse Jobs',
            href: 'jobs'
          },
          {
            label: 'Job Detail'
          }
        ]}
      >
        <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-slate-600">
          {errorMessage || 'Loading job details...'}
        </div>
      </DashboardLayout>
    );
  }
  const companyName = typeof job.companyId === 'string' ? '-' : job.companyId.name;
  const companyLocation = typeof job.companyId === 'string' ? '-' : job.companyId.location;
  const descriptionText = job.description;
  const requirements = job.eligibility.split(',').map((item) => item.trim()).filter(Boolean);
  const inrCompensationText =
    job.packageOrStipend.toLowerCase().includes('inr') || job.packageOrStipend.includes('₹')
      ? job.packageOrStipend
      : `INR ${job.packageOrStipend}`;
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
        label: 'Browse Jobs',
        href: 'jobs'
      },
      {
        label: job.title
      }]
      }>

      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="pl-0 hover:bg-transparent hover:text-teal-600"
          onClick={() => onNavigate('jobs')}
          icon={<ArrowLeft className="h-4 w-4" />}>

          Back to Jobs
        </Button>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-8 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl">
                  {companyName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {job.title}
                  </h1>
                  <p className="text-lg text-slate-600 font-medium">
                    {companyName}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.type}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {companyLocation}
                    </div>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {inrCompensationText}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Deadline: {new Date(job.lastDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              <Button size="lg" disabled={isApplied || isApplying} isLoading={isApplying} onClick={handleApply}>
                {isApplied ? 'Applied' : 'Apply Now'}
              </Button>
            </div>
          </div>
          {errorMessage && (
            <div className="mx-8 mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Content */}
          <div className="p-8 space-y-8">
            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                About the Role
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {descriptionText}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                Requirements
              </h3>
              <ul className="space-y-2">
                {requirements.map((req, i) =>
                <li key={i} className="flex items-start gap-3 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    {req}
                  </li>
                )}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>);

}
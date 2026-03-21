import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { useAuth } from '../../context/AuthContext';
import { getCompanyApplicants, getCompanyJobs } from '../../services/api/company';
import type { Application, Job } from '../../types/app';
import {
  Users,
  FileText,
  CheckCircle,
  Plus,
  MoreHorizontal,
  Calendar,
  XCircle,
  Briefcase } from
'lucide-react';
import { updateCompanyApplicantStatus } from '../../services/api/company';
interface CompanyDashboardProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
export function CompanyDashboard({
  onNavigate,
  onLogout
}: CompanyDashboardProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicantsData, setApplicantsData] = useState<Application[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const loadDashboard = async (): Promise<void> => {
    try {
      const [jobsResponse, applicantsResponse] = await Promise.all([
        getCompanyJobs(),
        getCompanyApplicants()
      ]);
      setJobs(jobsResponse);
      setApplicantsData(applicantsResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load company dashboard');
    }
  };
  useEffect(() => {
    void loadDashboard();
  }, []);
  const handleScheduleInterview = async (applicationId: string): Promise<void> => {
    const dateStr = prompt('Enter interview date (YYYY-MM-DD):');
    if (!dateStr) return;
    try {
      await updateCompanyApplicantStatus(applicationId, 'Interview Scheduled', new Date(dateStr).toISOString());
      await loadDashboard();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to schedule interview');
    }
  };
  const handleRejectApplicant = async (applicationId: string): Promise<void> => {
    if (!confirm('Are you sure you want to reject this applicant?')) return;
    try {
      await updateCompanyApplicantStatus(applicationId, 'Rejected');
      await loadDashboard();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to reject applicant');
    }
  };
  const applicants = useMemo(
    () =>
      applicantsData.map((application) => {
        const student = typeof application.studentId === 'string' ? null : application.studentId;
        const job = typeof application.jobId === 'string' ? null : application.jobId;
        const column =
          application.status === 'Applied'
            ? 'new'
            : application.status === 'Shortlisted'
              ? 'screening'
              : application.status === 'Interview Scheduled'
                ? 'interview'
                : application.status === 'Selected'
                  ? 'hired'
                  : 'offer';
        return {
          id: application._id,
          name: student?.name || '-',
          role: job?.title || '-',
          date: new Date(application.createdAt).toLocaleDateString(),
          column
        };
      }),
    [applicantsData]
  );
  const kanbanColumns = useMemo(
    () => [
      {
        id: 'new',
        title: 'New Applications',
        color: 'bg-slate-100',
        count: applicants.filter((applicant) => applicant.column === 'new').length
      },
      {
        id: 'screening',
        title: 'Shortlisted',
        color: 'bg-blue-50',
        count: applicants.filter((applicant) => applicant.column === 'screening').length
      },
      {
        id: 'interview',
        title: 'Interview',
        color: 'bg-purple-50',
        count: applicants.filter((applicant) => applicant.column === 'interview').length
      },
      {
        id: 'offer',
        title: 'Rejected',
        color: 'bg-yellow-50',
        count: applicants.filter((applicant) => applicant.column === 'offer').length
      },
      {
        id: 'hired',
        title: 'Selected',
        color: 'bg-green-50',
        count: applicants.filter((applicant) => applicant.column === 'hired').length
      }
    ],
    [applicants]
  );
  const openJobs = jobs.filter((job) => job.status === 'Open').length;
  const shortlisted = applicantsData.filter((application) => application.status === 'Shortlisted').length;
  const hired = applicantsData.filter((application) => application.status === 'Selected').length;

  return (
    <DashboardLayout
      userRole="company"
      currentPath="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Company',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'Dashboard'
      }]
      }>

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Recruitment Pipeline
            </h1>
            <p className="text-slate-600">
              Manage your job postings and applicants.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Briefcase className="h-4 w-4" />}
              onClick={() => onNavigate('company-jobs')}>

              Manage Jobs
            </Button>
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => onNavigate('company-jobs')}>

              Post New Job
            </Button>
          </div>
        </div>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Open Positions"
            value={String(openJobs)}
            icon={<FileText className="h-6 w-6" />}
            gradient="blue" />

          <StatCard
            title="Total Applicants"
            value={String(applicantsData.length)}
            icon={<Users className="h-6 w-6" />}
            gradient="teal"
            trend={{
              value: String(applicantsData.length),
              direction: 'up'
            }} />

          <StatCard
            title="Shortlisted"
            value={String(shortlisted)}
            icon={<CheckCircle className="h-6 w-6" />}
            gradient="purple" />

          <StatCard
            title="Hired"
            value={String(hired)}
            icon={<Users className="h-6 w-6" />}
            gradient="orange"
            trend={{
              value: String(hired),
              direction: hired > 0 ? 'up' : 'neutral'
            }} />

        </div>

        {/* Kanban Board */}
        <div className="flex h-[600px] gap-6 overflow-x-auto pb-4">
          {kanbanColumns.map((column) =>
          <div
            key={column.id}
            className="flex min-w-[280px] flex-col rounded-xl bg-slate-50 border border-slate-200">

              <div
              className={`flex items-center justify-between p-4 border-b border-slate-200 rounded-t-xl ${column.color}`}>

                <h3 className="font-semibold text-slate-900">{column.title}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 shadow-sm">
                  {column.count}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {applicants.
              filter((a) => a.column === column.id).
              map((applicant) =>
              <div
                key={applicant.id}
                className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-teal-200 cursor-grab active:cursor-grabbing">

                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {applicant.name}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {applicant.role}
                          </p>
                        </div>
                        <DropdownMenu
                    items={[
                    {
                      label: 'View Profile',
                      icon: <FileText className="h-4 w-4" />,
                      onClick: () => onNavigate('applicants')
                    },
                    {
                      label: 'Schedule Interview',
                      icon: <Calendar className="h-4 w-4" />,
                      onClick: () => handleScheduleInterview(applicant.id)
                    },
                    {
                      label: 'Reject',
                      icon: <XCircle className="h-4 w-4" />,
                      variant: 'danger',
                      onClick: () => handleRejectApplicant(applicant.id)
                    }]
                    }
                    trigger={
                    <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                    } />

                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>Applied {applicant.date}</span>
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px]">
                          {applicant.name.charAt(0)}
                        </div>
                      </div>
                    </div>
              )}

                {/* Placeholder for empty columns */}
                {applicants.filter((a) => a.column === column.id).length ===
              0 &&
              <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400">
                    No applicants
                  </div>
              }
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>);

}
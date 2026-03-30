import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { getStudentApplications, getStudentJobs, getStudentProfile, applyForJob } from '../../services/api/student';
import type { Application, Job, StudentProfile } from '../../types/app';
import {
  Briefcase,
  FileText,
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  UserCircle,
  ArrowRight,
  Send } from
'lucide-react';
interface StudentDashboardProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
export function StudentDashboard({
  onNavigate,
  onLogout
}: StudentDashboardProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState<{ jobId: string; text: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => {
    const loadDashboard = async (): Promise<void> => {
      try {
        const [jobsResponse, applicationsResponse, profileResponse] = await Promise.all([
          getStudentJobs(),
          getStudentApplications(),
          getStudentProfile()
        ]);
        setJobs(jobsResponse);
        setApplications(applicationsResponse);
        setProfile(profileResponse);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load student dashboard');
      }
    };
    void loadDashboard();
  }, []);

  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => typeof a.jobId === 'string' ? a.jobId : a.jobId._id)),
    [applications]
  );

  const handleApplyNow = async (jobId: string): Promise<void> => {
    setApplyMessage(null);
    setApplyingJobId(jobId);
    try {
      await applyForJob(jobId);
      setApplyMessage({ jobId, text: 'Application submitted successfully!', type: 'success' });
      const updatedApplications = await getStudentApplications();
      setApplications(updatedApplications);
    } catch (error) {
      setApplyMessage({
        jobId,
        text: error instanceof Error ? error.message : 'Failed to apply',
        type: 'error'
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  const timeline = useMemo(
    () =>
      applications.slice(0, 5).map((application) => {
        const job = typeof application.jobId === 'string' ? null : application.jobId;
        const company = job && typeof job.companyId !== 'string' ? job.companyId.name : '-';
        const status =
          application.status === 'Interview Scheduled' || application.status === 'Pending Decision'
            ? 'interviewing'
            : application.status === 'Rejected'
              ? 'rejected'
              : 'pending';
        return {
          id: application._id,
          company,
          role: job?.title || '-',
          status,
          date: new Date(application.createdAt).toLocaleDateString(),
          note: application.status
        };
      }),
    [applications]
  );
  const interviewsCount = applications.filter(
    (application) => application.status === 'Interview Scheduled'
  ).length;
  const offersCount = applications.filter((application) => application.status === 'Selected').length;
  const profileScore = profile?.resumeUrl ? '100%' : '80%';
  const isProfileComplete = profileScore === '100%';

  return (
    <DashboardLayout
      userRole="student"
      currentPath="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Student',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'Dashboard'
      }]
      }>

      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-slate-600">
              Here's what's happening with your applications today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onNavigate('profile')}
              icon={<UserCircle className="h-4 w-4" />}>

              Edit Profile
            </Button>
            <Button
              onClick={() => onNavigate('jobs')}
              icon={<Briefcase className="h-4 w-4" />}>

              Browse Jobs
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
            title="Applications"
            value={String(applications.length)}
            icon={<FileText className="h-6 w-6" />}
            gradient="teal" />

          <StatCard
            title="Interviews"
            value={String(interviewsCount)}
            icon={<Calendar className="h-6 w-6" />}
            gradient="purple" />

          <StatCard
            title="Offers"
            value={String(offersCount)}
            icon={<CheckCircle className="h-6 w-6" />}
            gradient="orange" />

          <StatCard
            title="Profile Score"
            value={profileScore}
            icon={<Briefcase className="h-6 w-6" />}
            gradient="blue" />

        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recommended Jobs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Recommended for you
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('jobs')}
                  icon={<ArrowRight className="h-4 w-4" />}>

                  View all
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {jobs.slice(0, 4).map((job) => {
                  const alreadyApplied = appliedJobIds.has(job._id);
                  return (
                    <div
                      key={job._id}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md hover:border-teal-200">

                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold bg-blue-100 text-blue-600">

                            {(typeof job.companyId === 'string' ? 'C' : job.companyId.name.charAt(0)).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                              {job.title}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {typeof job.companyId === 'string' ? '-' : job.companyId.name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {typeof job.companyId === 'string' ? '-' : job.companyId.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(job.lastDate).toLocaleDateString()}
                        </div>
                      </div>
                      {applyMessage && applyMessage.jobId === job._id && (
                        <div className={`mt-3 rounded-md px-3 py-1.5 text-xs ${
                          applyMessage.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {applyMessage.text}
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant={alreadyApplied ? 'secondary' : 'primary'}
                          size="sm"
                          className="flex-1"
                          icon={<Send className="h-3.5 w-3.5" />}
                          isLoading={applyingJobId === job._id}
                          disabled={alreadyApplied}
                          onClick={() => handleApplyNow(job._id)}>

                          {alreadyApplied ? 'Applied' : 'Apply Now'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => onNavigate(`jobs/${job._id}`)}>

                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Profile Completion - hidden when 100% */}
            {!isProfileComplete && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">
                  Profile Completion
                </h3>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                        In Progress
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-teal-600">
                        {profileScore}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-100">
                    <div
                      style={{
                        width: profileScore
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500">
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Complete your profile to increase your chances of getting
                    hired.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onNavigate('profile')}>

                    Complete Profile
                  </Button>
                </div>
              </div>
            )}

            {/* Application Timeline */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Recent Activity</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('applications')}>

                  View All
                </Button>
              </div>
              <div className="relative border-l border-slate-200 ml-3 space-y-6">
                {timeline.map((item) =>
                  <div key={item.id} className="mb-6 ml-6 relative">
                    <span
                      className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${item.status === 'interviewing' ? 'bg-blue-100 text-blue-600' : item.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>

                      <div
                        className={`h-2 w-2 rounded-full ${item.status === 'interviewing' ? 'bg-blue-600' : item.status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'}`} />

                    </span>
                    <h4 className="flex items-center text-sm font-semibold text-slate-900">
                      {item.company}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {item.date}
                      </span>
                    </h4>
                    <p className="text-sm text-slate-600">{item.role}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>);

}

import { useEffect, useMemo, useState } from 'react';
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

      <div className="student-page">
        <div className="student-page__header">
          <div>
            <h1 className="student-page__title">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="student-page__subtitle">
              Here's what's happening with your applications today.
            </p>
          </div>
          <div className="student-page__actions">
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
          <div className="student-alert student-alert--error">
            {errorMessage}
          </div>
        )}

        <div className="student-grid student-grid--stats">
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

        <div className="student-grid student-grid--dashboard">
          <div className="student-dashboard__main">
            <div>
              <div className="student-card__title-row">
                <h2 className="student-card__title">
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
              <div className="student-grid student-grid--cards">
                {jobs.slice(0, 4).map((job) => {
                  const alreadyApplied = appliedJobIds.has(job._id);
                  return (
                    <div
                      key={job._id}
                      className="student-job-card">
                      <div className="student-job-card__company">
                          <div className="student-job-card__logo">

                            {(typeof job.companyId === 'string' ? 'C' : job.companyId.name.charAt(0)).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="student-job-card__title">
                              {job.title}
                            </h3>
                            <p className="student-job-card__company-name">
                              {typeof job.companyId === 'string' ? '-' : job.companyId.name}
                            </p>
                          </div>
                      </div>
                      <div className="student-job-card__meta">
                        <div className="student-job-card__meta-item">
                          <MapPin className="h-3 w-3" />
                          {typeof job.companyId === 'string' ? '-' : job.companyId.location}
                        </div>
                        <div className="student-job-card__meta-item">
                          <Clock className="h-3 w-3" />
                          {new Date(job.lastDate).toLocaleDateString()}
                        </div>
                      </div>
                      {applyMessage && applyMessage.jobId === job._id && (
                        <div className={`student-job-card__feedback ${
                          applyMessage.type === 'success'
                            ? 'student-job-card__feedback--success'
                            : 'student-job-card__feedback--error'
                        }`}>
                          {applyMessage.text}
                        </div>
                      )}
                      <div className="student-job-card__actions">
                        <Button
                          variant={alreadyApplied ? 'secondary' : 'primary'}
                          size="sm"
                          className="student-flex-grow"
                          icon={<Send className="h-3.5 w-3.5" />}
                          isLoading={applyingJobId === job._id}
                          disabled={alreadyApplied}
                          onClick={() => handleApplyNow(job._id)}>

                          {alreadyApplied ? 'Applied' : 'Apply Now'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="student-flex-grow"
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

          <div className="student-dashboard__side">
            {!isProfileComplete && (
              <div className="student-panel">
                <h3 className="student-card__title">
                  Profile Completion
                </h3>
                <div>
                  <div className="student-card__title-row">
                    <div>
                      <span className="student-badge student-badge--progress">
                        In Progress
                      </span>
                    </div>
                    <div>
                      <span className="student-badge student-badge--progress">
                        {profileScore}
                      </span>
                    </div>
                  </div>
                  <div className="student-progress">
                    <div className="student-progress__bar" style={{ width: profileScore }} />
                  </div>
                  <p className="student-page__subtitle">
                    Complete your profile to increase your chances of getting
                    hired.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="student-full-width"
                    onClick={() => onNavigate('profile')}>

                    Complete Profile
                  </Button>
                </div>
              </div>
            )}

            <div className="student-panel">
              <div className="student-card__title-row">
                <h3 className="student-card__title">Recent Activity</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('applications')}>

                  View All
                </Button>
              </div>
              <div className="student-timeline">
                {timeline.map((item) =>
                  <div key={item.id} className="student-timeline__item">
                    <span
                      className={`student-timeline__dot ${
                        item.status === 'interviewing'
                          ? 'student-timeline__dot--interviewing'
                          : item.status === 'rejected'
                            ? 'student-timeline__dot--rejected'
                            : 'student-timeline__dot--pending'
                      }`}>
                    </span>
                    <h4 className="student-card__title">
                      {item.company}
                      <span className="student-page__subtitle">
                        {item.date}
                      </span>
                    </h4>
                    <p className="student-page__subtitle">{item.role}</p>
                    <p className="student-page__subtitle">{item.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>);

}

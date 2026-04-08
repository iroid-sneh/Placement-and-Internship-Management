import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { applyForJob, getStudentApplications, getStudentJobs } from '../../services/api/student';
import type { Application, Job } from '../../types/app';
import { MapPin, Briefcase, IndianRupee, Clock, CheckCircle, ArrowLeft } from 'lucide-react';

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
        user={{ name: user?.name || 'Student', email: user?.email || '' }}
        breadcrumbs={[{ label: 'Browse Jobs', href: 'jobs' }, { label: 'Job Detail' }]}
      >
        <div className="student-page student-page--narrow">
          <div className="student-card student-card--padded">
            {errorMessage || 'Loading job details...'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const companyName = typeof job.companyId === 'string' ? '-' : job.companyId.name;
  const companyLocation = typeof job.companyId === 'string' ? '-' : job.companyId.location;
  const requirements = job.requiredSkills && job.requiredSkills.length > 0
    ? job.requiredSkills
    : job.eligibility
      ? job.eligibility.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
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
      user={{ name: user?.name || 'Student', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Browse Jobs', href: 'jobs' }, { label: job.title }]}
    >
      <div className="student-page student-page--narrow">
        <Button variant="ghost" onClick={() => onNavigate('jobs')} icon={<ArrowLeft className="h-4 w-4" />}>
          Back to Jobs
        </Button>

        <div className="student-card student-card--padded">
          <div className="student-page__header">
            <div className="student-application-card__company">
              <div className="student-application-card__logo">
                {companyName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="student-page__title">{job.title}</h1>
                <p className="student-page__subtitle">{companyName}</p>
                <div className="student-job-card__meta">
                  <div className="student-job-card__meta-item"><Briefcase className="h-4 w-4" />{job.type}</div>
                  <div className="student-job-card__meta-item"><MapPin className="h-4 w-4" />{companyLocation}{job.jobMode && <span className="student-badge student-badge--progress">{job.jobMode}</span>}</div>
                  <div className="student-job-card__meta-item"><IndianRupee className="h-4 w-4" />{inrCompensationText}</div>
                  <div className="student-job-card__meta-item"><Clock className="h-4 w-4" />Deadline: {new Date(job.lastDate).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            <Button size="lg" disabled={isApplied || isApplying} isLoading={isApplying} onClick={handleApply}>
              {isApplied ? 'Applied' : 'Apply Now'}
            </Button>
          </div>

          {errorMessage && <div className="student-alert student-alert--error">{errorMessage}</div>}

          <div className="student-form">
            <section>
              <h3 className="student-card__title">About the Role</h3>
              <p className="student-page__subtitle">{job.description}</p>
            </section>

            <section>
              <h3 className="student-card__title">
                {job.requiredSkills && job.requiredSkills.length > 0 ? 'Required Skills' : 'Requirements'}
              </h3>
              <ul className="student-tips__list">
                {requirements.map((req, i) => (
                  <li key={i} className="student-icon-inline">
                    <CheckCircle className="h-5 w-5 text-teal-600" />
                    {req}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

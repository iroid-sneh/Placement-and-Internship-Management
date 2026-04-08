import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable, FilterOption } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { StatusDot } from '../../components/ui/StatusDot';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  BriefcaseBusiness,
  CircleDollarSign,
  MoreHorizontal,
  Plus,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createCompanyJob,
  deleteCompanyJob,
  getCompanyApplicants,
  getCompanyJobs,
  updateCompanyJob
} from '../../services/api/company';
import type { Job } from '../../types/app';

interface CompanyJobPostingsProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const DEFAULT_FORM = {
  title: '',
  description: '',
  type: 'Job' as Job['type'],
  jobMode: 'Onsite' as 'Remote' | 'Hybrid' | 'Onsite',
  requiredSkills: '',
  eligibility: '',
  packageOrStipend: '',
  lastDate: '',
  status: 'Open' as Job['status']
};

export function CompanyJobPostings({
  onNavigate,
  onLogout
}: CompanyJobPostingsProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicantsByJobId, setApplicantsByJobId] = useState<Record<string, number>>({});
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Delete confirmation modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadJobs = async (): Promise<void> => {
    try {
      const [jobsResponse, applicantsResponse] = await Promise.all([
        getCompanyJobs(),
        getCompanyApplicants()
      ]);
      setJobs(jobsResponse);
      const counts = applicantsResponse.reduce<Record<string, number>>((acc, application) => {
        const job = application.jobId;
        const jobId = typeof job === 'string' ? job : job._id;
        acc[jobId] = (acc[jobId] || 0) + 1;
        return acc;
      }, {});
      setApplicantsByJobId(counts);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load jobs');
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const openCreateModal = (): void => {
    setSelectedJob(null);
    setModalErrorMessage('');
    setFormData({ ...DEFAULT_FORM });
    setIsJobModalOpen(true);
  };

  const openEditModal = (job: Job): void => {
    setSelectedJob(job);
    setModalErrorMessage('');
    setFormData({
      title: job.title,
      description: job.description,
      type: job.type,
      jobMode: job.jobMode || 'Onsite',
      requiredSkills: job.requiredSkills ? job.requiredSkills.join(', ') : (job.eligibility || ''),
      eligibility: job.eligibility || '',
      packageOrStipend: job.packageOrStipend,
      lastDate: job.lastDate.slice(0, 10),
      status: job.status
    });
    setIsJobModalOpen(true);
  };

  const updateFormField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveJob = async (): Promise<void> => {
    try {
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      };
      if (selectedJob) {
        await updateCompanyJob(selectedJob._id, payload);
      } else {
        await createCompanyJob(payload as Omit<Job, "_id">);
      }
      setModalErrorMessage('');
      setIsJobModalOpen(false);
      await loadJobs();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to save job');
    }
  };

  // Delete handlers
  const openDeleteModal = (job: Job) => {
    setDeleteTarget(job);
    setIsDeleteOpen(true);
  };

  const handleDeleteJob = async (): Promise<void> => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCompanyJob(deleteTarget._id);
      setIsDeleteOpen(false);
      await loadJobs();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete job');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter jobs based on active filters
  const filteredRows = useMemo(() => {
    let rows = jobs.map((job) => ({
      ...job,
      id: job._id,
      applications: applicantsByJobId[job._id] || 0,
      deadline: new Date(job.lastDate).toLocaleDateString()
    }));

    if (filters.status) {
      rows = rows.filter((r) => r.status === filters.status);
    }
    if (filters.jobMode) {
      rows = rows.filter((r) => (r.jobMode || 'Onsite') === filters.jobMode);
    }
    if (filters.type) {
      rows = rows.filter((r) => r.type === filters.type);
    }

    return rows;
  }, [jobs, applicantsByJobId, filters]);

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Job Status',
      options: [
        { label: 'Open', value: 'Open' },
        { label: 'Closed', value: 'Closed' }
      ]
    },
    {
      key: 'jobMode',
      label: 'Work Mode',
      options: [
        { label: 'Remote', value: 'Remote' },
        { label: 'Hybrid', value: 'Hybrid' },
        { label: 'Onsite', value: 'Onsite' }
      ]
    },
    {
      key: 'type',
      label: 'Job Type',
      options: [
        { label: 'Job', value: 'Job' },
        { label: 'Internship', value: 'Internship' }
      ]
    }
  ];

  const columns = [
    {
      key: 'title',
      header: 'Job Title',
      sortable: true
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (item: any) => (
        <div className="company-badge-row">
          <span className={`company-badge ${
            item.type === 'Internship' ? 'company-badge--internship' : 'company-badge--job'
          }`}>
            {item.type}
          </span>
          {item.jobMode && (
            <span className="company-badge company-badge--neutral">
              {item.jobMode}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'applications',
      header: 'Applications',
      render: (item: any) => (
        <span className="company-table-metric">
          <Users className="h-4 w-4 text-slate-400" />
          {item.applications}
        </span>
      )
    },
    {
      key: 'deadline',
      header: 'Deadline',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <StatusDot
          status={item.status === 'Open' ? 'success' : 'error'}
          label={item.status}
        />
      )
    }
  ];

  const totalJobs = jobs.length;
  const openJobs = jobs.filter((job) => job.status === 'Open').length;
  const totalApplications = jobs.reduce((count, job) => count + (applicantsByJobId[job._id] || 0), 0);

  return (
    <DashboardLayout
      userRole="company"
      currentPath="company-jobs"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Company',
        email: user?.email || ''
      }}
      breadcrumbs={[{ label: 'My Job Postings' }]}
    >
      <div className="company-page">
        <div className="company-hero">
          <div className="company-hero__content">
            <div className="company-hero__body">
              <span className="company-hero__eyebrow">
                Job Postings
              </span>
              <div>
                <h1 className="company-hero__title">Hiring Pipeline</h1>
                <p className="company-hero__subtitle">
                  Launch polished job posts, track candidate demand, and keep every opening aligned with your hiring goals.
                </p>
              </div>
            </div>
            <Button
              className="company-button company-button--hero"
              icon={<Plus className="h-4 w-4" />}
              onClick={openCreateModal}
            >
              Post New Job
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="company-alert company-alert--error">
            {errorMessage}
          </div>
        )}

        <div className="company-grid company-grid--stats">
          <div className="company-card company-card--padded">
            <div className="company-icon-row">
              <div className="company-card__metric-icon company-card__metric-icon--cyan">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <p className="company-card__metric-label">Total Postings</p>
                <p className="company-card__metric-value">{totalJobs}</p>
              </div>
            </div>
          </div>
          <div className="company-card company-card--padded">
            <div className="company-icon-row">
              <div className="company-card__metric-icon company-card__metric-icon--emerald">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="company-card__metric-label">Open Roles</p>
                <p className="company-card__metric-value">{openJobs}</p>
              </div>
            </div>
          </div>
          <div className="company-card company-card--padded">
            <div className="company-icon-row">
              <div className="company-card__metric-icon company-card__metric-icon--amber">
                <CircleDollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="company-card__metric-label">Applications Received</p>
                <p className="company-card__metric-value">{totalApplications}</p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          title="Active Job Listings"
          data={filteredRows}
          columns={columns}
          keyField="id"
          filterOptions={filterOptions}
          onFilterChange={setFilters}
          actions={(item) => (
            <DropdownMenu
              items={[
                {
                  label: 'View Applicants',
                  icon: <Users className="h-4 w-4" />,
                  onClick: () => onNavigate('applicants')
                },
                {
                  label: 'Edit Job',
                  onClick: () => openEditModal(item as Job)
                },
                {
                  label: 'Delete Job',
                  variant: 'danger',
                  onClick: () => openDeleteModal(item as Job)
                }
              ]}
              trigger={
                <button className="company-icon-button" type="button">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              }
            />
          )}
        />

        {/* Job Create/Edit Modal */}
        <Modal
          isOpen={isJobModalOpen}
          onClose={() => { setIsJobModalOpen(false); setModalErrorMessage(''); }}
          preventCloseOnBackdrop
          title={selectedJob ? 'Edit Job' : 'Post New Job'}
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => { setIsJobModalOpen(false); setModalErrorMessage(''); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveJob}>
                {selectedJob ? 'Save Changes' : 'Post Job'}
              </Button>
            </>
          }
        >
          <div className="company-page company-page--compact">
            {modalErrorMessage && (
              <div className="company-alert company-alert--error">
                {modalErrorMessage}
              </div>
            )}
            <div className="company-card company-card--padded">
              <div className="company-icon-row">
                <div className="company-profile-hero__logo">
                  {(formData.title || 'J').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="company-card__title">{formData.title || 'Job Title'}</p>
                  <p className="company-page__subtitle">
                    {formData.type} • {formData.jobMode}
                  </p>
                </div>
              </div>
            </div>
            <Input
              label="Job Title"
              value={formData.title}
              onChange={(e) => updateFormField('title', e.target.value)}
            />
            <div className="company-grid company-grid--forms">
              <div className="company-field">
                <label className="company-input__label">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => updateFormField('type', e.target.value)}
                  className="company-select"
                >
                  <option value="Job">Job</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div className="company-field">
                <label className="company-input__label">Work Mode</label>
                <select
                  value={formData.jobMode}
                  onChange={(e) => updateFormField('jobMode', e.target.value)}
                  className="company-select"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>
            </div>
            <div className="company-grid company-grid--forms">
              <Input
                label="Package/Stipend"
                placeholder="e.g. INR 4.5 LPA / INR 15,000 per month"
                value={formData.packageOrStipend}
                onChange={(e) => updateFormField('packageOrStipend', e.target.value)}
              />
              <Input
                label="Required Skills"
                placeholder="e.g. React, Node.js, MongoDB"
                value={formData.requiredSkills}
                onChange={(e) => updateFormField('requiredSkills', e.target.value)}
              />
            </div>
            <div className="company-field">
              <label className="company-input__label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
                rows={4}
                className="company-textarea"
              />
            </div>
            <div className="company-grid company-grid--forms">
              <Input
                label="Last Date"
                type="date"
                value={formData.lastDate}
                onChange={(e) => updateFormField('lastDate', e.target.value)}
              />
              <div className="company-field">
                <label className="company-input__label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormField('status', e.target.value)}
                  className="company-select"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Delete Job"
          footer={
            <>
              <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteJob} isLoading={isDeleting}>
                Delete Job
              </Button>
            </>
          }
        >
          <div className="company-page company-page--compact">
            <p className="company-page__subtitle">
              Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>?
            </p>
            <p className="company-page__subtitle">
              This will permanently remove the job posting and all associated applications. This action cannot be undone.
            </p>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

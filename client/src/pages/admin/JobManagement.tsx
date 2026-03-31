import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { StatusDot } from '../../components/ui/StatusDot';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  Briefcase,
  Clock3,
  ListChecks,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createAdminJob,
  deleteAdminJob,
  getAdminCompanies,
  getAdminJobs,
  updateAdminJob
} from '../../services/api/admin';
import type { Company, Job } from '../../types/app';

interface JobManagementProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const DEFAULT_FORM = {
  companyId: '',
  title: '',
  description: '',
  type: 'Job' as Job['type'],
  jobMode: 'Onsite' as NonNullable<Job['jobMode']>,
  requiredSkills: '',
  eligibility: '',
  packageOrStipend: '',
  lastDate: '',
  status: 'Open' as Job['status']
};

export function JobManagement({ onNavigate, onLogout }: JobManagementProps) {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });

  const loadData = async (): Promise<void> => {
    try {
      const [jobsResponse, companiesResponse] = await Promise.all([
        getAdminJobs(),
        getAdminCompanies()
      ]);
      setJobs(jobsResponse);
      setCompanies(companiesResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load job data');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const columns = [
    {
      key: 'companyId',
      header: 'Company',
      sortable: true,
      render: (item: Job) =>
        item.companyId && typeof item.companyId !== 'string'
          ? item.companyId.name
          : '-'
    },
    {
      key: 'title',
      header: 'Role',
      sortable: true
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true
    },
    {
      key: 'jobMode',
      header: 'Mode',
      sortable: true,
      render: (item: Job) => item.jobMode || 'Onsite'
    },
    {
      key: 'packageOrStipend',
      header: 'Package'
    },
    {
      key: 'requiredSkills',
      header: 'Skills',
      render: (item: Job) =>
        item.requiredSkills && item.requiredSkills.length > 0
          ? item.requiredSkills.slice(0, 2).join(', ')
          : '-'
    },
    {
      key: 'lastDate',
      header: 'Deadline',
      sortable: true,
      render: (item: Job) => new Date(item.lastDate).toLocaleDateString()
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Job) => (
        <StatusDot
          status={item.status === 'Open' ? 'success' : 'error'}
          label={item.status}
        />
      )
    }
  ];

  const handleOpenCreate = (): void => {
    setSelectedJob(null);
    setModalErrorMessage('');
    setFormData({ ...DEFAULT_FORM });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (job: Job): void => {
    setSelectedJob(job);
    setModalErrorMessage('');
    setFormData({
      companyId:
        job.companyId && typeof job.companyId !== 'string'
          ? job.companyId._id
          : typeof job.companyId === 'string'
            ? job.companyId
            : '',
      title: job.title,
      description: job.description,
      type: job.type,
      jobMode: job.jobMode || 'Onsite',
      requiredSkills: job.requiredSkills ? job.requiredSkills.join(', ') : '',
      eligibility: job.eligibility,
      packageOrStipend: job.packageOrStipend,
      lastDate: job.lastDate.slice(0, 10),
      status: job.status
    });
    setIsAddModalOpen(true);
  };

  const handleSaveJob = async (): Promise<void> => {
    try {
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
      };
      if (selectedJob) {
        await updateAdminJob(selectedJob._id, payload);
      } else {
        await createAdminJob(payload as Omit<Job, '_id'>);
      }
      setModalErrorMessage('');
      setIsAddModalOpen(false);
      await loadData();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to save job');
    }
  };

  const handleDeleteJob = async (): Promise<void> => {
    if (!selectedJob) return;
    try {
      await deleteAdminJob(selectedJob._id);
      setModalErrorMessage('');
      setIsDeleteModalOpen(false);
      await loadData();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to delete job');
    }
  };

  return (
    <DashboardLayout
      userRole="admin"
      currentPath="jobs"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{ name: user?.name || 'Admin', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Job Management' }]}
    >
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">
                Job Management
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Job Postings</h1>
                <p className="mt-2 text-sm text-slate-200 sm:text-base">
                  Create and maintain the same job fields students and companies see, including work mode, skills, eligibility, and deadlines.
                </p>
              </div>
            </div>
            <Button
              className="bg-white text-slate-900 hover:bg-slate-100"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleOpenCreate}
            >
              Post New Job
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Jobs</p>
                <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Open Jobs</p>
                <p className="text-2xl font-bold text-slate-900">
                  {jobs.filter((job) => job.status === 'Open').length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Companies</p>
                <p className="text-2xl font-bold text-slate-900">{companies.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Internships</p>
                <p className="text-2xl font-bold text-slate-900">
                  {jobs.filter((job) => job.type === 'Internship').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          title="All Job Postings"
          data={jobs.map((job) => ({ ...job, id: job._id }))}
          columns={columns}
          keyField="id"
          actions={(item: Job) => (
            <DropdownMenu
              items={[
                {
                  label: 'Edit Job',
                  icon: <Edit className="h-4 w-4" />,
                  onClick: () => handleOpenEdit(item)
                },
                {
                  label: 'Delete',
                  icon: <Trash className="h-4 w-4" />,
                  variant: 'danger',
                  onClick: () => {
                    setSelectedJob(item);
                    setModalErrorMessage('');
                    setIsDeleteModalOpen(true);
                  }
                }
              ]}
              trigger={
                <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              }
            />
          )}
        />

        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setModalErrorMessage('');
          }}
          title={selectedJob ? 'Edit Job' : 'Post New Job'}
          size="lg"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setModalErrorMessage('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveJob}>
                {selectedJob ? 'Save Changes' : 'Publish Job'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {modalErrorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalErrorMessage}
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-xl font-bold text-white">
                  {(formData.title || 'J').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{formData.title || 'Job Title'}</p>
                  <p className="text-sm text-slate-500">{formData.type} • {formData.jobMode}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Company</label>
                <select
                  value={formData.companyId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, companyId: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Job Role"
                placeholder="e.g. Frontend Developer"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Job Type</label>
                <select
                  value={formData.type}
                  onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value as Job['type'] }))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="Job">Job</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Work Mode</label>
                <select
                  value={formData.jobMode}
                  onChange={(event) => setFormData((prev) => ({ ...prev, jobMode: event.target.value as NonNullable<Job['jobMode']> }))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Package / Stipend"
                placeholder="e.g. INR 4.5 LPA / INR 15,000 per month"
                value={formData.packageOrStipend}
                onChange={(event) => setFormData((prev) => ({ ...prev, packageOrStipend: event.target.value }))}
              />
              <Input
                label="Required Skills"
                placeholder="e.g. React, Node.js, SQL"
                value={formData.requiredSkills}
                onChange={(event) => setFormData((prev) => ({ ...prev, requiredSkills: event.target.value }))}
                icon={<ListChecks className="h-4 w-4" />}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                className="h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Job description and requirements..."
              />
            </div>
            <Input
              label="Eligibility"
              value={formData.eligibility}
              onChange={(event) => setFormData((prev) => ({ ...prev, eligibility: event.target.value }))}
              placeholder="e.g. CGPA 6+ and no active backlogs"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Application Deadline"
                type="date"
                value={formData.lastDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, lastDate: event.target.value }))}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value as Job['status'] }))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setModalErrorMessage('');
          }}
          title="Delete Job Posting"
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setModalErrorMessage('');
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteJob}>
                Delete
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            {modalErrorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalErrorMessage}
              </div>
            )}
            <p className="text-slate-600">
              Are you sure you want to delete this job posting? This will also remove all associated applications.
            </p>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { StatusDot } from '../../components/ui/StatusDot';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { MoreHorizontal, Plus, Users } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Job' as Job['type'],
    eligibility: '',
    packageOrStipend: '',
    lastDate: '',
    status: 'Open' as Job['status']
  });
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
    setFormData({
      title: '',
      description: '',
      type: 'Job',
      eligibility: '',
      packageOrStipend: '',
      lastDate: '',
      status: 'Open'
    });
    setIsJobModalOpen(true);
  };
  const openEditModal = (job: Job): void => {
    setSelectedJob(job);
    setModalErrorMessage('');
    setFormData({
      title: job.title,
      description: job.description,
      type: job.type,
      eligibility: job.eligibility,
      packageOrStipend: job.packageOrStipend,
      lastDate: job.lastDate.slice(0, 10),
      status: job.status
    });
    setIsJobModalOpen(true);
  };
  const handleSaveJob = async (): Promise<void> => {
    try {
      if (selectedJob) {
        await updateCompanyJob(selectedJob._id, formData);
      } else {
        await createCompanyJob(formData as Omit<Job, "_id">);
      }
      setModalErrorMessage('');
      setIsJobModalOpen(false);
      await loadJobs();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to save job');
    }
  };
  const handleDeleteJob = async (jobId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this job? All associated applications will also be removed.')) return;
    try {
      await deleteCompanyJob(jobId);
      await loadJobs();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete job');
    }
  };
  const rows = useMemo(
    () =>
      jobs.map((job) => ({
        ...job,
        id: job._id,
        applications: applicantsByJobId[job._id] || 0,
        deadline: new Date(job.lastDate).toLocaleDateString()
      })),
    [jobs, applicantsByJobId]
  );

  const columns = [
  {
    key: 'title',
    header: 'Job Title',
    sortable: true
  },
  {
    key: 'type',
    header: 'Type',
    sortable: true
  },
  {
    key: 'applications',
    header: 'Applications',
    render: (item: any) =>
    <span className="inline-flex items-center gap-1 font-medium text-slate-900">
          <Users className="h-4 w-4 text-slate-400" />
          {item.applications}
        </span>

  },
  {
    key: 'deadline',
    header: 'Deadline',
    sortable: true
  },
  {
    key: 'status',
    header: 'Status',
    render: (item: any) =>
    <StatusDot
      status={item.status === 'Open' ? 'success' : 'error'}
      label={item.status} />


  }];

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
      breadcrumbs={[
      {
        label: 'My Job Postings'
      }]
      }>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              My Job Postings
            </h1>
            <p className="text-slate-600">
              Manage your job listings and view applicants.
            </p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={openCreateModal}>
            Post New Job
          </Button>
        </div>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <DataTable
          data={rows}
          columns={columns}
          keyField="id"
          actions={(item) =>
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
              onClick: () => handleDeleteJob((item as Job)._id)
            }]
            }
            trigger={
            <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
            } />

          } />
        <Modal
          isOpen={isJobModalOpen}
          onClose={() => {
            setIsJobModalOpen(false);
            setModalErrorMessage('');
          }}
          title={selectedJob ? 'Edit Job' : 'Post New Job'}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsJobModalOpen(false);
                  setModalErrorMessage('');
                }}>
                Cancel
              </Button>
              <Button onClick={handleSaveJob}>
                Save Job
              </Button>
            </>
          }>
          <div className="space-y-4">
            {modalErrorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalErrorMessage}
              </div>
            )}
            <Input
              label="Job Title"
              value={formData.title}
              onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value as Job['type'] }))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none">
                  <option value="Job">Job</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <Input
                label="Package/Stipend"
                placeholder="e.g. INR 4.5 LPA / INR 15,000 per month"
                value={formData.packageOrStipend}
                onChange={(event) => setFormData((prev) => ({ ...prev, packageOrStipend: event.target.value }))}
              />
            </div>
            <Input
              label="Eligibility"
              value={formData.eligibility}
              onChange={(event) => setFormData((prev) => ({ ...prev, eligibility: event.target.value }))}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                className="h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Last Date"
                type="date"
                value={formData.lastDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, lastDate: event.target.value }))}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value as Job['status'] }))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none">
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>);

}
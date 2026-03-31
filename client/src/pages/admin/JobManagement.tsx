import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { StatusDot } from '../../components/ui/StatusDot';
import { Plus, MoreHorizontal, Edit, Trash, Briefcase } from 'lucide-react';
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
export function JobManagement({ onNavigate, onLogout }: JobManagementProps) {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    companyId: '',
    title: '',
    description: '',
    type: 'Job' as Job['type'],
    eligibility: '',
    packageOrStipend: '',
    lastDate: '',
    status: 'Open' as Job['status']
  });
  const loadData = async (): Promise<void> => {
    try {
      const [jobsResponse, companiesResponse] = await Promise.all([getAdminJobs(), getAdminCompanies()]);
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
    key: 'packageOrStipend',
    header: 'Package'
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
    render: (item: Job) =>
    <StatusDot
      status={
      item.status === 'Open' ?
      'success' :
      'error'
      }
      label={
      item.status === 'Open' ?
      'Open' :
      'Closed'
      } />


  }];
  const handleOpenCreate = (): void => {
    setSelectedJob(null);
    setModalErrorMessage('');
    setFormData({
      companyId: '',
      title: '',
      description: '',
      type: 'Job',
      eligibility: '',
      packageOrStipend: '',
      lastDate: '',
      status: 'Open'
    });
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
      eligibility: job.eligibility,
      packageOrStipend: job.packageOrStipend,
      lastDate: job.lastDate.slice(0, 10),
      status: job.status
    });
    setIsAddModalOpen(true);
  };
  const handleSaveJob = async (): Promise<void> => {
    try {
      if (selectedJob) {
        await updateAdminJob(selectedJob._id, formData);
      } else {
        await createAdminJob(formData as Omit<Job, '_id'>);
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
      user={{
        name: user?.name || 'Admin',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'Job Management'
      }]
      }>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Job Postings</h1>
            <p className="text-slate-600">
              Manage job and internship listings.
            </p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={handleOpenCreate}>

            Post New Job
          </Button>
        </div>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <DataTable
          data={jobs.map((job) => ({ ...job, id: job._id }))}
          columns={columns}
          keyField="id"
          actions={(item: Job) =>
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
            }]
            }
            trigger={
            <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
            } />

          } />


        {/* Add/Edit Modal */}
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
                }}>
                Cancel
              </Button>
              <Button onClick={handleSaveJob}>
                Publish Job
              </Button>
            </>
          }>

          <div className="space-y-4">
            {modalErrorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalErrorMessage}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Company
                </label>
                <select
                  value={formData.companyId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, companyId: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none">
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>{company.name}</option>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Job Type
                </label>
                <select
                  value={formData.type}
                  onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value as Job['type'] }))}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none">
                  <option value="Job">Job</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <Input
                label="Package / Stipend"
                placeholder="e.g. INR 4.5 LPA / INR 15,000 per month"
                value={formData.packageOrStipend}
                onChange={(event) => setFormData((prev) => ({ ...prev, packageOrStipend: event.target.value }))}
              />

            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                className="h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                placeholder="Job description and requirements...">
              </textarea>
            </div>
            <Input
              label="Eligibility"
              value={formData.eligibility}
              onChange={(event) => setFormData((prev) => ({ ...prev, eligibility: event.target.value }))}
              placeholder="e.g. CGPA 6+ and no active backlogs"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Application Deadline"
                type="date"
                value={formData.lastDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, lastDate: event.target.value }))}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Status
                </label>
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

        {/* Delete Modal */}
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
              }}>

                Cancel
              </Button>
              <Button
              variant="danger"
              onClick={handleDeleteJob}>

                Delete
              </Button>
            </>
          }>

          <div className="space-y-3">
            {modalErrorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {modalErrorMessage}
              </div>
            )}
            <p className="text-slate-600">
              Are you sure you want to delete this job posting? This will also
              remove all associated applications.
            </p>
          </div>
        </Modal>
      </div>
    </DashboardLayout>);

}

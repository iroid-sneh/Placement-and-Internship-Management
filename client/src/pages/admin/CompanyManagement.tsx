import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createAdminCompany,
  deleteAdminCompany,
  getAdminCompanies,
  updateAdminCompany
} from '../../services/api/admin';
import type { Company } from '../../types/app';

interface CompanyManagementProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const DEFAULT_FORM = {
  name: '',
  hrName: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  industry: '',
  description: ''
};

export function CompanyManagement({
  onNavigate,
  onLogout
}: CompanyManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });

  const totalCompanies = companies.length;
  const companiesWithWebsites = companies.filter((company) => Boolean(company.website)).length;
  const industriesCovered = new Set(
    companies.map((company) => company.industry).filter(Boolean)
  ).size;

  const loadCompanies = async (): Promise<void> => {
    try {
      const response = await getAdminCompanies();
      setCompanies(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load companies');
    }
  };

  useEffect(() => {
    void loadCompanies();
  }, []);

  const columns = [
    { key: 'name', header: 'Company Name', sortable: true },
    { key: 'hrName', header: 'HR Contact', sortable: true },
    { key: 'email', header: 'Email' },
    {
      key: 'industry',
      header: 'Industry',
      sortable: true,
      render: (item: Company) => item.industry || '-'
    },
    { key: 'phone', header: 'Phone' },
    { key: 'location', header: 'Location', sortable: true },
    {
      key: 'website',
      header: 'Website',
      render: (item: Company) =>
        item.website ? (
          <a
            href={item.website}
            target="_blank"
            rel="noreferrer"
            className="text-teal-600 hover:text-teal-700 hover:underline"
          >
            Visit
          </a>
        ) : (
          '-'
        )
    }
  ];

  const handleOpenCreate = (): void => {
    setSelectedCompany(null);
    setModalErrorMessage('');
    setFormData({ ...DEFAULT_FORM });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (company: Company): void => {
    setSelectedCompany(company);
    setModalErrorMessage('');
    setFormData({
      name: company.name,
      hrName: company.hrName,
      email: company.email,
      phone: company.phone,
      location: company.location,
      website: company.website || '',
      industry: company.industry || '',
      description: company.description || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveCompany = async (): Promise<void> => {
    try {
      if (selectedCompany) {
        await updateAdminCompany(selectedCompany._id, formData);
      } else {
        await createAdminCompany(formData);
      }
      setModalErrorMessage('');
      setIsAddModalOpen(false);
      await loadCompanies();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to save company');
    }
  };

  const handleDeleteCompany = async (): Promise<void> => {
    if (!selectedCompany) return;
    try {
      await deleteAdminCompany(selectedCompany._id);
      setModalErrorMessage('');
      setIsDeleteModalOpen(false);
      setSelectedCompany(null);
      await loadCompanies();
    } catch (error) {
      setModalErrorMessage(error instanceof Error ? error.message : 'Failed to delete company');
    }
  };

  return (
    <DashboardLayout
      userRole="admin"
      currentPath="companies"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{ name: user?.name || 'Admin', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Company Management' }]}
    >
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                Company Management
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Recruiting Partners</h1>
                <p className="mt-2 text-sm text-slate-200 sm:text-base">
                  Manage company profiles, contact details, industries, and hiring-ready records from a single admin view.
                </p>
              </div>
            </div>
            <Button
              className="h-12 rounded-2xl border border-white/15 bg-white/10 px-5 text-white shadow-none backdrop-blur hover:bg-white/15"
              icon={<Plus className="h-4 w-4" />}
              onClick={handleOpenCreate}
            >
              Add Company
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Companies</p>
                <p className="text-2xl font-bold text-slate-900">{totalCompanies}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Websites Added</p>
                <p className="text-2xl font-bold text-slate-900">{companiesWithWebsites}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Industries</p>
                <p className="text-2xl font-bold text-slate-900">{industriesCovered}</p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          title="Company Directory"
          data={companies.map((company) => ({ ...company, id: company._id }))}
          columns={columns}
          keyField="id"
          actions={(item: Company) => (
            <DropdownMenu
              items={[
                {
                  label: 'Edit Details',
                  icon: <Edit className="h-4 w-4" />,
                  onClick: () => handleOpenEdit(item)
                },
                {
                  label: 'Delete',
                  icon: <Trash className="h-4 w-4" />,
                  variant: 'danger',
                  onClick: () => {
                    setSelectedCompany(item);
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
          title={selectedCompany ? 'Edit Company' : 'Add New Company'}
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
              <Button onClick={handleSaveCompany}>Save Company</Button>
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
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white">
                  {(formData.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">{formData.name || 'Company Name'}</p>
                  <p className="text-sm text-slate-500">{formData.industry || 'Industry not specified'}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Company Name"
                placeholder="TechCorp Inc."
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                icon={<Building2 className="h-4 w-4" />}
              />
              <Input
                label="HR Contact Name"
                placeholder="Jane Doe"
                value={formData.hrName}
                onChange={(event) => setFormData((prev) => ({ ...prev, hrName: event.target.value }))}
                icon={<User className="h-4 w-4" />}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                placeholder="hr@company.com"
                value={formData.email}
                disabled={Boolean(selectedCompany)}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                icon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                icon={<Phone className="h-4 w-4" />}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Location"
                placeholder="City, Country or Remote"
                value={formData.location}
                onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
                icon={<MapPin className="h-4 w-4" />}
              />
              <Input
                label="Website"
                placeholder="https://company.com"
                value={formData.website}
                onChange={(event) => setFormData((prev) => ({ ...prev, website: event.target.value }))}
                icon={<Globe className="h-4 w-4" />}
              />
            </div>
            <Input
              label="Industry"
              placeholder="e.g. Information Technology"
              value={formData.industry}
              onChange={(event) => setFormData((prev) => ({ ...prev, industry: event.target.value }))}
              icon={<Briefcase className="h-4 w-4" />}
            />
            {selectedCompany && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Company email is visible here, but admins cannot change it from this page.
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Tell students about this company..."
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setModalErrorMessage('');
          }}
          title="Delete Company"
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
              <Button variant="danger" onClick={handleDeleteCompany}>
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
              Are you sure you want to delete this company? All associated job postings will also be removed.
            </p>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

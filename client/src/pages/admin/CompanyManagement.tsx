import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { Plus, MoreHorizontal, Edit, Trash, Building2 } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    name: '',
    hrName: '',
    email: '',
    phone: '',
    location: ''
  });
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
  {
    key: 'name',
    header: 'Company Name',
    sortable: true
  },
  {
    key: 'hrName',
    header: 'HR Contact',
    sortable: true
  },
  {
    key: 'email',
    header: 'Email'
  },
  {
    key: 'phone',
    header: 'Phone'
  },
  {
    key: 'location',
    header: 'Location',
    sortable: true
  }];
  const handleOpenCreate = (): void => {
    setSelectedCompany(null);
    setModalErrorMessage('');
    setFormData({ name: '', hrName: '', email: '', phone: '', location: '' });
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
      location: company.location
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
      user={{
        name: user?.name || 'Admin',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'Company Management'
      }]
      }>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
            <p className="text-slate-600">
              Manage recruiting partners and companies.
            </p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={handleOpenCreate}>

            Add Company
          </Button>
        </div>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <DataTable
          data={companies.map((company) => ({ ...company, id: company._id }))}
          columns={columns}
          keyField="id"
          actions={(item: Company) =>
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
          title={selectedCompany ? 'Edit Company' : 'Add New Company'}
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
              <Button onClick={handleSaveCompany}>
                Save Company
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
              label="Company Name"
              placeholder="TechCorp Inc."
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              icon={<Building2 className="h-4 w-4" />} />

            <Input
              label="HR Contact Name"
              placeholder="Jane Doe"
              value={formData.hrName}
              onChange={(event) => setFormData((prev) => ({ ...prev, hrName: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="hr@company.com"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              />
              <Input
                label="Phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <Input
              label="Location"
              placeholder="City, Country or Remote"
              value={formData.location}
              onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
            />
          </div>
        </Modal>

        {/* Delete Modal */}
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
              }}>

                Cancel
              </Button>
              <Button
              variant="danger"
              onClick={handleDeleteCompany}>

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
              Are you sure you want to delete this company? All associated job
              postings will also be removed.
            </p>
          </div>
        </Modal>
      </div>
    </DashboardLayout>);

}
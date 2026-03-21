import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import { MoreHorizontal, Eye, Trash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { deleteAdminStudent, getAdminStudents, type AdminStudent } from '../../services/api/admin';
interface StudentManagementProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}
export function StudentManagement({
  onNavigate,
  onLogout
}: StudentManagementProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user } = useAuth();
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const loadStudents = async (): Promise<void> => {
    try {
      const response = await getAdminStudents();
      setStudents(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load students');
    }
  };
  useEffect(() => {
    void loadStudents();
  }, []);

  const columns = [
  {
    key: 'name',
    header: 'Student Name',
    sortable: true
  },
  {
    key: 'enrollment',
    header: 'Enrollment No.',
    sortable: true,
    render: (item: AdminStudent) => item.profile?.enrollmentNumber || '-'
  },
  {
    key: 'department',
    header: 'Department',
    sortable: true,
    render: (item: AdminStudent) => item.profile?.department || '-'
  },
  {
    key: 'cgpa',
    header: 'CGPA',
    sortable: true,
    render: (item: AdminStudent) => item.profile?.cgpa || '-'
  },
  {
    key: 'resume',
    header: 'Resume',
    render: (item: AdminStudent) =>
    item.profile?.resumeUrl ?
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Uploaded
          </span> :

    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Missing
          </span>

  }];
  const handleDeleteStudent = async (): Promise<void> => {
    try {
      await deleteAdminStudent(selectedStudentId);
      setIsDeleteModalOpen(false);
      setSelectedStudentId('');
      await loadStudents();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete student');
    }
  };

  return (
    <DashboardLayout
      userRole="admin"
      currentPath="students"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Admin',
        email: user?.email || ''
      }}
      breadcrumbs={[
      {
        label: 'Student Management'
      }]
      }>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Students</h1>
            <p className="text-slate-600">
              Manage student records and profiles.
            </p>
          </div>
          <div />
        </div>
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <DataTable
          data={students}
          columns={columns}
          keyField="id"
          actions={(item: AdminStudent) =>
          <DropdownMenu
            items={[
            {
              label: 'View Profile',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => onNavigate(`students/${item.id}`)
            },
            {
              label: 'Delete',
              icon: <Trash className="h-4 w-4" />,
              variant: 'danger',
              onClick: () => {
                setSelectedStudentId(item.id);
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

        {/* Delete Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Student"
          footer={
          <>
              <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}>

                Cancel
              </Button>
              <Button
              variant="danger"
              onClick={handleDeleteStudent}>

                Delete
              </Button>
            </>
          }>

          <p className="text-slate-600">
            Are you sure you want to delete this student record? This action
            cannot be undone.
          </p>
        </Modal>
      </div>
    </DashboardLayout>);

}
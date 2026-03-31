import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DropdownMenu } from '../../components/ui/DropdownMenu';
import {
  MoreHorizontal,
  Eye,
  Trash,
  ExternalLink,
  FileText,
  GraduationCap,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { deleteAdminStudent, getAdminStudents, type AdminStudent } from '../../services/api/admin';

const SERVER_BASE_URL = 'http://localhost:5001';
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

  const totalStudents = students.length;
  const resumeCount = students.filter((student) => Boolean(student.profile?.resumeUrl)).length;
  const activeDepartments = new Set(
    students
      .map((student) => student.profile?.department)
      .filter((department): department is string => Boolean(department))
  ).size;

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
    <a
          href={
            item.profile.resumeUrl.startsWith('http')
              ? item.profile.resumeUrl
              : `${SERVER_BASE_URL}${item.profile.resumeUrl}`
          }
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100"
        >
          <FileText className="h-3.5 w-3.5" />
          View Resume
          <ExternalLink className="h-3.5 w-3.5" />
        </a> :

    <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Not Uploaded
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
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Student Management
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Student Records</h1>
                <p className="mt-2 text-sm text-slate-200 sm:text-base">
                  Review profiles, verify resumes, and manage student placement records from one clean admin workspace.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">Students</p>
                <p className="mt-1 text-2xl font-semibold">{totalStudents}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">Resumes</p>
                <p className="mt-1 text-2xl font-semibold">{resumeCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-slate-300">Departments</p>
                <p className="mt-1 text-2xl font-semibold">{activeDepartments}</p>
              </div>
            </div>
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
              <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Students</p>
                <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Resume Uploaded</p>
                <p className="text-2xl font-bold text-slate-900">{resumeCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Departments</p>
                <p className="text-2xl font-bold text-slate-900">{activeDepartments}</p>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          title="Student Directory"
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

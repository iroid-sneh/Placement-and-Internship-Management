import { useEffect, useState } from 'react';
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
          className="admin-pill admin-pill--resume"
        >
          <FileText className="h-3.5 w-3.5" />
          View Resume
          <ExternalLink className="h-3.5 w-3.5" />
        </a> :

    <span className="admin-pill admin-pill--missing">
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
      <div className="admin-page">
        <div className="admin-hero admin-hero--cyan">
          <div className="admin-hero__row">
            <div className="admin-hero__body">
              <span className="admin-hero__eyebrow">
                Student Management
              </span>
              <div>
                <h1 className="admin-hero__title">Student Records</h1>
                <p className="admin-hero__subtitle">
                  Review profiles, verify resumes, and manage student placement records from one clean admin workspace.
                </p>
              </div>
            </div>
            <div className="admin-stat-grid admin-grid--three admin-hero__stats">
              <div className="admin-hero__stat">
                <p className="admin-hero__stat-label">Students</p>
                <p className="admin-hero__stat-value">{totalStudents}</p>
              </div>
              <div className="admin-hero__stat">
                <p className="admin-hero__stat-label">Resumes</p>
                <p className="admin-hero__stat-value">{resumeCount}</p>
              </div>
              <div className="admin-hero__stat">
                <p className="admin-hero__stat-label">Departments</p>
                <p className="admin-hero__stat-value">{activeDepartments}</p>
              </div>
            </div>
          </div>
        </div>
        {errorMessage && (
          <div className="admin-alert admin-alert--error">
            {errorMessage}
          </div>
        )}

        <div className="admin-stat-grid admin-grid--three">
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--teal">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Total Students</p>
                <p className="admin-stat-card__value">{totalStudents}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--blue">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Resume Uploaded</p>
                <p className="admin-stat-card__value">{resumeCount}</p>
              </div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__row">
              <div className="admin-stat-card__icon admin-stat-card__icon--amber">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="admin-stat-card__label">Departments</p>
                <p className="admin-stat-card__value">{activeDepartments}</p>
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
            <button className="company-icon-button" type="button">
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

          <p className="company-page__subtitle">
            Are you sure you want to delete this student record? This action
            cannot be undone.
          </p>
        </Modal>
      </div>
    </DashboardLayout>);

}

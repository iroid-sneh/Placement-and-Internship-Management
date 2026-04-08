import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { StatusDot } from '../../components/ui/StatusDot';
import { useAuth } from '../../context/AuthContext';
import { deleteAdminStudent, getAdminApplications, getAdminStudents, type AdminStudent } from '../../services/api/admin';
import type { Application } from '../../types/app';
import {
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
  Award,
  FileText,
  ExternalLink,
  Trash } from
'lucide-react';

const SERVER_BASE_URL = 'http://localhost:5001';
interface StudentDetailProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
  studentId?: string;
}
export function StudentDetail({
  onNavigate,
  onLogout,
  studentId
}: StudentDetailProps) {
  const { user } = useAuth();
  const [student, setStudent] = useState<AdminStudent | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const loadStudent = async (): Promise<void> => {
    try {
      const [studentsResponse, applicationsResponse] = await Promise.all([
        getAdminStudents(),
        getAdminApplications()
      ]);
      const matchedStudent = studentsResponse.find((item) => item.id === studentId) || null;
      setStudent(matchedStudent);
      if (matchedStudent) {
        const filteredApplications = applicationsResponse.filter(
          (application) => {
            if (typeof application.studentId === 'string') {
              return false;
            }
            const studentApplicationId =
              (application.studentId as { id?: string; _id?: string }).id ||
              (application.studentId as { id?: string; _id?: string })._id ||
              '';
            return studentApplicationId === matchedStudent.id;
          }
        );
        setApplications(filteredApplications);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load student details');
    }
  };
  useEffect(() => {
    void loadStudent();
  }, [studentId]);
  const mappedApplications = useMemo(
    () =>
      applications.map((application) => {
        const job =
          application.jobId && typeof application.jobId !== 'string'
            ? application.jobId
            : null;
        const company =
          job?.companyId && typeof job.companyId !== 'string'
            ? job.companyId.name
            : '-';
        return {
          company,
          role: job?.title || '-',
          status: application.status,
          date: new Date(application.createdAt).toLocaleDateString()
        };
      }),
    [applications]
  );
  const handleDeleteStudent = async (): Promise<void> => {
    if (!student) return;
    if (!confirm(`Are you sure you want to delete ${student.name}? This will also remove their profile and all applications.`)) return;
    try {
      await deleteAdminStudent(student.id);
      onNavigate('students');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete student');
    }
  };
  if (!student) {
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
            label: 'Students',
            href: 'students'
          },
          {
            label: 'Student Detail'
          }
        ]}
      >
        <div className="admin-panel">
          {errorMessage || 'Loading student details...'}
        </div>
      </DashboardLayout>
    );
  }
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
        label: 'Students',
        href: 'students'
      },
      {
        label: student.name
      }]
      }>

      <div className="admin-page admin-page__narrow">
        <Button
          variant="ghost"
          className="admin-page__back"
          onClick={() => onNavigate('students')}
          icon={<ArrowLeft className="h-4 w-4" />}>

          Back to Students
        </Button>

        {/* Profile Header */}
        <div className="admin-profile">
          <div className="admin-profile__header">
            <div className="admin-profile__identity">
              <div className="admin-profile__avatar">
                {student.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="admin-profile__name">{student.name}</h1>
                <p className="admin-profile__subtext">{student.profile?.enrollmentNumber || '-'}</p>
                <div className="admin-profile__meta">
                  <div className="admin-profile__meta-item">
                    <Mail className="h-4 w-4" />
                    {student.email}
                  </div>
                  <div className="admin-profile__meta-item">
                    <Phone className="h-4 w-4" />
                    {student.profile?.phone || '-'}
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-actions-row">
              <Button variant="danger" icon={<Trash className="h-4 w-4" />} onClick={handleDeleteStudent}>
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="admin-detail-layout">
          <div className="admin-section-stack">
            <div className="admin-section">
              <h3 className="admin-section__title">
                <BookOpen className="h-5 w-5 text-teal-600" />
                Academic Information
              </h3>
              <div className="admin-info-grid">
                <div>
                  <p className="admin-info-grid__label">Department</p>
                  <p className="admin-info-grid__value">
                    {student.profile?.department || '-'}
                  </p>
                </div>
                <div>
                  <p className="admin-info-grid__label">Current Semester</p>
                  <p className="admin-info-grid__value">
                    Year {student.profile?.year || '-'}
                  </p>
                </div>
                <div>
                  <p className="admin-info-grid__label">CGPA</p>
                  <p className="admin-info-grid__value">{student.profile?.cgpa || '-'}</p>
                </div>
                <div>
                  <p className="admin-info-grid__label">Backlogs</p>
                  <p className="admin-info-grid__value">0</p>
                </div>
              </div>
            </div>

            <div className="admin-section">
              <h3 className="admin-section__title">
                <Award className="h-5 w-5 text-teal-600" />
                Skills
              </h3>
              <div className="admin-skill-list">
                {(student.profile?.skills || []).map((skill) =>
                <span
                  key={skill}
                  className="admin-pill admin-pill--resume">

                    {skill}
                  </span>
                )}
              </div>
            </div>

            <div className="admin-section">
              <h3 className="admin-section__title">Applied Jobs</h3>
              <div className="admin-application-list">
                {mappedApplications.map((app, i) =>
                <div
                  key={i}
                  className="admin-application-item">

                    <div>
                      <p className="admin-application-item__title">{app.role}</p>
                      <p className="admin-application-item__meta">
                        {app.company} • {app.date}
                      </p>
                    </div>
                    <StatusDot
                    status={
                    app.status === 'Selected' ?
                    'success' :
                    app.status === 'Interview Scheduled' ?
                    'info' :
                    app.status === 'Pending Decision' ?
                    'warning' :
                    app.status === 'Rejected' ?
                    'error' :
                    app.status === 'Shortlisted' ?
                    'warning' :
                    'pending'
                    }
                    label={
                    app.status === 'Interview Scheduled' ?
                    'Interview' :
                    app.status === 'Pending Decision' ?
                    'Pending Decision' :
                    app.status === 'Rejected' ?
                    'Rejected' :
                    app.status === 'Selected' ?
                    'Selected' :
                    'Applied'
                    } />

                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="admin-resume-card">
              <h3 className="admin-section__title">
                <FileText className="h-5 w-5 text-teal-600" />
                Resume
              </h3>
              {student.profile?.resumeUrl ?
              <>
                  <div className="admin-resume-preview">
                    <FileText className="h-12 w-12 text-slate-300" />
                  </div>
                  <a
                    href={
                      student.profile.resumeUrl.startsWith('http')
                        ? student.profile.resumeUrl
                        : `${SERVER_BASE_URL}${student.profile.resumeUrl}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="company-secondary-button"
                  >
                    <FileText className="h-4 w-4" />
                    View Uploaded Resume
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </> :

              <div className="admin-empty-state">
                  <FileText className="h-12 w-12 admin-empty-state__icon" />
                  <p>No resume uploaded</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>);

}

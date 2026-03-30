import React, { useEffect, useMemo, useState } from 'react';
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
  Trash } from
'lucide-react';
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
        const job = typeof application.jobId === 'string' ? null : application.jobId;
        const company = job && typeof job.companyId !== 'string' ? job.companyId.name : '-';
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
        <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-slate-600">
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

      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="pl-0 hover:bg-transparent hover:text-teal-600"
          onClick={() => onNavigate('students')}
          icon={<ArrowLeft className="h-4 w-4" />}>

          Back to Students
        </Button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 text-2xl font-bold">
                {student.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {student.name}
                </h1>
                <p className="text-slate-600">{student.profile?.enrollmentNumber || '-'}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {student.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {student.profile?.phone || '-'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="danger" icon={<Trash className="h-4 w-4" />} onClick={handleDeleteStudent}>
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Academic Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-teal-600" />
                Academic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="font-medium text-slate-900">
                    {student.profile?.department || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Current Semester</p>
                  <p className="font-medium text-slate-900">
                    Year {student.profile?.year || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">CGPA</p>
                  <p className="font-medium text-slate-900">{student.profile?.cgpa || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Backlogs</p>
                  <p className="font-medium text-slate-900">0</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-teal-600" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(student.profile?.skills || []).map((skill) =>
                <span
                  key={skill}
                  className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium border border-teal-100">

                    {skill}
                  </span>
                )}
              </div>
            </div>

            {/* Applications */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Applied Jobs</h3>
              <div className="space-y-3">
                {mappedApplications.map((app, i) =>
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">

                    <div>
                      <p className="font-medium text-slate-900">{app.role}</p>
                      <p className="text-sm text-slate-500">
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

          {/* Resume Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Resume
              </h3>
              {student.profile?.resumeUrl ?
              <>
                  <div className="aspect-[3/4] w-full rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
                    <FileText className="h-12 w-12 text-slate-300" />
                  </div>
                  <Button variant="outline" className="w-full">
                    {student.profile.resumeUrl}
                  </Button>
                </> :

              <div className="text-center py-8 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>No resume uploaded</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>);

}
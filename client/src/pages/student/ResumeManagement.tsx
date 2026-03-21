import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FileText, Upload, Trash2, Eye, Download, CheckCircle } from 'lucide-react';
import {
  deleteStudentResume,
  getStudentProfile,
  uploadStudentResumeFile
} from '../../services/api/student';
import { useAuth } from '../../context/AuthContext';

interface ResumeManagementProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function ResumeManagement({ onNavigate, onLogout }: ResumeManagementProps) {
  const { user } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      try {
        const profile = await getStudentProfile();
        setResumeUrl(profile.resumeUrl || '');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load resume');
      }
    };
    void loadProfile();
  }, []);

  const handleUpload = async (file: File): Promise<void> => {
    setIsUploading(true);
    setErrorMessage('');
    try {
      const profile = await uploadStudentResumeFile(file);
      setResumeUrl(profile.resumeUrl || '');
      setSelectedFile(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    if (!file) {
      return;
    }
    const isPdfFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfFile) {
      setErrorMessage('Please select a PDF file only.');
      setSelectedFile(null);
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);
  };
  const handleUploadSelectedFile = (): void => {
    if (!selectedFile) {
      setErrorMessage('Please select a PDF file first.');
      fileInputRef.current?.click();
      return;
    }
    void handleUpload(selectedFile);
  };
  const handleSelectOrUpload = (): void => {
    if (selectedFile) {
      void handleUpload(selectedFile);
      return;
    }
    fileInputRef.current?.click();
  };
  const resumeLink = resumeUrl.startsWith('/resumes/')
    ? `http://localhost:5001${resumeUrl}`
    : resumeUrl;

  const handleDeleteResume = async (): Promise<void> => {
    try {
      const profile = await deleteStudentResume();
      setResumeUrl(profile.resumeUrl || '');
      setIsDeleteModalOpen(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete resume');
    }
  };

  return (
    <DashboardLayout
      userRole="student"
      currentPath="resume"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Student',
        email: user?.email || ''
      }}
      breadcrumbs={[
        {
          label: 'Resume Management'
        }
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resume Management</h1>
          <p className="text-slate-600">Upload and manage your resume for job applications.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              {errorMessage && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Current Resume
              </h3>
              {resumeUrl ? (
                <div className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-start sm:gap-4">
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="break-all font-medium text-slate-900">{resumeUrl}</h4>
                    <p className="text-sm text-slate-500">PDF uploaded by student</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => window.open(resumeLink, '_blank')}>
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Download className="h-4 w-4" />}
                      onClick={() => window.open(resumeLink, '_blank')}>
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                  No resume uploaded yet.
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleUploadSelectedFile} isLoading={isUploading}>
                  Update Resume
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="font-bold text-slate-900 mb-4">Upload New Version</h3>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-teal-500 hover:bg-teal-50/30 transition-all bg-white">
                <div className="h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center mb-4 text-teal-600">
                  <Upload className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-medium text-slate-900 mb-1">Click to upload</h4>
                <p className="text-slate-500 mb-4">Upload PDF resume (max 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile && (
                  <p className="mb-3 text-sm text-slate-600">{selectedFile.name}</p>
                )}
                <Button onClick={handleSelectOrUpload} isLoading={isUploading}>
                  {selectedFile ? 'Upload File' : 'Select File'}
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-teal-50 rounded-xl p-6 border border-teal-100">
              <h3 className="font-bold text-teal-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Resume Tips
              </h3>
              <ul className="space-y-3 text-sm text-teal-800">
                <li className="flex gap-2"><span className="font-bold">•</span> Keep it under 2 pages</li>
                <li className="flex gap-2"><span className="font-bold">•</span> Use PDF format</li>
                <li className="flex gap-2"><span className="font-bold">•</span> Highlight key projects and skills</li>
                <li className="flex gap-2"><span className="font-bold">•</span> Check grammar and typos</li>
              </ul>
            </div>
          </div>
        </div>
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Resume"
          footer={
            <>
              <Button variant="danger" onClick={handleDeleteResume}>
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
            </>
          }
        >
          <p className="text-slate-600">
            Are you sure you want to delete your resume? You will need a resume before applying.
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
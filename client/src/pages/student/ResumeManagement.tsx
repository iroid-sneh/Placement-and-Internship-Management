import { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { FileText, Upload, Trash2, Eye, Download, CheckCircle } from 'lucide-react';
import { deleteStudentResume, getStudentProfile, uploadStudentResumeFile } from '../../services/api/student';
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
    if (!file) return;
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

  const resumeLink = resumeUrl.startsWith('/resumes/') ? `http://localhost:5001${resumeUrl}` : resumeUrl;
  const downloadLink = resumeUrl.startsWith('/resumes/') ? `http://localhost:5001/api/student/resume/download` : resumeUrl;

  const handleDownloadResume = (): void => {
    const token = localStorage.getItem('token') || '';
    if (token) {
      fetch(downloadLink, { headers: { Authorization: `Bearer ${token}` } })
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = resumeUrl.split('/').pop() || 'resume.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        })
        .catch(() => setErrorMessage('Failed to download resume'));
    }
  };

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
      user={{ name: user?.name || 'Student', email: user?.email || '' }}
      breadcrumbs={[{ label: 'Resume Management' }]}
    >
      <div className="student-page student-page--narrow">
        <div>
          <h1 className="student-page__title">Resume Management</h1>
          <p className="student-page__subtitle">Upload and manage your resume for job applications.</p>
        </div>

        <div className="student-grid student-grid--dashboard">
          <div className="student-dashboard__main">
            <div className="student-card student-card--padded">
              {errorMessage && <div className="student-alert student-alert--error">{errorMessage}</div>}
              <h3 className="student-card__title"><FileText className="h-5 w-5 text-teal-600" />Current Resume</h3>
              {resumeUrl ? (
                <div className="student-application-card">
                  <div className="student-application-card__row">
                    <div className="student-application-card__company">
                      <div className="student-application-card__logo"><FileText className="h-6 w-6 text-red-600" /></div>
                      <div className="student-flex-grow">
                        <h4 className="student-resume-name">{resumeUrl}</h4>
                        <p className="student-page__subtitle">PDF uploaded by student</p>
                      </div>
                    </div>
                    <div className="student-page__actions">
                      <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />} onClick={() => window.open(resumeLink, '_blank')}>View</Button>
                      <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />} onClick={handleDownloadResume}>Download</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="student-alert student-alert--warning">No resume uploaded yet.</div>
              )}
              <div className="student-job-card__actions">
                <Button variant="outline" className="student-flex-grow" onClick={handleUploadSelectedFile} isLoading={isUploading}>Update Resume</Button>
                <Button variant="danger" className="student-flex-grow" icon={<Trash2 className="h-4 w-4" />} onClick={() => setIsDeleteModalOpen(true)}>Delete</Button>
              </div>
            </div>

            <div>
              <h3 className="student-card__title">Upload New Version</h3>
              <div className="student-upload-zone">
                <div className="student-upload-zone__icon"><Upload className="h-8 w-8" /></div>
                <h4 className="student-card__title student-upload-zone__title">Click to upload</h4>
                <p className="student-page__subtitle student-upload-zone__hint">Upload PDF resume (max 5MB)</p>
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="student-hidden-input" />
                {selectedFile && <p className="student-upload-zone__selected-file">{selectedFile.name}</p>}
                <Button onClick={handleSelectOrUpload} isLoading={isUploading}>
                  {selectedFile ? 'Upload File' : 'Select File'}
                </Button>
              </div>
            </div>
          </div>

          <div className="student-dashboard__side">
            <div className="student-tips">
              <h3 className="student-card__title"><CheckCircle className="h-5 w-5" />Resume Tips</h3>
              <ul className="student-tips__list">
                <li>- Keep it under 2 pages</li>
                <li>- Use PDF format</li>
                <li>- Highlight key projects and skills</li>
                <li>- Check grammar and typos</li>
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
              <Button variant="danger" onClick={handleDeleteResume}>Delete</Button>
              <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            </>
          }
        >
          <p className="student-page__subtitle">Are you sure you want to delete your resume? You will need a resume before applying.</p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

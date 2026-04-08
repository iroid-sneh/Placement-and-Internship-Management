import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { getCompanyProfile, updateCompanyProfile } from '../../services/api/company';
import type { Company } from '../../types/app';
import { Building2, Save, Globe, MapPin, Phone, User } from 'lucide-react';

interface CompanyProfileProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function CompanyProfile({ onNavigate, onLogout }: CompanyProfileProps) {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    hrName: '',
    phone: '',
    location: '',
    website: '',
    industry: '',
    description: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getCompanyProfile();
        setCompany(profile);
        setFormData({
          name: profile.name || '',
          hrName: profile.hrName || '',
          phone: profile.phone || '',
          location: profile.location || '',
          website: profile.website || '',
          industry: profile.industry || '',
          description: profile.description || ''
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updated = await updateCompanyProfile(formData);
      setCompany(updated);
      setSuccessMessage('Profile updated successfully');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      userRole="company"
      currentPath="profile"
      onNavigate={onNavigate}
      onLogout={onLogout}
      user={{
        name: user?.name || 'Company',
        email: user?.email || ''
      }}
      breadcrumbs={[{ label: 'Company Profile' }]}
    >
      <div className="company-page">
        <div>
          <h1 className="company-page__title">Company Profile</h1>
          <p className="company-page__subtitle">View and update your company information.</p>
        </div>

        {errorMessage && (
          <div className="company-alert company-alert--error">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="company-alert company-alert--success">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <div className="company-card company-card--padded">
            Loading profile...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="company-form">
            <div className="company-card company-card--padded">
              <div className="company-profile-hero">
                <div className="company-profile-hero__logo">
                  {(formData.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="company-page__title">{formData.name || 'Company Name'}</h2>
                  <p className="company-page__subtitle">{formData.industry || 'Industry not specified'}</p>
                </div>
              </div>

              <div className="company-grid company-grid--forms">
                <Input
                  label="Company Name"
                  icon={<Building2 className="h-4 w-4" />}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="HR / Contact Person"
                  icon={<User className="h-4 w-4" />}
                  value={formData.hrName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hrName: e.target.value }))}
                  required
                />
                <Input
                  label="Phone"
                  icon={<Phone className="h-4 w-4" />}
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
                <Input
                  label="Location"
                  icon={<MapPin className="h-4 w-4" />}
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  required
                />
                <Input
                  label="Website"
                  icon={<Globe className="h-4 w-4" />}
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
                <Input
                  label="Industry"
                  value={formData.industry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g. Information Technology"
                />
              </div>

              <div className="company-field">
                <label className="company-input__label">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="company-textarea"
                  placeholder="Tell candidates about your company..."
                />
              </div>
            </div>

            <div className="company-card company-card--padded">
              <h3 className="company-card__title">Account Information</h3>
              <div className="company-meta-grid">
                <div>
                  <label className="company-input__label">Email</label>
                  <p>{company?.email || user?.email}</p>
                </div>
                {company?.createdAt && (
                  <div>
                    <label className="company-input__label">Member Since</label>
                    <p>
                      {new Date(company.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="company-actions-row">
              <Button type="submit" isLoading={isSaving} icon={<Save className="h-4 w-4" />}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

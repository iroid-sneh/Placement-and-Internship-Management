import React, { useEffect, useState } from 'react';
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
          <p className="text-slate-600">View and update your company information.</p>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
            Loading profile...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Header Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
                  {(formData.name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{formData.name || 'Company Name'}</h2>
                  <p className="text-sm text-slate-500">{formData.industry || 'Industry not specified'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                  placeholder="Tell candidates about your company..."
                />
              </div>
            </div>

            {/* Account Info */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                  <p className="text-sm text-slate-900 font-medium">{company?.email || user?.email}</p>
                </div>
                {company?.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Member Since</label>
                    <p className="text-sm text-slate-900 font-medium">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
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

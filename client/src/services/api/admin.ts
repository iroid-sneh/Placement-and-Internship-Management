import { apiRequest } from "./client";
import type { Application, Company, Job, Notification } from "../../types/app";

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  profile: {
    enrollmentNumber: string;
    department: string;
    year: number;
    phone: string;
    cgpa: number;
    skills: string[];
    resumeUrl: string;
  } | null;
}

export interface ReportStudent {
  id: string;
  name: string;
  email: string;
  department: string;
  cgpa: number;
  skills: string[];
}

export interface ReportSummary {
  totalStudents: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
  selectedCount: number;
  openJobs: number;
  scheduledInterviews: number;
  students: ReportStudent[];
}

export interface AdminSettings {
  email: string;
  notifications: {
    newStudentAlerts: boolean;
    companyApprovals: boolean;
    reportReadyAlerts: boolean;
  };
  preferences: {
    darkMode: boolean;
    autoCloseExpiredJobs: boolean;
    weeklyReportDigest: boolean;
  };
}

export const getAdminStudents = async (): Promise<AdminStudent[]> => {
  const response = await apiRequest<AdminStudent[]>("/admin/students");
  return response.data;
};

export const deleteAdminStudent = async (studentId: string): Promise<void> => {
  await apiRequest(`/admin/students/${studentId}`, {
    method: "DELETE",
  });
};

export const getAdminCompanies = async (): Promise<Company[]> => {
  const response = await apiRequest<Company[]>("/admin/companies");
  return response.data;
};

export const createAdminCompany = async (
  payload: Omit<Company, "_id">
): Promise<Company> => {
  const response = await apiRequest<Company>("/admin/companies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const updateAdminCompany = async (
  companyId: string,
  payload: Partial<Company>
): Promise<Company> => {
  const response = await apiRequest<Company>(`/admin/companies/${companyId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const deleteAdminCompany = async (companyId: string): Promise<void> => {
  await apiRequest(`/admin/companies/${companyId}`, {
    method: "DELETE",
  });
};

export const getAdminJobs = async (): Promise<Job[]> => {
  const response = await apiRequest<Job[]>("/admin/jobs");
  return response.data;
};

export const createAdminJob = async (payload: Omit<Job, "_id">): Promise<Job> => {
  const response = await apiRequest<Job>("/admin/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const updateAdminJob = async (
  jobId: string,
  payload: Partial<Job>
): Promise<Job> => {
  const response = await apiRequest<Job>(`/admin/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const deleteAdminJob = async (jobId: string): Promise<void> => {
  await apiRequest(`/admin/jobs/${jobId}`, {
    method: "DELETE",
  });
};

export const getAdminApplications = async (): Promise<Application[]> => {
  const response = await apiRequest<Application[]>("/admin/applications");
  return response.data;
};

export const updateAdminApplicationStatus = async (
  applicationId: string,
  status: Application["status"],
  interviewDate?: string
): Promise<Application> => {
  const response = await apiRequest<Application>(
    `/admin/applications/${applicationId}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status, interviewDate: interviewDate || null }),
    }
  );
  return response.data;
};

export const getAdminReportSummary = async (): Promise<ReportSummary> => {
  const response = await apiRequest<ReportSummary>("/admin/reports/summary");
  return response.data;
};

export const getAdminSettings = async (): Promise<AdminSettings> => {
  const response = await apiRequest<AdminSettings>("/admin/settings");
  return response.data;
};

export const updateAdminSettings = async (
  payload: Partial<AdminSettings>
): Promise<AdminSettings> => {
  const response = await apiRequest<AdminSettings>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const changeAdminPassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> => {
  if (newPassword !== confirmPassword) {
    throw new Error("New passwords do not match");
  }
  await apiRequest("/admin/settings/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

export const updateAdminEmail = async (
  newEmail: string,
  password: string
): Promise<{ email: string }> => {
  const response = await apiRequest<{ email: string }>("/admin/settings/email", {
    method: "PUT",
    body: JSON.stringify({ newEmail, password }),
  });
  return response.data;
};

// Notifications
export const getAdminNotifications = async (): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> => {
  const response = await apiRequest<{
    notifications: Notification[];
    unreadCount: number;
  }>("/admin/notifications");
  return response.data;
};

export const markAdminNotificationRead = async (id: string): Promise<void> => {
  await apiRequest(`/admin/notifications/${id}/read`, { method: "PUT" });
};

export const markAllAdminNotificationsRead = async (): Promise<void> => {
  await apiRequest("/admin/notifications/read-all", { method: "PUT" });
};

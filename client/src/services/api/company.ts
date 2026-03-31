import { apiRequest } from "./client";
import type { Application, Company, Job, StudentProfileDetail, Notification, CompanySettings } from "../../types/app";

export const getCompanyProfile = async (): Promise<Company> => {
  const response = await apiRequest<Company>("/company/profile");
  return response.data;
};

export const updateCompanyProfile = async (
  payload: Partial<Company>
): Promise<Company> => {
  const response = await apiRequest<Company>("/company/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const getCompanyJobs = async (): Promise<Job[]> => {
  const response = await apiRequest<Job[]>("/company/jobs");
  return response.data;
};

export const createCompanyJob = async (payload: Omit<Job, "_id">): Promise<Job> => {
  const response = await apiRequest<Job>("/company/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const updateCompanyJob = async (
  jobId: string,
  payload: Partial<Job>
): Promise<Job> => {
  const response = await apiRequest<Job>(`/company/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const deleteCompanyJob = async (jobId: string): Promise<void> => {
  await apiRequest(`/company/jobs/${jobId}`, {
    method: "DELETE",
  });
};

export const getCompanyApplicants = async (): Promise<Application[]> => {
  const response = await apiRequest<Application[]>("/company/applicants");
  return response.data;
};

export const updateCompanyApplicantStatus = async (
  applicationId: string,
  status: Application["status"],
  interviewDate?: string
): Promise<Application> => {
  const response = await apiRequest<Application>(
    `/company/applicants/${applicationId}/status`,
    {
      method: "PUT",
      body: JSON.stringify({ status, interviewDate: interviewDate || null }),
    }
  );
  return response.data;
};

export const getStudentProfileById = async (
  studentId: string
): Promise<StudentProfileDetail> => {
  const response = await apiRequest<StudentProfileDetail>(
    `/company/students/${studentId}`
  );
  return response.data;
};

export const getUpcomingInterviews = async (): Promise<Application[]> => {
  const response = await apiRequest<Application[]>("/company/interviews");
  return response.data;
};

// Settings
export const getCompanySettings = async (): Promise<CompanySettings> => {
  const response = await apiRequest<CompanySettings>("/company/settings");
  return response.data;
};

export const updateCompanySettings = async (
  payload: Partial<CompanySettings>
): Promise<CompanySettings> => {
  const response = await apiRequest<CompanySettings>("/company/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const changeCompanyPassword = async (
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string
): Promise<void> => {
  await apiRequest("/company/settings/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
  });
};

export const updateCompanyEmail = async (
  newEmail: string,
  password: string
): Promise<{ email: string }> => {
  const response = await apiRequest<{ email: string }>(
    "/company/settings/update-email",
    {
      method: "POST",
      body: JSON.stringify({ newEmail, password }),
    }
  );
  return response.data;
};

export const deleteCompanyAccount = async (): Promise<void> => {
  await apiRequest("/company/settings/delete-account", {
    method: "DELETE",
  });
};

export const removeAllJobPostings = async (): Promise<{ message: string }> => {
  const response = await apiRequest<{ message: string }>(
    "/company/settings/remove-all-jobs",
    { method: "DELETE" }
  );
  return response.data;
};

export const clearApplicationHistory = async (): Promise<{ message: string }> => {
  const response = await apiRequest<{ message: string }>(
    "/company/settings/clear-applications",
    { method: "DELETE" }
  );
  return response.data;
};

// Notifications
export const getCompanyNotifications = async (): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> => {
  const response = await apiRequest<{
    notifications: Notification[];
    unreadCount: number;
  }>("/company/notifications");
  return response.data;
};

export const markCompanyNotificationRead = async (
  id: string
): Promise<void> => {
  await apiRequest(`/company/notifications/${id}/read`, {
    method: "PUT",
  });
};

export const markAllCompanyNotificationsRead = async (): Promise<void> => {
  await apiRequest("/company/notifications/read-all", {
    method: "PUT",
  });
};

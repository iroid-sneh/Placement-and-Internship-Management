import { apiRequest } from "./client";
import type { Application, Job, Notification, StudentProfile } from "../../types/app";

export const getStudentProfile = async (): Promise<StudentProfile> => {
  const response = await apiRequest<StudentProfile>("/student/profile");
  return response.data;
};

export const updateStudentProfile = async (
  payload: Partial<StudentProfile>
): Promise<StudentProfile> => {
  const response = await apiRequest<StudentProfile>("/student/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
};

export const uploadStudentResume = async (
  resumeUrl: string
): Promise<StudentProfile> => {
  const response = await apiRequest<StudentProfile>("/student/resume", {
    method: "POST",
    body: JSON.stringify({ resumeUrl }),
  });
  return response.data;
};

export const uploadStudentResumeFile = async (
  file: File
): Promise<StudentProfile> => {
  const formData = new FormData();
  formData.append("resume", file);
  const response = await apiRequest<StudentProfile>("/student/resume", {
    method: "POST",
    body: formData,
  });
  return response.data;
};

export const deleteStudentResume = async (): Promise<StudentProfile> => {
  const response = await apiRequest<StudentProfile>("/student/resume", {
    method: "DELETE",
  });
  return response.data;
};

export const getStudentJobs = async (): Promise<Job[]> => {
  const response = await apiRequest<Job[]>("/student/jobs");
  return response.data;
};

export const applyForJob = async (jobId: string): Promise<void> => {
  await apiRequest(`/student/apply/${jobId}`, {
    method: "POST",
  });
};

export const getStudentApplications = async (): Promise<Application[]> => {
  const response = await apiRequest<Application[]>("/student/applications");
  return response.data;
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string
): Promise<void> => {
  await apiRequest("/student/settings/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
  });
};

export const updateEmail = async (
  newEmail: string,
  password: string
): Promise<{ email: string }> => {
  const response = await apiRequest<{ email: string }>(
    "/student/settings/update-email",
    {
      method: "POST",
      body: JSON.stringify({ newEmail, password }),
    }
  );
  return response.data;
};

export const deleteAccount = async (): Promise<void> => {
  await apiRequest("/student/settings/delete-account", {
    method: "DELETE",
  });
};

export const saveNotificationPreferences = async (prefs: {
  jobAlerts: boolean;
  applicationUpdates: boolean;
  interviewNotifications: boolean;
}): Promise<void> => {
  await apiRequest("/student/settings/notification-preferences", {
    method: "POST",
    body: JSON.stringify(prefs),
  });
};

export const saveJobPreferences = async (prefs: {
  preferredRole: string;
  preferredLocation: string;
  expectedSalary: string;
}): Promise<void> => {
  await apiRequest("/student/settings/job-preferences", {
    method: "POST",
    body: JSON.stringify(prefs),
  });
};

export const getStudentNotifications = async (): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> => {
  const response = await apiRequest<{
    notifications: Notification[];
    unreadCount: number;
  }>("/student/notifications");
  return response.data;
};

export const markStudentNotificationRead = async (id: string): Promise<void> => {
  await apiRequest(`/student/notifications/${id}/read`, { method: "PUT" });
};

export const markAllStudentNotificationsRead = async (): Promise<void> => {
  await apiRequest("/student/notifications/read-all", { method: "PUT" });
};

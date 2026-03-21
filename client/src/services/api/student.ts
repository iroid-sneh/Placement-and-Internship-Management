import { apiRequest } from "./client";
import type { Application, Job, StudentProfile } from "../../types/app";

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

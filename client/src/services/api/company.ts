import { apiRequest } from "./client";
import type { Application, Job } from "../../types/app";

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

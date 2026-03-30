import { apiRequest, serverRequest } from "./client";
import type { AuthUser } from "../../types/app";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface StudentRegistrationData {
  role: "student";
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  enrollmentNumber: string;
  department: string;
  year: number;
  phone: string;
  cgpa: number;
  skills: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface CompanyRegistrationData {
  role: "company";
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  hrName: string;
  companyPhone: string;
  location: string;
  website?: string;
  industry?: string;
  description?: string;
}

export const loginUser = async (
  email: string,
  password: string,
  role: "student" | "company"
): Promise<LoginResponse> => {
  const response = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (response.data.user.role !== role) {
    throw new Error("Selected role does not match account role");
  }
  return response.data;
};

export const registerStudent = async (
  data: StudentRegistrationData
): Promise<void> => {
  await apiRequest<null>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const registerCompany = async (
  data: CompanyRegistrationData
): Promise<void> => {
  await apiRequest<null>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const loginAdmin = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await serverRequest<LoginResponse>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (response.data.user.role !== "admin") {
    throw new Error("Invalid admin account");
  }
  return response.data;
};

export const forgotPasswordSendOtp = async (email: string): Promise<void> => {
  await apiRequest<null>("/auth/forgot-password/send-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const forgotPasswordVerifyOtp = async (
  email: string,
  otp: string
): Promise<void> => {
  await apiRequest<null>("/auth/forgot-password/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
};

export const forgotPasswordReset = async (
  email: string,
  otp: string,
  password: string,
  confirmPassword: string
): Promise<void> => {
  await apiRequest<null>("/auth/forgot-password/reset", {
    method: "POST",
    body: JSON.stringify({ email, otp, password, confirmPassword }),
  });
};

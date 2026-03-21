export type UserRole = "student" | "admin" | "company";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface StudentProfile {
  _id: string;
  userId: string;
  enrollmentNumber: string;
  department: string;
  year: number;
  phone: string;
  cgpa: number;
  skills: string[];
  resumeUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  _id: string;
  name: string;
  hrName: string;
  email: string;
  phone: string;
  location: string;
}

export interface Job {
  _id: string;
  companyId: Company | string;
  title: string;
  description: string;
  type: "Job" | "Internship";
  eligibility: string;
  packageOrStipend: string;
  lastDate: string;
  status: "Open" | "Closed";
}

export interface Application {
  _id: string;
  studentId: AuthUser | string;
  jobId: Job | string;
  status: "Applied" | "Shortlisted" | "Interview Scheduled" | "Selected" | "Rejected";
  interviewDate: string | null;
  createdAt: string;
}

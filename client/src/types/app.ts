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
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  notificationPreferences?: {
    jobAlerts: boolean;
    applicationUpdates: boolean;
    interviewNotifications: boolean;
  };
  jobPreferences?: {
    preferredRole: string;
    preferredLocation: string;
    expectedSalary: string;
  };
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
  website?: string;
  industry?: string;
  description?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Job {
  _id: string;
  companyId: Company | string;
  title: string;
  description: string;
  type: "Job" | "Internship";
  jobMode?: "Remote" | "Hybrid" | "Onsite";
  eligibility: string;
  requiredSkills?: string[];
  packageOrStipend: string;
  lastDate: string;
  status: "Open" | "Closed";
}

export interface Application {
  _id: string;
  studentId: AuthUser | string;
  jobId: Job | string;
  status:
    | "Applied"
    | "Shortlisted"
    | "Interview Scheduled"
    | "Pending Decision"
    | "Selected"
    | "Rejected";
  interviewDate: string | null;
  createdAt: string;
}

export interface StudentProfileDetail {
  user: AuthUser;
  profile: StudentProfile | null;
}

export interface Notification {
  _id: string;
  userId: string;
  type:
    | "message"
    | "job"
    | "system"
    | "new_application"
    | "application_status_updated"
    | "interview_scheduled"
    | "interview_reminder"
    | "interview_result_pending"
    | "job_deadline_expired";
  title: string;
  message: string;
  link: string;
  conversationId?: string;
  isRead: boolean;
  relatedApplicationId?: string;
  relatedJobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface ChatAttachment {
  name: string;
  url: string;
  type?: string;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: ChatParticipant;
  senderType: UserRole;
  content: string;
  attachments: ChatAttachment[];
  readBy: string[];
  createdAt: string;
}

export interface ConversationSummary {
  _id: string;
  participants: ChatParticipant[];
  participantTypes: UserRole[];
  counterpart: ChatParticipant | null;
  lastMessage: {
    content: string;
    timestamp: string | null;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatContact {
  userId: string;
  role: Exclude<UserRole, "admin"> | "admin";
  name: string;
  subtitle: string;
}

export interface CompanySettings {
  _id: string;
  companyId: string;
  notifications: {
    applicationNotifications: boolean;
    statusUpdateNotifications: boolean;
  };
  interview: {
    defaultReminder: "1h" | "24h";
    allowRescheduling: boolean;
    enableNotes: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

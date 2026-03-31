import Company from "../models/company.js";
import Job from "../models/job.js";
import Application from "../models/application.js";
import User from "../models/user.js";
import StudentProfile from "../models/studentProfile.js";
import CompanySettings from "../models/companySettings.js";
import Notification from "../models/notification.js";
import {
    syncExpiredInterviewsToPendingDecision,
    validateCompanyApplicantUpdate,
    sendInterviewResultReminders,
    autoSelectExpiredInterviews,
} from "../services/application.service.js";
import {
    closeExpiredJobs,
    validateFutureDeadline,
} from "../services/job.service.js";
import {
    createNotificationForCompany,
    createNotification,
} from "../services/notification.service.js";
import AuthHelper from "../src/common/authHelper.js";

export const getCompanyJobs = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        await closeExpiredJobs({ companyId: company._id });
        const jobs = await Job.find({ companyId: company._id }).sort({
            createdAt: -1,
        });
        return res.status(200).json({
            success: true,
            data: jobs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch company jobs",
            error: error.message,
        });
    }
};

export const getCompanyApplicants = async (req, res) => {
    try {
        await syncExpiredInterviewsToPendingDecision();
        await sendInterviewResultReminders();
        await autoSelectExpiredInterviews();
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        await closeExpiredJobs({ companyId: company._id });
        const jobs = await Job.find({ companyId: company._id }).select("_id");
        const applications = await Application.find({
            jobId: { $in: jobs.map((job) => job._id) },
        })
            .populate("studentId", "name email")
            .populate("jobId", "title")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: applications,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch applicants",
            error: error.message,
        });
    }
};

export const createCompanyJob = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        const {
            title,
            description,
            type,
            eligibility,
            requiredSkills,
            jobMode,
            packageOrStipend,
            lastDate,
            status,
        } = req.body;
        if (
            !title ||
            !description ||
            !type ||
            !packageOrStipend ||
            !lastDate
        ) {
            return res.status(400).json({
                success: false,
                message: "All required job fields are missing",
            });
        }
        const deadlineValidation = validateFutureDeadline(lastDate);
        if (!deadlineValidation.valid) {
            return res.status(400).json({
                success: false,
                message: deadlineValidation.message,
            });
        }
        const job = await Job.create({
            companyId: company._id,
            title: title.trim(),
            description: description.trim(),
            type,
            jobMode: jobMode || "Onsite",
            eligibility: eligibility ? eligibility.trim() : "",
            requiredSkills: Array.isArray(requiredSkills)
                ? requiredSkills.map((s) => String(s).trim()).filter(Boolean)
                : typeof requiredSkills === "string"
                  ? requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
                  : [],
            packageOrStipend: packageOrStipend.trim(),
            lastDate: deadlineValidation.deadline,
            status: status || "Open",
        });
        return res.status(201).json({
            success: true,
            data: job,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create company job",
            error: error.message,
        });
    }
};

export const updateCompanyJob = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        const { id } = req.params;
        const job = await Job.findOne({ _id: id, companyId: company._id });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }
        if (req.body.lastDate !== undefined) {
            const deadlineValidation = validateFutureDeadline(req.body.lastDate);
            if (!deadlineValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message: deadlineValidation.message,
                });
            }
            job.lastDate = deadlineValidation.deadline;
        }
        const fields = [
            "title",
            "description",
            "type",
            "jobMode",
            "eligibility",
            "requiredSkills",
            "packageOrStipend",
            "status",
        ];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                const value = req.body[field];
                if (field === "requiredSkills" && Array.isArray(value)) {
                    job.requiredSkills = value
                        .map((s) => String(s).trim())
                        .filter(Boolean);
                } else if (field === "requiredSkills" && typeof value === "string") {
                    job.requiredSkills = value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                } else if (!["type", "status", "jobMode"].includes(field) && typeof value === "string") {
                    job[field] = value.trim();
                } else {
                    job[field] = value;
                }
            }
        });
        if (job.status === "Open") {
            const deadlineValidation = validateFutureDeadline(job.lastDate);
            if (!deadlineValidation.valid) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Expired jobs cannot be reopened. Please extend the deadline first.",
                });
            }
        }
        await job.save();
        return res.status(200).json({
            success: true,
            data: job,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update company job",
            error: error.message,
        });
    }
};

export const deleteCompanyJob = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        const { id } = req.params;
        const job = await Job.findOne({ _id: id, companyId: company._id });
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }
        await Application.deleteMany({ jobId: job._id });
        await Job.deleteOne({ _id: job._id });
        return res.status(200).json({
            success: true,
            message: "Job deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete company job",
            error: error.message,
        });
    }
};

export const updateCompanyApplicantStatus = async (req, res) => {
    try {
        await syncExpiredInterviewsToPendingDecision();
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        const { id } = req.params;
        const { status, interviewDate } = req.body;
        const application = await Application.findById(id).populate("jobId");
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
            });
        }
        const applicationJob = application.jobId;
        if (
            !applicationJob ||
            applicationJob.companyId?.toString() !== company._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this application",
            });
        }
        const validation = validateCompanyApplicantUpdate(application, {
            status,
            interviewDate,
        });
        if (!validation.ok) {
            return res.status(400).json({
                success: false,
                message: validation.message,
            });
        }
        if (status) {
            application.status = status;
        }
        if (validation.interviewDate !== undefined) {
            application.interviewDate = validation.interviewDate;
        }
        if (
            status &&
            status !== "Interview Scheduled" &&
            interviewDate === undefined
        ) {
            application.interviewDate = null;
        }
        await application.save();

        const studentUserId =
            typeof application.studentId === "string"
                ? application.studentId
                : application.studentId.toString();
        const jobTitle = applicationJob.title || "the position";

        if (status === "Interview Scheduled") {
            await createNotification({
                userId: studentUserId,
                type: "interview_scheduled",
                title: "Interview Scheduled",
                message: `Your interview for ${jobTitle} at ${company.name} has been scheduled`,
                link: "applications",
                relatedApplicationId: application._id,
            });
        } else if (status) {
            const statusMessages = {
                Shortlisted: `You have been shortlisted for ${jobTitle} at ${company.name}`,
                Selected: `Congratulations! You have been selected for ${jobTitle} at ${company.name}`,
                Rejected: `Your application for ${jobTitle} at ${company.name} has been updated`,
            };
            if (statusMessages[status]) {
                await createNotification({
                    userId: studentUserId,
                    type: "application_status_updated",
                    title: "Application Status Updated",
                    message: statusMessages[status],
                    link: "applications",
                    relatedApplicationId: application._id,
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: application,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update applicant status",
            error: error.message,
        });
    }
};

export const getCompanyProfile = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: company,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch company profile",
            error: error.message,
        });
    }
};

export const updateCompanyProfile = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        const updatableFields = [
            "name",
            "hrName",
            "phone",
            "location",
            "website",
            "industry",
            "description",
        ];
        updatableFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                company[field] =
                    typeof req.body[field] === "string"
                        ? req.body[field].trim()
                        : req.body[field];
            }
        });
        await company.save();
        return res.status(200).json({
            success: true,
            message: "Company profile updated successfully",
            data: company,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update company profile",
            error: error.message,
        });
    }
};

export const getStudentProfileById = async (req, res) => {
    try {
        const { studentId } = req.params;
        const user = await User.findById(studentId).select("name email");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }
        const profile = await StudentProfile.findOne({ userId: studentId });
        return res.status(200).json({
            success: true,
            data: {
                user,
                profile: profile || null,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch student profile",
            error: error.message,
        });
    }
};

export const getUpcomingInterviews = async (req, res) => {
    try {
        await syncExpiredInterviewsToPendingDecision();
        await sendInterviewResultReminders();
        await autoSelectExpiredInterviews();
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        const jobs = await Job.find({ companyId: company._id }).select("_id");
        const applications = await Application.find({
            jobId: { $in: jobs.map((j) => j._id) },
            status: "Interview Scheduled",
            interviewDate: { $ne: null },
        })
            .populate("studentId", "name email")
            .populate("jobId", "title")
            .sort({ interviewDate: 1 });
        return res.status(200).json({
            success: true,
            data: applications,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch upcoming interviews",
            error: error.message,
        });
    }
};

export const getCompanySettings = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        let settings = await CompanySettings.findOne({ companyId: company._id });
        if (!settings) {
            settings = await CompanySettings.create({ companyId: company._id });
        }
        return res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch settings",
            error: error.message,
        });
    }
};

export const updateCompanySettings = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        let settings = await CompanySettings.findOne({ companyId: company._id });
        if (!settings) {
            settings = await CompanySettings.create({ companyId: company._id });
        }
        if (req.body.notifications) {
            settings.notifications = {
                ...settings.notifications.toObject(),
                ...req.body.notifications,
            };
        }
        if (req.body.interview) {
            settings.interview = {
                ...settings.interview.toObject(),
                ...req.body.interview,
            };
        }
        await settings.save();
        return res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            data: settings,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update settings",
            error: error.message,
        });
    }
};

export const changeCompanyPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const isValid = await AuthHelper.matchHashedPassword(
            currentPassword,
            user.password
        );
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }
        user.password = await AuthHelper.hashPassword(newPassword);
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to change password",
            error: error.message,
        });
    }
};

export const updateCompanyEmail = async (req, res) => {
    try {
        const { newEmail, password } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const isValid = await AuthHelper.matchHashedPassword(
            password,
            user.password
        );
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Password is incorrect",
            });
        }
        const normalizedEmail = newEmail.toLowerCase().trim();
        if (normalizedEmail === user.email) {
            return res.status(400).json({
                success: false,
                message: "New email must be different from current email",
            });
        }
        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: user._id },
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "This email is already in use",
            });
        }
        user.email = normalizedEmail;
        await user.save();
        const company = await Company.findOne({ userId: user._id });
        if (company) {
            company.email = normalizedEmail;
            await company.save();
        }
        return res.status(200).json({
            success: true,
            message: "Email updated successfully",
            data: { email: user.email },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update email",
            error: error.message,
        });
    }
};

export const deleteCompanyAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const company = await Company.findOne({ userId });
        if (company) {
            const jobs = await Job.find({ companyId: company._id }).select("_id");
            const jobIds = jobs.map((j) => j._id);
            await Application.deleteMany({ jobId: { $in: jobIds } });
            await Job.deleteMany({ companyId: company._id });
            await CompanySettings.deleteOne({ companyId: company._id });
            await Company.deleteOne({ _id: company._id });
        }
        await Notification.deleteMany({ userId });
        await User.deleteOne({ _id: userId });
        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete account",
            error: error.message,
        });
    }
};

export const removeAllJobPostings = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        const jobs = await Job.find({ companyId: company._id }).select("_id");
        const jobIds = jobs.map((j) => j._id);
        await Application.deleteMany({ jobId: { $in: jobIds } });
        const result = await Job.deleteMany({ companyId: company._id });
        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} job posting(s) removed successfully`,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to remove job postings",
            error: error.message,
        });
    }
};

export const clearApplicationHistory = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
        const jobs = await Job.find({ companyId: company._id }).select("_id");
        const jobIds = jobs.map((j) => j._id);
        const result = await Application.deleteMany({ jobId: { $in: jobIds } });
        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} application(s) cleared successfully`,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to clear application history",
            error: error.message,
        });
    }
};

export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification.countDocuments({
            userId: req.user.id,
            isRead: false,
        });
        return res.status(200).json({
            success: true,
            data: { notifications, unreadCount },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message,
        });
    }
};

export const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { isRead: true }
        );
        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
            error: error.message,
        });
    }
};

export const markAllNotificationsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );
        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to mark notifications as read",
            error: error.message,
        });
    }
};

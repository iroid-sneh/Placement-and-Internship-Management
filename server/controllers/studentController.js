import StudentProfile from "../models/studentProfile.js";
import User from "../models/user.js";
import Application from "../models/application.js";
import Job from "../models/job.js";
import Company from "../models/company.js";
import { syncExpiredInterviewsToPendingDecision } from "../services/application.service.js";
import AuthHelper from "../src/common/authHelper.js";
import fs from "fs";
import path from "path";
import { PUBLIC_ROOT } from "../constants/paths.js";
import { closeExpiredJobs } from "../services/job.service.js";

export const getStudentProfile = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch profile",
            error: error.message,
        });
    }
};

export const updateStudentProfile = async (req, res) => {
    try {
        const { enrollmentNumber, department, year, phone, cgpa, skills } =
            req.body;
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found",
            });
        }
        if (enrollmentNumber !== undefined) {
            const existingEnrollment = await StudentProfile.findOne({
                enrollmentNumber,
                userId: { $ne: req.user.id },
            }).select("_id");

            if (existingEnrollment) {
                return res.status(409).json({
                    success: false,
                    message: "Enrollment number already exists",
                });
            }
            profile.enrollmentNumber = enrollmentNumber.trim();
        }
        if (department !== undefined) profile.department = department.trim();
        if (year !== undefined) profile.year = year;
        if (phone !== undefined) profile.phone = phone.trim();
        if (cgpa !== undefined) profile.cgpa = cgpa;
        if (Array.isArray(skills)) {
            profile.skills = skills
                .map((skill) => String(skill).trim())
                .filter(Boolean);
        }
        await profile.save();
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: profile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message,
        });
    }
};

export const uploadResume = async (req, res) => {
    try {
        const { resumeUrl } = req.body;
        const fileResumeUrl = req.file
            ? `/resumes/${req.file.filename}`
            : "";
        const finalResumeUrl = fileResumeUrl || resumeUrl;
        if (!finalResumeUrl) {
            return res.status(400).json({
                success: false,
                message: "Resume file or resumeUrl is required",
            });
        }
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found",
            });
        }
        if (
            profile.resumeUrl &&
            profile.resumeUrl.startsWith("/resumes/")
        ) {
            const oldResumePath = path.join(
                PUBLIC_ROOT,
                profile.resumeUrl.replace(/^\/+/, "")
            );
            if (fs.existsSync(oldResumePath)) {
                fs.unlinkSync(oldResumePath);
            }
        }
        profile.resumeUrl = finalResumeUrl;
        await profile.save();
        return res.status(200).json({
            success: true,
            message: "Resume updated successfully",
            data: profile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to upload resume",
            error: error.message,
        });
    }
};

export const deleteResume = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found",
            });
        }
        if (
            profile.resumeUrl &&
            profile.resumeUrl.startsWith("/resumes/")
        ) {
            const resumePath = path.join(
                PUBLIC_ROOT,
                profile.resumeUrl.replace(/^\/+/, "")
            );
            if (fs.existsSync(resumePath)) {
                fs.unlinkSync(resumePath);
            }
        }
        profile.resumeUrl = "";
        await profile.save();
        return res.status(200).json({
            success: true,
            message: "Resume deleted successfully",
            data: profile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete resume",
            error: error.message,
        });
    }
};

export const downloadResume = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        if (!profile || !profile.resumeUrl) {
            return res.status(404).json({
                success: false,
                message: "No resume found",
            });
        }

        if (!profile.resumeUrl.startsWith("/resumes/")) {
            return res.redirect(profile.resumeUrl);
        }

        const filePath = path.join(
            PUBLIC_ROOT,
            profile.resumeUrl.replace(/^\/+/, "")
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "Resume file not found on server",
            });
        }

        const originalName = path.basename(profile.resumeUrl);
        return res.download(filePath, originalName);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to download resume",
            error: error.message,
        });
    }
};

export const browseJobs = async (_req, res) => {
    try {
        await closeExpiredJobs();
        const jobs = await Job.find({ status: "Open" })
            .populate("companyId", "name location")
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: jobs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch jobs",
            error: error.message,
        });
    }
};

export const applyToJob = async (req, res) => {
    try {
        await closeExpiredJobs();
        const { jobId } = req.params;
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }
        if (job.status !== "Open") {
            return res.status(400).json({
                success: false,
                message: "Job is closed",
            });
        }
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        if (!profile || !profile.resumeUrl) {
            return res.status(400).json({
                success: false,
                message: "Upload resume before applying",
            });
        }
        const existing = await Application.findOne({
            studentId: req.user.id,
            jobId,
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Already applied for this job",
            });
        }
        const application = await Application.create({
            studentId: req.user.id,
            jobId,
        });
        return res.status(201).json({
            success: true,
            message: "Application submitted successfully",
            data: application,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to apply for job",
            error: error.message,
        });
    }
};

export const getMyApplications = async (req, res) => {
    try {
        await closeExpiredJobs();
        await syncExpiredInterviewsToPendingDecision();
        const applications = await Application.find({ studentId: req.user.id })
            .populate({
                path: "jobId",
                populate: { path: "companyId", model: Company, select: "name location" },
            })
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: applications,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch applications",
            error: error.message,
        });
    }
};

export const changePassword = async (req, res) => {
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
            message: "Password changed successfully. Please login again.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to change password",
            error: error.message,
        });
    }
};

export const updateEmail = async (req, res) => {
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

export const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await StudentProfile.findOne({ userId });
        if (profile) {
            if (profile.resumeUrl && profile.resumeUrl.startsWith("/resumes/")) {
                const resumePath = path.join(
                    PUBLIC_ROOT,
                    profile.resumeUrl.replace(/^\/+/, "")
                );
                if (fs.existsSync(resumePath)) {
                    fs.unlinkSync(resumePath);
                }
            }
            await StudentProfile.deleteOne({ userId });
        }
        await Application.deleteMany({ studentId: userId });
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

export const saveNotificationPreferences = async (req, res) => {
    try {
        const { jobAlerts, applicationUpdates, interviewNotifications } = req.body;
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found",
            });
        }
        profile.notificationPreferences = {
            jobAlerts,
            applicationUpdates,
            interviewNotifications,
        };
        await profile.save();
        return res.status(200).json({
            success: true,
            message: "Notification preferences saved",
            data: profile.notificationPreferences,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to save notification preferences",
            error: error.message,
        });
    }
};

export const saveJobPreferences = async (req, res) => {
    try {
        const { preferredRole, preferredLocation, expectedSalary } = req.body;
        const profile = await StudentProfile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found",
            });
        }
        profile.jobPreferences = {
            preferredRole: preferredRole || "",
            preferredLocation: preferredLocation || "",
            expectedSalary: expectedSalary || "",
        };
        await profile.save();
        return res.status(200).json({
            success: true,
            message: "Job preferences saved",
            data: profile.jobPreferences,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to save job preferences",
            error: error.message,
        });
    }
};

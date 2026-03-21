import StudentProfile from "../models/studentProfile.js";
import Job from "../models/job.js";
import Application from "../models/application.js";
import Company from "../models/company.js";
import fs from "fs";
import path from "path";

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
        if (enrollmentNumber !== undefined) profile.enrollmentNumber = enrollmentNumber;
        if (department !== undefined) profile.department = department;
        if (year !== undefined) profile.year = year;
        if (phone !== undefined) profile.phone = phone;
        if (cgpa !== undefined) profile.cgpa = cgpa;
        if (Array.isArray(skills)) profile.skills = skills;
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
                process.cwd(),
                "public",
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
                process.cwd(),
                "public",
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

export const browseJobs = async (_req, res) => {
    try {
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
        const applications = await Application.find({ studentId: req.user.id })
            .populate({
                path: "jobId",
                populate: { path: "companyId", model: Company, select: "name" },
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

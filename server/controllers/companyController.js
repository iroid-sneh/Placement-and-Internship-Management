import Company from "../models/company.js";
import Job from "../models/job.js";
import Application from "../models/application.js";
import {
    syncExpiredInterviewsToPendingDecision,
    validateCompanyApplicantUpdate,
} from "../services/application.service.js";
import {
    closeExpiredJobs,
    validateFutureDeadline,
} from "../services/job.service.js";

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
            packageOrStipend,
            lastDate,
            status,
        } = req.body;
        if (
            !title ||
            !description ||
            !type ||
            !eligibility ||
            !packageOrStipend ||
            !lastDate
        ) {
            return res.status(400).json({
                success: false,
                message: "All job fields are required",
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
            eligibility: eligibility.trim(),
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
            "eligibility",
            "packageOrStipend",
            "status",
        ];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                const value = req.body[field];
                job[field] =
                    typeof value === "string" &&
                    !["type", "status"].includes(field)
                        ? value.trim()
                        : value;
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

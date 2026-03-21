import Company from "../models/company.js";
import Job from "../models/job.js";
import Application from "../models/application.js";

export const getCompanyJobs = async (req, res) => {
    try {
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
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
        const company = await Company.findOne({ userId: req.user.id });
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company profile not found",
            });
        }
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
        const job = await Job.create({
            companyId: company._id,
            title,
            description,
            type,
            eligibility,
            packageOrStipend,
            lastDate,
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
        const fields = [
            "title",
            "description",
            "type",
            "eligibility",
            "packageOrStipend",
            "lastDate",
            "status",
        ];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                job[field] = req.body[field];
            }
        });
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
        if (status) {
            application.status = status;
        }
        if (interviewDate !== undefined) {
            application.interviewDate = interviewDate || null;
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

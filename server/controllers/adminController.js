import User from "../models/user.js";
import StudentProfile from "../models/studentProfile.js";
import Company from "../models/company.js";
import Job from "../models/job.js";
import Application from "../models/application.js";

export const getStudents = async (_req, res) => {
    try {
        const students = await User.find({ role: "student" })
            .select("-password")
            .sort({ createdAt: -1 });
        const profiles = await StudentProfile.find({
            userId: { $in: students.map((student) => student._id) },
        });
        const profileMap = new Map(
            profiles.map((profile) => [profile.userId.toString(), profile])
        );
        const result = students.map((student) => ({
            id: student._id,
            name: student.name,
            email: student.email,
            isActive: student.isActive,
            profile: profileMap.get(student._id.toString())
                ? {
                      enrollmentNumber:
                          profileMap.get(student._id.toString()).enrollmentNumber,
                      department:
                          profileMap.get(student._id.toString()).department,
                      year: profileMap.get(student._id.toString()).year,
                      phone: profileMap.get(student._id.toString()).phone,
                      cgpa: profileMap.get(student._id.toString()).cgpa,
                      skills: profileMap.get(student._id.toString()).skills || [],
                      resumeUrl:
                          profileMap.get(student._id.toString()).resumeUrl || "",
                  }
                : null,
        }));
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch students",
            error: error.message,
        });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await User.findOne({ _id: id, role: "student" });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }
        await StudentProfile.deleteOne({ userId: student._id });
        await Application.deleteMany({ studentId: student._id });
        await User.deleteOne({ _id: student._id });
        return res.status(200).json({
            success: true,
            message: "Student deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete student",
            error: error.message,
        });
    }
};

export const createCompany = async (req, res) => {
    try {
        const { name, hrName, email, phone, location } = req.body;
        if (!name || !hrName || !email || !phone || !location) {
            return res.status(400).json({
                success: false,
                message: "All company fields are required",
            });
        }
        const existing = await Company.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Company email already exists",
            });
        }
        const company = await Company.create({
            name,
            hrName,
            email: email.toLowerCase(),
            phone,
            location,
        });
        return res.status(201).json({
            success: true,
            data: company,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create company",
            error: error.message,
        });
    }
};

export const getCompanies = async (_req, res) => {
    try {
        const companies = await Company.find({}).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: companies,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch companies",
            error: error.message,
        });
    }
};

export const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, hrName, email, phone, location } = req.body;
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }
        if (name !== undefined) company.name = name;
        if (hrName !== undefined) company.hrName = hrName;
        if (email !== undefined) company.email = email.toLowerCase();
        if (phone !== undefined) company.phone = phone;
        if (location !== undefined) company.location = location;
        await company.save();
        return res.status(200).json({
            success: true,
            data: company,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update company",
            error: error.message,
        });
    }
};

export const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }
        const jobs = await Job.find({ companyId: company._id });
        await Application.deleteMany({ jobId: { $in: jobs.map((job) => job._id) } });
        await Job.deleteMany({ companyId: company._id });
        await Company.deleteOne({ _id: company._id });
        return res.status(200).json({
            success: true,
            message: "Company deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete company",
            error: error.message,
        });
    }
};

export const createJob = async (req, res) => {
    try {
        const {
            companyId,
            title,
            description,
            type,
            eligibility,
            packageOrStipend,
            lastDate,
            status,
        } = req.body;
        if (
            !companyId ||
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
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: "Company not found",
            });
        }
        const job = await Job.create({
            companyId,
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
            message: "Failed to create job",
            error: error.message,
        });
    }
};

export const getJobs = async (_req, res) => {
    try {
        const jobs = await Job.find({})
            .populate("companyId", "name")
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

export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }
        const fields = [
            "companyId",
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
            message: "Failed to update job",
            error: error.message,
        });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);
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
            message: "Failed to delete job",
            error: error.message,
        });
    }
};

export const getApplications = async (_req, res) => {
    try {
        const applications = await Application.find({})
            .populate("studentId", "name email")
            .populate({
                path: "jobId",
                populate: { path: "companyId", select: "name" },
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

export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, interviewDate } = req.body;
        const application = await Application.findById(id);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found",
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
            message: "Application status updated successfully",
            data: application,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update application",
            error: error.message,
        });
    }
};

export const getReportSummary = async (_req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: "student" });
        const totalCompanies = await Company.countDocuments({});
        const totalJobs = await Job.countDocuments({});
        const totalApplications = await Application.countDocuments({});
        const selectedCount = await Application.countDocuments({
            status: "Selected",
        });
        const openJobs = await Job.countDocuments({ status: "Open" });
        return res.status(200).json({
            success: true,
            data: {
                totalStudents,
                totalCompanies,
                totalJobs,
                totalApplications,
                selectedCount,
                openJobs,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch report summary",
            error: error.message,
        });
    }
};

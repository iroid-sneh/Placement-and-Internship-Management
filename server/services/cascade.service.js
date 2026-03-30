import Application from "../models/application.js";
import Company from "../models/company.js";
import Job from "../models/job.js";
import StudentProfile from "../models/studentProfile.js";
import User from "../models/user.js";

export async function deleteStudentCascade(studentId) {
    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
        return null;
    }

    await StudentProfile.deleteOne({ userId: student._id });
    await Application.deleteMany({ studentId: student._id });
    await User.deleteOne({ _id: student._id });

    return student;
}

export async function deleteCompanyCascade(companyId) {
    const company = await Company.findById(companyId);
    if (!company) {
        return null;
    }

    const jobs = await Job.find({ companyId: company._id }).select("_id");
    const jobIds = jobs.map((job) => job._id);

    if (jobIds.length > 0) {
        await Application.deleteMany({ jobId: { $in: jobIds } });
        await Job.deleteMany({ companyId: company._id });
    }

    if (company.userId) {
        await User.deleteOne({ _id: company.userId, role: "company" });
    }

    await Company.deleteOne({ _id: company._id });

    return company;
}

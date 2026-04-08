import mongoose from "mongoose";

const adminSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        notifications: {
            newStudentAlerts: {
                type: Boolean,
                default: true,
            },
            companyApprovals: {
                type: Boolean,
                default: true,
            },
            reportReadyAlerts: {
                type: Boolean,
                default: true,
            },
        },
        preferences: {
            darkMode: {
                type: Boolean,
                default: false,
            },
            autoCloseExpiredJobs: {
                type: Boolean,
                default: true,
            },
            weeklyReportDigest: {
                type: Boolean,
                default: true,
            },
        },
    },
    { timestamps: true }
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;

import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        enrollmentNumber: {
            type: String,
            required: true,
            trim: true,
        },
        department: {
            type: String,
            required: true,
            trim: true,
        },
        year: {
            type: Number,
            required: true,
            min: 1,
            max: 6,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        cgpa: {
            type: Number,
            required: true,
            min: 0,
            max: 10,
        },
        skills: {
            type: [String],
            default: [],
        },
        resumeUrl: {
            type: String,
            default: "",
        },
        linkedinUrl: {
            type: String,
            default: "",
            trim: true,
        },
        githubUrl: {
            type: String,
            default: "",
            trim: true,
        },
        portfolioUrl: {
            type: String,
            default: "",
            trim: true,
        },
        notificationPreferences: {
            jobAlerts: {
                type: Boolean,
                default: true,
            },
            applicationUpdates: {
                type: Boolean,
                default: true,
            },
            interviewNotifications: {
                type: Boolean,
                default: true,
            },
        },
        jobPreferences: {
            preferredRole: {
                type: String,
                default: "",
                trim: true,
            },
            preferredLocation: {
                type: String,
                default: "",
                trim: true,
            },
            expectedSalary: {
                type: String,
                default: "",
                trim: true,
            },
        },
    },
    {
        timestamps: true,
    }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

export default StudentProfile;

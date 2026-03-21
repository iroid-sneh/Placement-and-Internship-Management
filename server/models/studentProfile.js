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
            unique: true,
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
    },
    {
        timestamps: true,
    }
);

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

export default StudentProfile;

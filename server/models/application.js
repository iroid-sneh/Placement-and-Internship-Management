import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
        },
        status: {
            type: String,
            enum: [
                "Applied",
                "Shortlisted",
                "Interview Scheduled",
                "Pending Decision",
                "Selected",
                "Rejected",
            ],
            default: "Applied",
        },
        interviewDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;

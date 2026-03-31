import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["Job", "Internship"],
            required: true,
        },
        jobMode: {
            type: String,
            enum: ["Remote", "Hybrid", "Onsite"],
            default: "Onsite",
        },
        eligibility: {
            type: String,
            trim: true,
            default: "",
        },
        requiredSkills: {
            type: [String],
            default: [],
        },
        packageOrStipend: {
            type: String,
            required: true,
            trim: true,
        },
        lastDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["Open", "Closed"],
            default: "Open",
        },
    },
    {
        timestamps: true,
    }
);

const Job = mongoose.model("Job", jobSchema);

export default Job;

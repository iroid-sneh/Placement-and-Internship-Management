import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "new_application",
                "application_status_updated",
                "interview_scheduled",
                "interview_reminder",
                "interview_result_pending",
                "job_deadline_expired",
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        link: {
            type: String,
            default: "",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        relatedApplicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            default: null,
        },
        relatedJobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;

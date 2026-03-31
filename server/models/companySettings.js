import mongoose from "mongoose";

const companySettingsSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
            unique: true,
        },
        notifications: {
            applicationNotifications: {
                type: Boolean,
                default: true,
            },
            statusUpdateNotifications: {
                type: Boolean,
                default: true,
            },
        },
        interview: {
            defaultReminder: {
                type: String,
                enum: ["1h", "24h"],
                default: "24h",
            },
            allowRescheduling: {
                type: Boolean,
                default: true,
            },
            enableNotes: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
    }
);

const CompanySettings = mongoose.model("CompanySettings", companySettingsSchema);

export default CompanySettings;

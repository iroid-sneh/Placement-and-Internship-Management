import Application from "../models/application.js";
import Company from "../models/company.js";
import Job from "../models/job.js";
import User from "../models/user.js";
import {
    APPLICATION_STATUSES,
    COMPANY_SETTABLE_STATUSES,
} from "../constants/applicationStatus.js";
import { startOfToday } from "./job.service.js";
import { createNotification, createNotificationForCompany } from "./notification.service.js";

/**
 * True when the current UTC calendar day is strictly after the interview day's UTC calendar day.
 * (Interview on D → from D+1 onward this returns true.)
 */
export function isInterviewDateElapsed(interviewDate) {
    if (!interviewDate) return false;
    const d = new Date(interviewDate);
    if (Number.isNaN(d.getTime())) return false;
    const interviewDay = Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate()
    );
    const now = new Date();
    const today = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    );
    return today > interviewDay;
}

/**
 * Moves applications from "Interview Scheduled" to "Pending Decision" when the interview day has passed.
 */
export async function syncExpiredInterviewsToPendingDecision() {
    const result = await Application.updateMany(
        {
            status: "Interview Scheduled",
            interviewDate: { $ne: null, $lt: startOfToday() },
        },
        { $set: { status: "Pending Decision" } }
    );

    return { updated: result.modifiedCount || 0 };
}

/**
 * Send reminder notifications to companies for interviews that have passed
 * but are still in "Interview Scheduled" or "Pending Decision" status.
 */
export async function sendInterviewResultReminders() {
    const now = new Date();
    const expiredInterviews = await Application.find({
        status: { $in: ["Interview Scheduled", "Pending Decision"] },
        interviewDate: { $ne: null, $lt: now },
    })
        .populate("studentId", "name")
        .populate("jobId", "title companyId");

    let sentCount = 0;
    for (const app of expiredInterviews) {
        const studentName =
            typeof app.studentId === "string"
                ? "A student"
                : app.studentId?.name || "A student";
        const jobTitle =
            typeof app.jobId === "string"
                ? "a position"
                : app.jobId?.title || "a position";
        const companyId =
            typeof app.jobId === "string"
                ? null
                : app.jobId?.companyId;

        if (companyId) {
            await createNotificationForCompany(companyId, {
                type: "interview_result_pending",
                title: "Interview Result Pending",
                message: `Interview time for ${studentName} (${jobTitle}) has passed. Please update the application status.`,
                link: "applicants",
                relatedApplicationId: app._id,
            });
            sentCount++;
        }
    }

    return { sent: sentCount };
}

/**
 * Auto-select applications where interview was > 24h ago and status is still
 * "Interview Scheduled" or "Pending Decision".
 */
export async function autoSelectExpiredInterviews() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const expiredApps = await Application.find({
        status: { $in: ["Interview Scheduled", "Pending Decision"] },
        interviewDate: { $ne: null, $lt: twentyFourHoursAgo },
    })
        .populate("studentId", "name")
        .populate("jobId", "title companyId");

    let updatedCount = 0;
    for (const app of expiredApps) {
        app.status = "Selected";
        app.interviewDate = null;
        await app.save();

        const studentUserId =
            typeof app.studentId === "string"
                ? app.studentId
                : app.studentId?._id?.toString() || app.studentId?.toString();
        const jobTitle =
            typeof app.jobId === "string"
                ? "the position"
                : app.jobId?.title || "the position";
        const companyId =
            typeof app.jobId === "string" ? null : app.jobId?.companyId;
        const companyName = "the company";

        if (companyId) {
            const company = await Company.findById(companyId);
            const cName = company?.name || companyName;

            await createNotification({
                userId: studentUserId,
                type: "application_status_updated",
                title: "Application Auto-Selected",
                message: `Your application for ${jobTitle} at ${cName} has been automatically selected (interview result was not updated within 24 hours).`,
                link: "applications",
                relatedApplicationId: app._id,
            });

            if (company?.userId) {
                await createNotification({
                    userId: company.userId,
                    type: "application_status_updated",
                    title: "Application Auto-Selected",
                    message: `Application for ${app.studentId?.name || "a student"} (${jobTitle}) was automatically marked as Selected because the interview result was not updated within 24 hours.`,
                    link: "applicants",
                    relatedApplicationId: app._id,
                });
            }
        }

        updatedCount++;
    }

    return { updated: updatedCount };
}

export function isValidApplicationStatus(status) {
    return typeof status === "string" && APPLICATION_STATUSES.includes(status);
}

export function parseInterviewDate(interviewDate) {
    if (interviewDate === undefined) {
        return { ok: true, value: undefined };
    }

    if (interviewDate === null || interviewDate === "") {
        return { ok: true, value: null };
    }

    const parsed = new Date(interviewDate);
    if (Number.isNaN(parsed.getTime())) {
        return {
            ok: false,
            message: "Please provide a valid interview date",
        };
    }

    return { ok: true, value: parsed };
}

/**
 * Validates company updates to an application (cannot set Pending Decision; rules after interview).
 */
export function validateCompanyApplicantUpdate(application, { status, interviewDate }) {
    const parsedInterviewDate = parseInterviewDate(interviewDate);
    if (!parsedInterviewDate.ok) {
        return parsedInterviewDate;
    }

    if (
        application.status === "Pending Decision" &&
        interviewDate !== undefined &&
        interviewDate &&
        !status
    ) {
        return {
            ok: false,
            message:
                "When updating the interview date, set status to Interview Scheduled (or choose Selected / Rejected)",
        };
    }
    if (status !== undefined && status !== null && status !== "") {
        if (!isValidApplicationStatus(status)) {
            return { ok: false, message: "Invalid application status" };
        }
        if (status === "Pending Decision") {
            return {
                ok: false,
                message:
                    "Status Pending Decision is set automatically after the interview date passes",
            };
        }
        if (!COMPANY_SETTABLE_STATUSES.includes(status)) {
            return { ok: false, message: "Invalid application status for this action" };
        }
        if (status === "Interview Scheduled" && !interviewDate) {
            return {
                ok: false,
                message: "Interview date is required when scheduling an interview",
            };
        }
        if (application.status === "Pending Decision") {
            const allowedFromPending = [
                "Selected",
                "Rejected",
                "Shortlisted",
                "Interview Scheduled",
            ];
            if (!allowedFromPending.includes(status)) {
                return {
                    ok: false,
                    message:
                        "Please choose Selected, Rejected, Shortlisted, or reschedule the interview",
                };
            }
            if (status === "Interview Scheduled" && !interviewDate) {
                return {
                    ok: false,
                    message: "Interview date is required when rescheduling",
                };
            }
        }
    }
    return { ok: true, interviewDate: parsedInterviewDate.value };
}

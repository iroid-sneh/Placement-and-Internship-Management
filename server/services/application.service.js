import Application from "../models/application.js";
import {
    APPLICATION_STATUSES,
    COMPANY_SETTABLE_STATUSES,
} from "../constants/applicationStatus.js";
import { startOfToday } from "./job.service.js";

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

import Job from "../models/job.js";

export function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

export function normalizeDeadline(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    parsed.setHours(0, 0, 0, 0);
    return parsed;
}

export function validateFutureDeadline(value) {
    const deadline = normalizeDeadline(value);
    if (!deadline) {
        return {
            valid: false,
            message: "Please provide a valid application deadline date.",
        };
    }

    if (deadline <= startOfToday()) {
        return {
            valid: false,
            message: "Last date to apply must be after today.",
        };
    }

    return { valid: true, deadline };
}

export async function closeExpiredJobs(filter = {}) {
    await Job.updateMany(
        {
            ...filter,
            status: "Open",
            lastDate: { $lt: startOfToday() },
        },
        {
            $set: { status: "Closed" },
        }
    );
}

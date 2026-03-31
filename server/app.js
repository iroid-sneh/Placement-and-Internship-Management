import dotenv from "dotenv";
dotenv.config({ quiet: true });
import express from "express";
import path from "path";
import routes from "./routes/index.js";
import { mongoConnection } from "./models/connection.js";
import errorHandler from "./src/common/middleware/errorHandler.js";
import swagger from "./src/common/config/swagger.js";
import seedAdmin from "./seeder/index.js";
import { SERVER_ROOT } from "./constants/paths.js";
import { closeExpiredJobs } from "./services/job.service.js";
import {
    syncExpiredInterviewsToPendingDecision,
    sendInterviewResultReminders,
    autoSelectExpiredInterviews,
} from "./services/application.service.js";
import { createNotification } from "./services/notification.service.js";
import Job from "./models/job.js";
import Company from "./models/company.js";

// Suppress MaxListenersExceededWarning during development
if (process.env.NODE_ENV !== "production") {
    process.setMaxListeners(20);
}

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(SERVER_ROOT, "public")));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    return next();
});

app.set("view engine", "ejs");
app.set("views", path.join(SERVER_ROOT, "views"));

app.use("/", routes);
app.use("/api/documentation", swagger);
app.use(errorHandler);

async function bootstrap() {
    await mongoConnection();
    await seedAdmin();

    app.listen(PORT, () => {
        console.log(`Listening on ${process.env.BASE_URL}:${PORT}`);
    });

    // ---- Scheduled background tasks ----

    // Run every 5 minutes: close expired jobs
    const JOB_CHECK_INTERVAL = 5 * 60 * 1000;
    const notifiedJobIds = new Set();

    setInterval(async () => {
        try {
            // Find jobs that are about to expire before closing them
            const { startOfToday } = await import("./services/job.service.js");
            const expiringJobs = await Job.find({
                status: "Open",
                lastDate: { $lt: startOfToday() },
            }).populate("companyId");

            // Close the expired jobs
            await closeExpiredJobs();

            // Notify companies about newly expired jobs (avoid duplicates)
            for (const job of expiringJobs) {
                const jobIdStr = job._id.toString();
                if (notifiedJobIds.has(jobIdStr)) continue;
                notifiedJobIds.add(jobIdStr);

                const companyId = job.companyId?._id || job.companyId;
                if (companyId) {
                    const company = await Company.findById(companyId);
                    if (company?.userId) {
                        await createNotification({
                            userId: company.userId,
                            type: "job_deadline_expired",
                            title: "Job Deadline Expired",
                            message: `The application deadline for "${job.title}" has passed. The job is now closed.`,
                            link: "company-jobs",
                            relatedJobId: job._id,
                        });
                    }
                }
            }

            // Clean up old entries from the set (keep it manageable)
            if (notifiedJobIds.size > 10000) {
                const iterator = notifiedJobIds.values();
                for (let i = 0; i < 5000; i++) {
                    const next = iterator.next();
                    if (next.done) break;
                    notifiedJobIds.delete(next.value);
                }
            }
        } catch (err) {
            console.error("Job deadline check failed:", err.message);
        }
    }, JOB_CHECK_INTERVAL);

    // Run every 10 minutes: sync expired interviews and send reminders
    const INTERVIEW_CHECK_INTERVAL = 10 * 60 * 1000;
    setInterval(async () => {
        try {
            await syncExpiredInterviewsToPendingDecision();
            await sendInterviewResultReminders();
        } catch (err) {
            console.error("Interview check failed:", err.message);
        }
    }, INTERVIEW_CHECK_INTERVAL);

    // Run every 30 minutes: auto-select expired interviews (24h penalty)
    const AUTO_SELECT_INTERVAL = 30 * 60 * 1000;
    setInterval(async () => {
        try {
            await autoSelectExpiredInterviews();
        } catch (err) {
            console.error("Auto-select check failed:", err.message);
        }
    }, AUTO_SELECT_INTERVAL);

    console.log("Scheduled background tasks started");
}

bootstrap().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});

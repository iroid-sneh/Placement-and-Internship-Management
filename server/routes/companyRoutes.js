import express from "express";
import {
    changeCompanyPassword,
    clearApplicationHistory,
    createCompanyJob,
    deleteCompanyAccount,
    deleteCompanyJob,
    getCompanyApplicants,
    getCompanyJobs,
    getCompanyProfile,
    getCompanySettings,
    getNotifications,
    getStudentProfileById,
    getUpcomingInterviews,
    markAllNotificationsRead,
    markNotificationRead,
    removeAllJobPostings,
    updateCompanyApplicantStatus,
    updateCompanyEmail,
    updateCompanyJob,
    updateCompanyProfile,
    updateCompanySettings,
} from "../controllers/companyController.js";
import { authorizeRoles, verifyJWT } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
    applicationStatusUpdateSchema,
    changePasswordSchema,
    companyJobSchema,
    companyJobUpdateSchema,
    companyProfileUpdateSchema,
    companySettingsUpdateSchema,
    updateEmailSchema,
} from "../validation/schemas.js";

const companyRoutes = express.Router();

companyRoutes.use(verifyJWT, authorizeRoles("company"));

companyRoutes.get("/profile", getCompanyProfile);
companyRoutes.put(
    "/profile",
    validate(companyProfileUpdateSchema),
    updateCompanyProfile
);

companyRoutes.post("/jobs", validate(companyJobSchema), createCompanyJob);
companyRoutes.get("/jobs", getCompanyJobs);
companyRoutes.put("/jobs/:id", validate(companyJobUpdateSchema), updateCompanyJob);
companyRoutes.delete("/jobs/:id", deleteCompanyJob);

companyRoutes.get("/applicants", getCompanyApplicants);
companyRoutes.put(
    "/applicants/:id/status",
    validate(applicationStatusUpdateSchema),
    updateCompanyApplicantStatus
);

companyRoutes.get("/students/:studentId", getStudentProfileById);
companyRoutes.get("/interviews", getUpcomingInterviews);

// Settings
companyRoutes.get("/settings", getCompanySettings);
companyRoutes.put("/settings", validate(companySettingsUpdateSchema), updateCompanySettings);
companyRoutes.post(
    "/settings/change-password",
    validate(changePasswordSchema),
    changeCompanyPassword
);
companyRoutes.post(
    "/settings/update-email",
    validate(updateEmailSchema),
    updateCompanyEmail
);
companyRoutes.delete("/settings/delete-account", deleteCompanyAccount);
companyRoutes.delete("/settings/remove-all-jobs", removeAllJobPostings);
companyRoutes.delete("/settings/clear-applications", clearApplicationHistory);

// Notifications
companyRoutes.get("/notifications", getNotifications);
companyRoutes.put("/notifications/:id/read", markNotificationRead);
companyRoutes.put("/notifications/read-all", markAllNotificationsRead);

export default companyRoutes;

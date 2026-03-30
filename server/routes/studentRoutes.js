import express from "express";
import {
    applyToJob,
    browseJobs,
    changePassword,
    deleteAccount,
    deleteResume,
    downloadResume,
    getMyApplications,
    getStudentProfile,
    saveJobPreferences,
    saveNotificationPreferences,
    updateEmail,
    updateStudentProfile,
    uploadResume,
} from "../controllers/studentController.js";
import { authorizeRoles, verifyJWT } from "../middleware/auth.js";
import resumeUpload from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import {
    changePasswordSchema,
    jobPreferencesSchema,
    notificationPreferencesSchema,
    studentProfileUpdateSchema,
    updateEmailSchema,
} from "../validation/schemas.js";

const studentRoutes = express.Router();

studentRoutes.use(verifyJWT, authorizeRoles("student"));

studentRoutes.get("/profile", getStudentProfile);
studentRoutes.put(
    "/profile",
    validate(studentProfileUpdateSchema),
    updateStudentProfile
);
studentRoutes.post("/resume", resumeUpload.single("resume"), uploadResume);
studentRoutes.delete("/resume", deleteResume);
studentRoutes.get("/resume/download", downloadResume);
studentRoutes.get("/jobs", browseJobs);
studentRoutes.post("/apply/:jobId", applyToJob);
studentRoutes.get("/applications", getMyApplications);
studentRoutes.post(
    "/settings/change-password",
    validate(changePasswordSchema),
    changePassword
);
studentRoutes.post(
    "/settings/update-email",
    validate(updateEmailSchema),
    updateEmail
);
studentRoutes.delete("/settings/delete-account", deleteAccount);
studentRoutes.post(
    "/settings/notification-preferences",
    validate(notificationPreferencesSchema),
    saveNotificationPreferences
);
studentRoutes.post(
    "/settings/job-preferences",
    validate(jobPreferencesSchema),
    saveJobPreferences
);

export default studentRoutes;

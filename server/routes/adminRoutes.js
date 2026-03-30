import express from "express";
import {
    createCompany,
    createJob,
    deleteCompany,
    deleteJob,
    deleteStudent,
    getApplications,
    getCompanies,
    getJobs,
    getReportSummary,
    getStudents,
    updateApplicationStatus,
    updateCompany,
    updateJob,
} from "../controllers/adminController.js";
import { authorizeRoles, verifyJWT } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
    adminJobSchema,
    adminJobUpdateSchema,
    applicationStatusUpdateSchema,
    companySchema,
    companyUpdateSchema,
} from "../validation/schemas.js";

const adminRoutes = express.Router();

adminRoutes.use(verifyJWT, authorizeRoles("admin"));

adminRoutes.get("/students", getStudents);
adminRoutes.delete("/students/:id", deleteStudent);

adminRoutes.post("/companies", validate(companySchema), createCompany);
adminRoutes.get("/companies", getCompanies);
adminRoutes.put("/companies/:id", validate(companyUpdateSchema), updateCompany);
adminRoutes.delete("/companies/:id", deleteCompany);

adminRoutes.post("/jobs", validate(adminJobSchema), createJob);
adminRoutes.get("/jobs", getJobs);
adminRoutes.put("/jobs/:id", validate(adminJobUpdateSchema), updateJob);
adminRoutes.delete("/jobs/:id", deleteJob);

adminRoutes.get("/applications", getApplications);
adminRoutes.put(
    "/applications/:id/status",
    validate(applicationStatusUpdateSchema),
    updateApplicationStatus
);

adminRoutes.get("/reports/summary", getReportSummary);

export default adminRoutes;

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

const adminRoutes = express.Router();

adminRoutes.use(verifyJWT, authorizeRoles("admin"));

adminRoutes.get("/students", getStudents);
adminRoutes.delete("/students/:id", deleteStudent);

adminRoutes.post("/companies", createCompany);
adminRoutes.get("/companies", getCompanies);
adminRoutes.put("/companies/:id", updateCompany);
adminRoutes.delete("/companies/:id", deleteCompany);

adminRoutes.post("/jobs", createJob);
adminRoutes.get("/jobs", getJobs);
adminRoutes.put("/jobs/:id", updateJob);
adminRoutes.delete("/jobs/:id", deleteJob);

adminRoutes.get("/applications", getApplications);
adminRoutes.put("/applications/:id/status", updateApplicationStatus);

adminRoutes.get("/reports/summary", getReportSummary);

export default adminRoutes;

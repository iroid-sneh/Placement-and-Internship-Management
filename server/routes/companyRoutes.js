import express from "express";
import {
    createCompanyJob,
    deleteCompanyJob,
    getCompanyApplicants,
    getCompanyJobs,
    updateCompanyApplicantStatus,
    updateCompanyJob,
} from "../controllers/companyController.js";
import { authorizeRoles, verifyJWT } from "../middleware/auth.js";

const companyRoutes = express.Router();

companyRoutes.use(verifyJWT, authorizeRoles("company"));

companyRoutes.post("/jobs", createCompanyJob);
companyRoutes.get("/jobs", getCompanyJobs);
companyRoutes.put("/jobs/:id", updateCompanyJob);
companyRoutes.delete("/jobs/:id", deleteCompanyJob);

companyRoutes.get("/applicants", getCompanyApplicants);
companyRoutes.put("/applicants/:id/status", updateCompanyApplicantStatus);

export default companyRoutes;

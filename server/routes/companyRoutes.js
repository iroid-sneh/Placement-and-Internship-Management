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
import { validate } from "../middleware/validate.js";
import {
    applicationStatusUpdateSchema,
    companyJobSchema,
    companyJobUpdateSchema,
} from "../validation/schemas.js";

const companyRoutes = express.Router();

companyRoutes.use(verifyJWT, authorizeRoles("company"));

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

export default companyRoutes;

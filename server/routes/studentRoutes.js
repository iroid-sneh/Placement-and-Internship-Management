import express from "express";
import {
    applyToJob,
    browseJobs,
    deleteResume,
    getMyApplications,
    getStudentProfile,
    updateStudentProfile,
    uploadResume,
} from "../controllers/studentController.js";
import { authorizeRoles, verifyJWT } from "../middleware/auth.js";
import resumeUpload from "../middleware/upload.js";

const studentRoutes = express.Router();

studentRoutes.use(verifyJWT, authorizeRoles("student"));

studentRoutes.get("/profile", getStudentProfile);
studentRoutes.put("/profile", updateStudentProfile);
studentRoutes.post("/resume", resumeUpload.single("resume"), uploadResume);
studentRoutes.delete("/resume", deleteResume);
studentRoutes.get("/jobs", browseJobs);
studentRoutes.post("/apply/:jobId", applyToJob);
studentRoutes.get("/applications", getMyApplications);

export default studentRoutes;

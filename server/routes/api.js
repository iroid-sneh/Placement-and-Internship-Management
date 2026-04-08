import express from "express";
import authRoutes from "./authRoutes.js";
import studentRoutes from "./studentRoutes.js";
import adminRoutes from "./adminRoutes.js";
import companyRoutes from "./companyRoutes.js";
import chatRoutes from "./chatRoutes.js";
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/student", studentRoutes);
router.use("/admin", adminRoutes);
router.use("/company", companyRoutes);
router.use("/chat", chatRoutes);

export default router;

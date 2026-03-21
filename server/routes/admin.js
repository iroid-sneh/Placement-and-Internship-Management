import express from "express";
import adminRoutes from "../src/admin/adminAuth/adminAuth.routes.js";
const router = express.Router();

router.use("/", adminRoutes);

export default router;

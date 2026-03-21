import express from "express";
import adminAuthController from "./adminAuth.controller.js";
const router = express.Router();

router.post("/login", adminAuthController.login);

export default router;

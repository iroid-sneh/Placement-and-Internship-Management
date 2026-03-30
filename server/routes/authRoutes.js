import express from "express";
import { login, register, forgotPasswordSendOtp, forgotPasswordVerifyOtp, forgotPasswordReset } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema, forgotPasswordSendOtpSchema, forgotPasswordVerifyOtpSchema, forgotPasswordResetSchema } from "../validation/schemas.js";

const authRoutes = express.Router();

authRoutes.post("/register", validate(registerSchema), register);
authRoutes.post("/login", validate(loginSchema), login);
authRoutes.post("/forgot-password/send-otp", validate(forgotPasswordSendOtpSchema), forgotPasswordSendOtp);
authRoutes.post("/forgot-password/verify-otp", validate(forgotPasswordVerifyOtpSchema), forgotPasswordVerifyOtp);
authRoutes.post("/forgot-password/reset", validate(forgotPasswordResetSchema), forgotPasswordReset);

export default authRoutes;

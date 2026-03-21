import express from "express";
import authController from "./auth.controller.js";
import validator from "../common/config/joiValidation.js";
import registerDto from "./dtos/registerDto.js";
import loginDto from "./dtos/loginDto.js";
const router = express.Router();

router.post("/resgiter", validator.body(registerDto), authController.register);
router.post("/login", validator.body(loginDto), authController.login);

export default router;

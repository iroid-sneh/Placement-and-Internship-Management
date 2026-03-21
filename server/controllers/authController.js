import User from "../models/user.js";
import StudentProfile from "../models/studentProfile.js";
import Company from "../models/company.js";
import AuthHelper from "../src/common/authHelper.js";

const allowedRoles = ["student", "admin", "company"];

export const register = async (req, res) => {
    try {
        const { name, email, password, role, enrollmentNumber } = req.body;
        const normalizedRole = role || "student";
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "name, email and password are required",
            });
        }
        if (!allowedRoles.includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role value",
            });
        }
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already exists",
            });
        }
        const hashedPassword = await AuthHelper.hashPassword(password);
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: normalizedRole,
        });
        if (normalizedRole === "student") {
            await StudentProfile.create({
                userId: user._id,
                enrollmentNumber:
                    enrollmentNumber || `ENR-${Date.now().toString().slice(-6)}`,
                department: "BCA",
                year: 6,
                phone: "0000000000",
                cgpa: 0,
                skills: [],
                resumeUrl: "",
            });
        }
        if (normalizedRole === "company") {
            await Company.create({
                name,
                hrName: name,
                email: email.toLowerCase(),
                phone: "0000000000",
                location: "Not set",
                userId: user._id,
            });
        }
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "email and password are required",
            });
        }
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        const isValidPassword = await AuthHelper.matchHashedPassword(
            password,
            user.password
        );
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is inactive",
            });
        }
        const token = AuthHelper.generateToken(user._id.toString(), {
            role: user.role,
            email: user.email,
            name: user.name,
        });
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

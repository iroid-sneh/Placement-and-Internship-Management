import User from "../models/user.js";
import StudentProfile from "../models/studentProfile.js";
import Company from "../models/company.js";
import AuthHelper from "../src/common/authHelper.js";

const allowedRoles = ["student", "company"];

const sanitizeInput = (input) => {
    if (typeof input !== "string") return input;
    return input
        .trim()
        .replace(/[<>]/g, "")
        .replace(/\$/g, "")
        .replace(/\{/g, "")
        .replace(/\}/g, "");
};

const sanitizeObject = (obj) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
            sanitized[key] = sanitizeInput(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item) =>
                typeof item === "string" ? sanitizeInput(item) : item
            );
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

export const register = async (req, res) => {
    try {
        const body = sanitizeObject(req.body);
        const {
            name,
            email,
            password,
            role,
            enrollmentNumber,
            department,
            year,
            phone,
            cgpa,
            skills,
            linkedinUrl,
            githubUrl,
            portfolioUrl,
            hrName,
            location,
            website,
            industry,
            description,
            companyPhone,
        } = body;

        const normalizedRole = role || "student";

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
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
                message: "An account with this email already exists",
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
                enrollmentNumber: enrollmentNumber || "",
                department: department || "",
                year: year || 1,
                phone: phone || "",
                cgpa: cgpa ?? 0,
                skills: skills || [],
                resumeUrl: "",
                linkedinUrl: linkedinUrl || "",
                githubUrl: githubUrl || "",
                portfolioUrl: portfolioUrl || "",
            });
        }

        if (normalizedRole === "company") {
            const existingCompany = await Company.findOne({
                email: email.toLowerCase(),
            });

            if (existingCompany) {
                if (existingCompany.userId) {
                    await User.deleteOne({ _id: user._id });
                    return res.status(409).json({
                        success: false,
                        message: "A company account already exists for this email",
                    });
                }

                existingCompany.userId = user._id;
                existingCompany.name = name;
                existingCompany.hrName = hrName || name;
                existingCompany.phone = companyPhone || "";
                existingCompany.location = location || "";
                existingCompany.website = website || "";
                existingCompany.industry = industry || "";
                existingCompany.description = description || "";
                await existingCompany.save();
            } else {
                await Company.create({
                    name,
                    hrName: hrName || name,
                    email: email.toLowerCase(),
                    phone: companyPhone || "",
                    location: location || "",
                    website: website || "",
                    industry: industry || "",
                    description: description || "",
                    userId: user._id,
                });
            }
        }

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please login to continue.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

const generateOtp = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
};

export const forgotPasswordSendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail, role: { $ne: "admin" } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address",
            });
        }

        const otp = generateOtp();
        const expiry = new Date(Date.now() + 10 * 60 * 1000);

        user.resetOtp = otp;
        user.resetOtpExpiry = expiry;
        await user.save();

        console.log(`\n========================================`);
        console.log(`  PASSWORD RESET OTP`);
        console.log(`  Email: ${normalizedEmail}`);
        console.log(`  OTP:   ${otp}`);
        console.log(`  Expires: ${expiry.toLocaleString()}`);
        console.log(`========================================\n`);

        return res.status(200).json({
            success: true,
            message: "OTP has been sent to your email address. Please check the server console.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const forgotPasswordVerifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail, role: { $ne: "admin" } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address",
            });
        }

        if (!user.resetOtp || !user.resetOtpExpiry) {
            return res.status(400).json({
                success: false,
                message: "No OTP was generated for this account. Please request a new one.",
            });
        }

        if (new Date() > user.resetOtpExpiry) {
            user.resetOtp = null;
            user.resetOtpExpiry = null;
            await user.save();
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please check and try again.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully. You can now reset your password.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const forgotPasswordReset = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({ email: normalizedEmail, role: { $ne: "admin" } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address",
            });
        }

        if (!user.resetOtp || !user.resetOtpExpiry) {
            return res.status(400).json({
                success: false,
                message: "No OTP session found. Please start the reset process again.",
            });
        }

        if (new Date() > user.resetOtpExpiry) {
            user.resetOtp = null;
            user.resetOtpExpiry = null;
            await user.save();
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please verify again.",
            });
        }

        const hashedPassword = await AuthHelper.hashPassword(password);
        user.password = hashedPassword;
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully. Please login with your new password.",
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
                message: "Email and password are required",
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

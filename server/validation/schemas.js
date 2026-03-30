import Joi from "joi";

const nameSchema = Joi.string().trim().min(2).max(120);
const emailSchema = Joi.string().trim().lowercase().email();
const phoneSchema = Joi.string().trim().pattern(/^\d{10}$/).message("Phone number must be exactly 10 digits");
const objectIdSchema = Joi.string().trim().hex().length(24);
const optionalDateSchema = Joi.date().iso().allow(null, "");
const urlSchema = Joi.string().trim().uri().allow("", null).messages({
    "string.uri": "Must be a valid URL",
});

const passwordSchema = Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/)
    .pattern(/[a-z]/)
    .pattern(/[0-9]/)
    .pattern(/[^A-Za-z0-9]/)
    .required()
    .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password must not exceed 128 characters",
        "string.pattern.name": "Password does not meet complexity requirements",
        "any.required": "Password is required",
    });

export const registerSchema = Joi.object({
    name: nameSchema.required().messages({ "any.required": "Full name is required" }),
    email: emailSchema.required().messages({ "any.required": "Email is required" }),
    password: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Passwords do not match",
        "any.required": "Confirm password is required",
    }),
    role: Joi.string().valid("student", "company").default("student"),

    // Student fields
    enrollmentNumber: Joi.when("role", {
        is: "student",
        then: Joi.string().trim().min(3).max(50).required().messages({
            "any.required": "Enrollment number is required",
        }),
        otherwise: Joi.forbidden(),
    }),
    department: Joi.when("role", {
        is: "student",
        then: Joi.string().trim().min(2).max(120).required().messages({
            "any.required": "Department is required",
        }),
        otherwise: Joi.forbidden(),
    }),
    year: Joi.when("role", {
        is: "student",
        then: Joi.number().integer().min(1).max(6).required().messages({
            "any.required": "Year is required",
        }),
        otherwise: Joi.forbidden(),
    }),
    phone: Joi.when("role", {
        is: "student",
        then: phoneSchema.required().messages({ "any.required": "Phone number is required" }),
        otherwise: Joi.forbidden(),
    }),
    cgpa: Joi.when("role", {
        is: "student",
        then: Joi.number().min(0).max(10).required().messages({
            "any.required": "CGPA is required",
            "number.min": "CGPA must be between 0 and 10",
            "number.max": "CGPA must be between 0 and 10",
        }),
        otherwise: Joi.forbidden(),
    }),
    skills: Joi.when("role", {
        is: "student",
        then: Joi.array().items(Joi.string().trim().min(1).max(60)).max(50).default([]),
        otherwise: Joi.forbidden(),
    }),
    linkedinUrl: Joi.when("role", {
        is: "student",
        then: urlSchema,
        otherwise: Joi.forbidden(),
    }),
    githubUrl: Joi.when("role", {
        is: "student",
        then: urlSchema,
        otherwise: Joi.forbidden(),
    }),
    portfolioUrl: Joi.when("role", {
        is: "student",
        then: urlSchema,
        otherwise: Joi.forbidden(),
    }),

    // Company fields
    hrName: Joi.when("role", {
        is: "company",
        then: nameSchema.required().messages({ "any.required": "HR/Contact person name is required" }),
        otherwise: Joi.forbidden(),
    }),
    location: Joi.when("role", {
        is: "company",
        then: Joi.string().trim().min(2).max(160).required().messages({
            "any.required": "Company location is required",
        }),
        otherwise: Joi.forbidden(),
    }),
    website: Joi.when("role", {
        is: "company",
        then: urlSchema,
        otherwise: Joi.forbidden(),
    }),
    industry: Joi.when("role", {
        is: "company",
        then: Joi.string().trim().max(120).allow("", null),
        otherwise: Joi.forbidden(),
    }),
    description: Joi.when("role", {
        is: "company",
        then: Joi.string().trim().max(1000).allow("", null),
        otherwise: Joi.forbidden(),
    }),
    companyPhone: Joi.when("role", {
        is: "company",
        then: phoneSchema.required().messages({ "any.required": "Phone number is required" }),
        otherwise: Joi.forbidden(),
    }),
});

export const loginSchema = Joi.object({
    email: emailSchema.required(),
    password: Joi.string().required(),
});

export const forgotPasswordSendOtpSchema = Joi.object({
    email: emailSchema.required().messages({ "any.required": "Email is required" }),
});

export const forgotPasswordVerifyOtpSchema = Joi.object({
    email: emailSchema.required().messages({ "any.required": "Email is required" }),
    otp: Joi.string().trim().length(6).pattern(/^\d{6}$/).required().messages({
        "any.required": "OTP is required",
        "string.length": "OTP must be 6 digits",
        "string.pattern.base": "OTP must contain only digits",
    }),
});

export const forgotPasswordResetSchema = Joi.object({
    email: emailSchema.required().messages({ "any.required": "Email is required" }),
    otp: Joi.string().trim().length(6).pattern(/^\d{6}$/).required().messages({
        "any.required": "OTP is required",
        "string.length": "OTP must be 6 digits",
    }),
    password: passwordSchema,
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Passwords do not match",
        "any.required": "Confirm password is required",
    }),
});

export const studentProfileUpdateSchema = Joi.object({
    enrollmentNumber: Joi.string().trim().max(50),
    department: Joi.string().trim().max(120),
    year: Joi.number().integer().min(1).max(6),
    phone: phoneSchema,
    cgpa: Joi.number().min(0).max(10),
    skills: Joi.array().items(Joi.string().trim().min(1).max(60)).max(50),
}).min(1);

export const companySchema = Joi.object({
    name: nameSchema.required(),
    hrName: nameSchema.required(),
    email: emailSchema.required(),
    phone: phoneSchema.required(),
    location: Joi.string().trim().min(2).max(160).required(),
});

export const companyUpdateSchema = Joi.object({
    name: nameSchema,
    hrName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    location: Joi.string().trim().min(2).max(160),
}).min(1);

export const companyJobSchema = Joi.object({
    title: Joi.string().trim().min(2).max(160).required(),
    description: Joi.string().trim().min(10).max(4000).required(),
    type: Joi.string().valid("Job", "Internship").required(),
    eligibility: Joi.string().trim().min(2).max(300).required(),
    packageOrStipend: Joi.string().trim().min(2).max(120).required(),
    lastDate: Joi.date().iso().required(),
    status: Joi.string().valid("Open", "Closed").default("Open"),
});

export const companyJobUpdateSchema = Joi.object({
    title: Joi.string().trim().min(2).max(160),
    description: Joi.string().trim().min(10).max(4000),
    type: Joi.string().valid("Job", "Internship"),
    eligibility: Joi.string().trim().min(2).max(300),
    packageOrStipend: Joi.string().trim().min(2).max(120),
    lastDate: Joi.date().iso(),
    status: Joi.string().valid("Open", "Closed"),
}).min(1);

export const adminJobSchema = companyJobSchema.keys({
    companyId: objectIdSchema.required(),
});

export const adminJobUpdateSchema = companyJobUpdateSchema.keys({
    companyId: objectIdSchema,
});

export const applicationStatusUpdateSchema = Joi.object({
    status: Joi.string()
        .valid(
            "Applied",
            "Shortlisted",
            "Interview Scheduled",
            "Pending Decision",
            "Selected",
            "Rejected"
        )
        .optional(),
    interviewDate: optionalDateSchema.optional(),
}).or("status", "interviewDate");

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required().messages({
        "any.required": "Current password is required",
    }),
    newPassword: passwordSchema,
    confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
        "any.only": "Passwords do not match",
        "any.required": "Confirm new password is required",
    }),
});

export const updateEmailSchema = Joi.object({
    newEmail: emailSchema.required().messages({
        "any.required": "New email is required",
    }),
    password: Joi.string().required().messages({
        "any.required": "Password is required",
    }),
});

export const notificationPreferencesSchema = Joi.object({
    jobAlerts: Joi.boolean().required(),
    applicationUpdates: Joi.boolean().required(),
    interviewNotifications: Joi.boolean().required(),
});

export const jobPreferencesSchema = Joi.object({
    preferredRole: Joi.string().trim().max(120).allow("", null),
    preferredLocation: Joi.string().trim().max(120).allow("", null),
    expectedSalary: Joi.string().trim().max(50).allow("", null),
});

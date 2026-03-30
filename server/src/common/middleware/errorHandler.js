import {
    Exception,
    HttpStatus,
    ValidationException,
} from "../utils/errorException.js";

export default (err, req, res, next) => {
    const isDev = process.env.NODE_ENV !== "production";

    if (isDev) {
        console.error("ERROR:", err);
    }

    // Joi or other validation errors
    if (err?.error?.isJoi) {
        return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: err.error.details?.[0]?.message || "Validation failed",
            errorCode: "VALIDATION_FAILED",
        });
    }

    if (err?.code === "LIMIT_FILE_SIZE") {
        return res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: "Resume file size must be 5MB or less",
            errorCode: "FILE_TOO_LARGE",
        });
    }

    if (err?.message === "Only PDF resumes are allowed") {
        return res.status(HttpStatus.BAD_REQUEST).json({
            success: false,
            message: err.message,
            errorCode: "INVALID_FILE_TYPE",
        });
    }

    // Our custom Exceptions
    if (err instanceof Exception) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errorCode: err.errorCode || null,
        });
    }

    // Unexpected/unhandled error fallback
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Something went wrong. Please try again later.",
    });
};

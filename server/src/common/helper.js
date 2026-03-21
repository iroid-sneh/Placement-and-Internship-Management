import crypto from "crypto";
import { baseUrl } from "./constants/constant";

/**
 * App logo
 * @returns
 */
export const logo = () => {
    return baseUrl("/icons/logo.png");
};

/**
 * @description Generate a secure random alphanumeric string (for tokens, IDs)
 * @param {number} length - Desired string length (default: 75)
 * @returns {string}
 */
export const randomStringGenerator = (length = 75) => {
    const bytes = crypto.randomBytes(length);
    // Base64 makes string longer; base36 is URL-safe and compact
    return bytes.toString("base64url").slice(0, length);
};

/**
 * @description Generate a secure numeric OTP (e.g., for phone/email verification)
 * @param {number} length - Desired OTP length (default: 6)
 * @returns {string}
 */
export const randomOtpGenerator = (length = 4) => {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        const randomDigit = crypto.randomInt(0, digits.length);
        otp += digits[randomDigit];
    }
    return otp;
};

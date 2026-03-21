export const baseUrl = (path = "") => {
    const url = `${process.env.BASE_URL}:${process.env.PORT}`;
    return `${url}${path.startsWith("/") ? path : "/" + path}`;
};

export const apiBaseUrl = (path = "") => {
    const url = `${process.env.BASE_URL}:${process.env.PORT}/api/v1`;
    return `${url}${path.startsWith("/") ? path : "/" + path}`;
};

export const JWT = {
    SECRET: process.env.JWT_SECRET || "3921mbsyletaidemmi",
    ACCESS_EXPIRES_IN: "7d", // Token expiry (7 days)
};

export const TOKEN_EXPIRY_HOURS = {
    ACCESS: 8760, // for DB TTL indexing (if storing access tokens)
    REFRESH: 8760, // 7 days in hours
};

export const OTPTYPE = {
    REGISTRATION_OTP: 1,
    FORGOT_PASSWORD: 2,
};

export const PLATFORM = {
    ANDROID: "Android",
    IOS: "iOS",
};

import AuthHelper from "../src/common/authHelper.js";

export const verifyJWT = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authorization token missing",
            });
        }
        const decoded = AuthHelper.verifyToken(token);
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to access this route",
            });
        }
        return next();
    };
};

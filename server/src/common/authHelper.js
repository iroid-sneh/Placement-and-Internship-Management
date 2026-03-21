import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { JWT } from "./constants/constant.js";

class AuthHelper {
    /**
     * Securely match hashed password using Argon2
     * @param {string} plainPassword
     * @param {string} hashedPassword
     * @returns {Promise<boolean>}
     */
    static async matchHashedPassword(plainPassword, hashedPassword) {
        try {
            return await argon2.verify(hashedPassword, plainPassword);
        } catch (err) {
            return false;
        }
    }

    /**
     * Hash password using Argon2
     * @param {string} password
     * @returns {Promise<string>} hashed password
     */
    static async hashPassword(password) {
        return await argon2.hash(password);
    }

    /**
     * Generate JWT token
     * @param {string} userId
     * @param {object} payloadExtras - additional JWT payload like email, name, etc.
     * @returns {string} JWT token
     */
    static generateToken(userId, payloadExtras = {}) {
        return jwt.sign(
            {
                id: userId,
                ...payloadExtras,
            },
            JWT.SECRET,
            {
                expiresIn: JWT.ACCESS_EXPIRES_IN || "7d",
            }
        );
    }

    /**
     * Verify and get data from a JWT token
     * @param {string} token
     * @returns {object} decoded payload
     * @throws {Error} if token is invalid
     */
    static verifyToken(token) {
        return jwt.verify(token, JWT.SECRET);
    }
}

export default AuthHelper;

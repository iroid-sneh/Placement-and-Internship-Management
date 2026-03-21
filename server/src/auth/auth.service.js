import User from "../../models/user.js";
import AuthHelper from "../common/authHelper.js";

class authServices {
    /**
     * @description: Register a new user
     * @param {*} data
     * @param {*} req
     * @param {*} res
     */
    static async register(data, req, res) {
        try {
            const { name, email, password } = data;
            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required",
                });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User with this email already exists",
                });
            }

            // Hash password
            const hashedPassword = await AuthHelper.hashPassword(password);

            // Create user
            const user = await User.create({
                name: name,
                email: email,
                password: hashedPassword,
            });

            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;

            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: userResponse,
            });
        } catch (error) {
            console.log("Error In Register", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message,
            });
        }
    }

    /**
     * @description: Login a user
     * @param {*} data
     * @param {*} req
     * @param {*} res
     */
    static async login(data, req, res) {
        try {
            const { email, password } = data;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required",
                });
            }

            // Find user by email
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Verify password
            const isPasswordValid = await AuthHelper.matchHashedPassword(
                password,
                user.password
            );
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Generate token
            const token = AuthHelper.generateToken(user._id.toString(), {
                email: user.email,
                name: user.name,
            });

            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;

            return res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    user: userResponse,
                    token: token,
                },
            });
        } catch (error) {
            console.log("Error In Login", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message,
            });
        }
    }
}

export default authServices;

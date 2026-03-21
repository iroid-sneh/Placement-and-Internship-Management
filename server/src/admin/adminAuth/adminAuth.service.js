import Admin from "../../../models/admin.js";
import AuthHelper from "../../common/authHelper.js";

class adminAuthServices {
    /**
     * @description: admin login
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
                    message: "email and password are required.",
                });
            }

            const findAdmin = await Admin.findOne({
                email: email.toLowerCase(),
            });

            if (!findAdmin) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid admin credentials",
                });
            }

            const matchPassword = await AuthHelper.matchHashedPassword(
                password,
                findAdmin.password
            );

            if (!matchPassword) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid admin credentials",
                });
            }

            const adminToken = AuthHelper.generateToken(findAdmin._id.toString(), {
                role: "admin",
                email: findAdmin.email,
            });

            return res.status(200).json({
                success: true,
                message: "Login successful.",
                data: {
                    token: adminToken,
                    user: {
                        id: findAdmin._id,
                        name: "Admin",
                        email: findAdmin.email,
                        role: "admin",
                        isActive: true,
                    },
                },
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    }
}

export default adminAuthServices;

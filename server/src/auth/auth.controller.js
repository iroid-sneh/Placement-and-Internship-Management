import authServices from "./auth.service.js";

class authController {
    /**
     * @description: Register a new user
     * @param {*} req
     * @param {*} res
     */
    static async register(req, res) {
        const data = await authServices.register(req.body, req, res);
        return data;
    }

    /**
     * @description: Login a user
     * @param {*} req
     * @param {*} res
     */
    static async login(req, res) {
        const data = await authServices.login(req.body, req, res);
        return data;
    }
}

export default authController;

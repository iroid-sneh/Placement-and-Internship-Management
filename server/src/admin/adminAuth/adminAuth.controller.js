import adminAuthServices from "./adminAuth.service.js";

class adminAuthController {
    /**
     * @description: admin login
     * @param {*} req
     * @param {*} res
     */
    static async login(req, res) {
        const data = await adminAuthServices.login(req.body, req, res);
        return data;
    }
}

export default adminAuthController;

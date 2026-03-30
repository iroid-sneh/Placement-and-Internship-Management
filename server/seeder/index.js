import Admin from "../models/admin.js";
import AuthHelper from "../src/common/authHelper.js";

const seedAdmin = async () => {
    const adminData = {
        email: "admin@gmail.com",
        password: "admin@123", //
    };

    const findData = await Admin.find({});

    if (findData.length === 0) {
        const hashedPassword = await AuthHelper.hashPassword(
            adminData.password
        );
        await Admin.create({
            email: adminData.email,
            password: hashedPassword,
        });
        console.log("Admin Seeded");
        return true;
    }

    return false;
};

export default seedAdmin;

import fs from "fs";
import multer from "multer";
import { RESUMES_ROOT } from "../constants/paths.js";

if (!fs.existsSync(RESUMES_ROOT)) {
    fs.mkdirSync(RESUMES_ROOT, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, RESUMES_ROOT);
    },
    filename: (_req, file, callback) => {
        const safeName = file.originalname.replace(/\s+/g, "_");
        callback(null, `${Date.now()}_${safeName}`);
    },
});

const resumeUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        const isPdf =
            file.mimetype === "application/pdf" ||
            file.originalname.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            return callback(new Error("Only PDF resumes are allowed"));
        }

        return callback(null, true);
    },
});

export default resumeUpload;

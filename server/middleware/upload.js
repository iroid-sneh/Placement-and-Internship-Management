import fs from "fs";
import path from "path";
import multer from "multer";

const resumesDirectory = path.join(process.cwd(), "public", "resumes");

if (!fs.existsSync(resumesDirectory)) {
    fs.mkdirSync(resumesDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, resumesDirectory);
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
});

export default resumeUpload;

import path from "path";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

export const SERVER_ROOT = path.resolve(currentDir, "..");
export const PUBLIC_ROOT = path.join(SERVER_ROOT, "public");
export const RESUMES_ROOT = path.join(PUBLIC_ROOT, "resumes");

import multer from "multer";
import path from "path";
import os from "os";
import { env } from "../config/env";

const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.dwg",
  "application/acad",
  "application/octet-stream",
]);

/** Multer writes to OS temp; IFileStorage moves into UPLOAD_DIR (or S3). */
export const enquiryDrawingUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      cb(null, `upload-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    const mime = file.mimetype || "application/octet-stream";
    if (!ALLOWED_MIME.has(mime) && !mime.startsWith("image/")) {
      cb(new Error("File type not allowed"));
      return;
    }
    cb(null, true);
  },
});

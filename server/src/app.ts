import "reflect-metadata"; // Required for tsyringe dependency injection
import "./config/container"; // Register containers
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { env } from "./config/env";
import { authRouter } from "./routes/auth.routes";
import { clientRouter } from "./routes/client.routes";
import { complaintRouter } from "./routes/complaint.routes";
import { smrRouter } from "./routes/smr.routes";
import { staffRouter } from "./routes/staff.routes";
import { amcRouter } from "./routes/amc.routes";
import { enquiryRouter } from "./routes/enquiry.routes";
import { quotationRouter } from "./routes/quotation.routes";
import { financeRouter } from "./routes/finance.routes";
import { adminRouter } from "./routes/admin.routes";
import { auditLogRouter } from "./routes/auditLog.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// Standard middlewares
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Local file uploads (when FILE_STORAGE_PROVIDER=local)
if (env.FILE_STORAGE_PROVIDER === "local") {
  const uploadPath = path.resolve(env.UPLOAD_DIR);
  fs.mkdirSync(uploadPath, { recursive: true });
  app.use("/uploads", express.static(uploadPath));
}

// Base Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Modular Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/clients", clientRouter);
app.use("/api/v1/complaints", complaintRouter);
app.use("/api/v1/smrs", smrRouter);
app.use("/api/v1/staff", staffRouter);
app.use("/api/v1/amc", amcRouter);
app.use("/api/v1/enquiries", enquiryRouter);
app.use("/api/v1/quotations", quotationRouter);
app.use("/api/v1/finance", financeRouter);
app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/audit-logs", auditLogRouter);

// Centralized error handler (must be registered last)
app.use(errorHandler);

export default app;


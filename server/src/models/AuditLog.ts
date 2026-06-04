import { Schema, model, Document } from "mongoose";
import { IAuditLog } from "../interfaces/models/IAuditLog";

export interface IAuditLogDocument extends Document, Omit<IAuditLog, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    user: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true, index: true },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound index for search filtering optimizations
auditLogSchema.index({ user: "text", action: "text", details: "text" });

export const AuditLogModel = model<IAuditLogDocument>("AuditLog", auditLogSchema);

import { Schema, model, Document } from "mongoose";
import { ISubcontract } from "../interfaces/models/ISubcontract";

export interface ISubcontractDocument extends Document, Omit<ISubcontract, "id" | "projectRef"> {
  projectRef: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const subcontractSchema = new Schema<ISubcontractDocument>(
  {
    projectRef: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    contractorName: { type: String, required: true, trim: true },
    scopeOfWork: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Active", "Completed"],
      required: true,
      default: "Pending"
    },
    completionReportUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

export const SubcontractModel = model<ISubcontractDocument>("Subcontract", subcontractSchema);

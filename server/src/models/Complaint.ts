import { Schema, model, Document } from "mongoose";
import { IComplaint } from "../interfaces/models/IComplaint";

export interface IComplaintDocument extends Document, Omit<IComplaint, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const remarkSchema = new Schema(
  {
    user: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    text: { type: String, required: true }
  },
  { _id: false }
);

const complaintSchema = new Schema<IComplaintDocument>(
  {
    complaintNo: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    clientId: { type: String, required: true, ref: "Client" },
    clientName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    issue: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      required: true,
      default: "Medium"
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      required: true,
      default: "Pending"
    },
    assignedTo: { type: [String], default: [] },
    location: { type: String, required: true, trim: true },
    expectedResolution: { type: Date, required: true },
    remarks: { type: [remarkSchema], default: [] }
  },
  { timestamps: true }
);

export const ComplaintModel = model<IComplaintDocument>("Complaint", complaintSchema);

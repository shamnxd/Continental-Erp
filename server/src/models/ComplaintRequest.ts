import { Schema, model, Document } from "mongoose";
import { IComplaintRequest } from "../interfaces/models/IComplaintRequest";

export interface IComplaintRequestDocument extends Document, Omit<IComplaintRequest, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const complaintRequestSchema = new Schema<IComplaintRequestDocument>(
  {
    clientName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    location: { type: String, required: true, trim: true },
    issue: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Converted", "Rejected"],
      required: true,
      default: "Pending"
    },
    convertedComplaintId: { type: String, default: null }
  },
  { timestamps: true }
);

export const ComplaintRequestModel = model<IComplaintRequestDocument>("ComplaintRequest", complaintRequestSchema);

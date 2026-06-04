import { Schema, model, Document } from "mongoose";
import { IStaff } from "../interfaces/models/IStaff";

export interface IStaffDocument extends Document, Omit<IStaff, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const staffSchema = new Schema<IStaffDocument>(
  {
    staffNo: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    city: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    customRole: { type: String, trim: true, default: "" },
    employmentType: {
      type: String,
      enum: ["Permanent", "Temporary"],
      required: true,
      default: "Permanent"
    },
    specialization: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Available", "On Site", "On Leave", "Inactive"],
      required: true,
      default: "Available"
    },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, required: true, default: true },
    passwordHash: { type: String, default: null },
    refreshToken: { type: String, default: null }
  },
  { timestamps: true }
);

export const StaffModel = model<IStaffDocument>("Staff", staffSchema);

import { Schema, model, Document } from "mongoose";
import { ILeaveRequest } from "../interfaces/models/ILeaveRequest";

export interface ILeaveRequestDocument extends Document, Omit<ILeaveRequest, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequestDocument>(
  {
    staffId: { type: String, required: true, index: true },
    staffName: { type: String, required: true, trim: true },
    staffNo: { type: String, required: true, trim: true },
    leaveType: {
      type: String,
      enum: ["Annual", "Sick", "Emergency", "Unpaid", "Other"],
      required: true,
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    reason: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      required: true,
    },
    adminNote: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export const LeaveRequestModel = model<ILeaveRequestDocument>("LeaveRequest", leaveRequestSchema);

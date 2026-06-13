import { Schema, model, Document } from "mongoose";
import { IEnquiry } from "../interfaces/models/IEnquiry";

export interface IEnquiryDocument extends Document, Omit<IEnquiry, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const remarkSchema = new Schema({
  user: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  text: { type: String, required: true, trim: true },
});

const activitySchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "created",
        "assigned",
        "reassigned",
        "status_changed",
        "priority_changed",
        "updated",
        "remark_added",
        "file_uploaded",
      ],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    user: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const drawingSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    storageKey: { type: String, default: "", trim: true },
    url: { type: String, default: "", trim: true },
    mimeType: { type: String, default: "", trim: true },
    size: { type: Number, default: 0 },
    uploadDate: { type: Date, required: true, default: Date.now },
    uploadedBy: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const enquirySchema = new Schema<IEnquiryDocument>(
  {
    enquiryNo: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    // Legacy: stored clientId as string. Keep for backwards compatibility.
    clientId: { type: String, required: true, trim: true },
    // New: proper reference for populate.
    clientRef: { type: Schema.Types.ObjectId, ref: "Client", default: null, index: true },
    // Legacy snapshot fields.
    clientName: { type: String, trim: true, default: "" },
    contactPerson: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    requirement: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [
        "Site Visit Scheduled",
        "Quotation Prepared",
        "Follow-up Required",
        "Converted to Project",
        "Closed",
      ],
      required: true,
      default: "Follow-up Required",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
      default: "Medium",
    },
    assignedTo: { type: String, default: "", trim: true },
    assignedStaffId: { type: String, default: "" },
    followUpDate: { type: Date, default: null },
    drawings: { type: [drawingSchema], default: [] },
    remarks: { type: [remarkSchema], default: [] },
    activityLog: { type: [activitySchema], default: [] },
  },
  { timestamps: true },
);

export const EnquiryModel = model<IEnquiryDocument>("Enquiry", enquirySchema);

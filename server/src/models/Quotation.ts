import { Schema, model, Document } from "mongoose";
import { IQuotation } from "../interfaces/models/IQuotation";

export interface IQuotationDocument extends Document, Omit<IQuotation, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const remarkSchema = new Schema({
  user: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  text: { type: String, required: true, trim: true },
});

const lineItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    section: { type: String, enum: ["machine_side", "low_side"], default: "machine_side" },
    unit: { type: String, default: "" },
    group: { type: String, default: "", trim: true },
    isDescriptionOnly: { type: Boolean, default: false },
  },
  { _id: false },
);

const quotationSchema = new Schema<IQuotationDocument>(
  {
    quotationNo: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, required: true },
    // Legacy: stored clientId as string. Keep for backwards compatibility.
    clientId: { type: String, required: true, trim: true },
    // New: proper reference for populate.
    clientRef: { type: Schema.Types.ObjectId, ref: "Client", default: null, index: true },
    // Legacy snapshot field.
    clientName: { type: String, trim: true, default: "" },
    enquiryId: { type: String, default: "" },
    enquiryNo: { type: String, default: "", trim: true },
    amount: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, required: true, default: 18, min: 0, max: 100 },
    machineGstPercent: { type: Number, min: 0, max: 100 },
    lowSideGstPercent: { type: Number, min: 0, max: 100 },
    gst: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Draft", "Pending Approval", "Approved", "Rejected", "Expired"],
      required: true,
      default: "Pending Approval",
    },
    items: { type: [lineItemSchema], default: [] },
    remarks: { type: [remarkSchema], default: [] },
    notes: { type: String, default: "", trim: true },
    revision: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
    costingId: { type: String, default: "" },
    costingRevision: { type: Number },
    clonedFromQuotationRevision: { type: Number },
  },
  { timestamps: true },
);

quotationSchema.index({ quotationNo: 1, revision: 1 }, { unique: true });

export const QuotationModel = model<IQuotationDocument>("Quotation", quotationSchema);

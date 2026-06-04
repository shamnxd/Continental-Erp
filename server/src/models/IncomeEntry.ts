import { Schema, model, Document } from "mongoose";
import { IIncomeEntry } from "../interfaces/models/IIncomeEntry";

export interface IIncomeEntryDocument extends Document, Omit<IIncomeEntry, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const incomeEntrySchema = new Schema<IIncomeEntryDocument>(
  {
    source: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: ["Client Payment", "AMC Renewal", "Advance", "Refund", "Other"],
      required: true,
      default: "Client Payment",
    },
    clientId: { type: String, trim: true },
    clientName: { type: String, trim: true },
    incomeDate: { type: String, required: true },
    expectedDate: { type: String, trim: true },
    expectedAmount: { type: Number, required: true, default: 0 },
    actualReceived: { type: Number, required: true, default: 0 },
    paymentMethod: { type: String, trim: true },
    referenceNo: { type: String, trim: true },
    enquiryId: { type: String, trim: true },
    enquiryNo: { type: String, trim: true },
    quotationId: { type: String, trim: true },
    quotationNo: { type: String, trim: true },
    complaintId: { type: String, trim: true },
    complaintNo: { type: String, trim: true },
    amcId: { type: String, trim: true },
    amcNo: { type: String, trim: true },
    appliedToInvoiceId: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const IncomeEntryModel = model<IIncomeEntryDocument>("IncomeEntry", incomeEntrySchema);

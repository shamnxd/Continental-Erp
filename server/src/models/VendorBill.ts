import { Schema, model, Document } from "mongoose";
import { IVendorBill } from "../interfaces/models/IVendorBill";
import { financeLineItemSchema } from "./financeSchemas";

export interface IVendorBillDocument extends Document, Omit<IVendorBill, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const vendorBillSchema = new Schema<IVendorBillDocument>(
  {
    billNo: { type: String, required: true, unique: true, trim: true },
    vendor: { type: String, required: true, trim: true },
    vendorGstin: { type: String, trim: true },
    vendorInvoiceNo: { type: String, trim: true },
    category: {
      type: String,
      enum: ["Spare Parts", "Subcontractor", "Salary", "Rent", "GST", "Utility"],
      required: true,
    },
    billDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    paymentTerms: { type: String, trim: true },
    referenceNo: { type: String, trim: true },
    items: { type: [financeLineItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    gstPercent: { type: Number, required: true, default: 18 },
    gstAmount: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, required: true, default: 0 },
    outstanding: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["Paid", "Partially Paid", "Overdue", "Open"], required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const VendorBillModel = model<IVendorBillDocument>("VendorBill", vendorBillSchema);

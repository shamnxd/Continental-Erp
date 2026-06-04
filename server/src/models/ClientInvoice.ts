import { Schema, model, Document } from "mongoose";
import { IClientInvoice } from "../interfaces/models/IClientInvoice";
import { financeLineItemSchema } from "./financeSchemas";

export interface IClientInvoiceDocument extends Document, Omit<IClientInvoice, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const invoiceTypes = [
  "Tax Invoice",
  "Proforma",
  "AMC Invoice",
  "Credit Note",
  "AMC Upfront",
  "Complaint Postpaid",
  "Supplementary",
];

const clientInvoiceSchema = new Schema<IClientInvoiceDocument>(
  {
    invoiceNo: { type: String, required: true, unique: true, trim: true },
    invoiceType: { type: String, enum: invoiceTypes, required: true },
    documentStatus: { type: String, enum: ["Draft", "Approved", "Cancelled"], default: "Draft" },
    companyName: { type: String, trim: true, default: "Continental" },
    currency: { type: String, trim: true, default: "INR" },
    clientId: { type: String, trim: true },
    clientName: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    clientEmail: { type: String, trim: true },
    clientPhone: { type: String, trim: true },
    clientGstin: { type: String, trim: true },
    billingAddress: { type: String, trim: true },
    siteAddress: { type: String, trim: true },
    placeOfSupply: { type: String, trim: true },
    enquiryId: { type: String, trim: true },
    enquiryNo: { type: String, trim: true },
    quotationId: { type: String, trim: true },
    quotationNo: { type: String, trim: true },
    complaintId: { type: String, trim: true },
    complaintNo: { type: String, trim: true },
    amcId: { type: String, trim: true },
    amcNo: { type: String, trim: true },
    smrId: { type: String, trim: true },
    smrNo: { type: String, trim: true },
    jobCardNo: { type: String, trim: true },
    workOrderNo: { type: String, trim: true },
    issueDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    paymentTerms: { type: String, trim: true },
    items: { type: [financeLineItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    headerDiscount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true, default: 0 },
    gstPercent: { type: Number, required: true, default: 18 },
    supplyType: { type: String, enum: ["intra", "inter"], default: "intra" },
    cgstPercent: { type: Number },
    sgstPercent: { type: Number },
    igstPercent: { type: Number },
    vatPercent: { type: Number },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, required: true, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    amountInWords: { type: String, trim: true },
    amountPaid: { type: Number, required: true, default: 0 },
    outstanding: { type: Number, required: true, default: 0 },
    paymentState: {
      type: String,
      enum: ["Fully Paid", "Partially Paid", "Advance Received", "Overdue", "Open"],
      required: true,
    },
    notes: { type: String, trim: true },
    terms: { type: String, trim: true },
  },
  { timestamps: true },
);

export const ClientInvoiceModel = model<IClientInvoiceDocument>("ClientInvoice", clientInvoiceSchema);

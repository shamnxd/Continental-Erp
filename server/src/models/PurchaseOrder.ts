import { Schema, model, Document } from "mongoose";
import { IPurchaseOrder } from "../interfaces/models/IPurchaseOrder";

export interface IPurchaseOrderDocument extends Document, Omit<IPurchaseOrder, "id" | "projectRef"> {
  projectRef: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderLineItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const purchaseOrderRevisionSchema = new Schema(
  {
    revisionNo: { type: Number, required: true },
    vendorName: { type: String, required: true },
    amount: { type: Number, required: true },
    items: { type: [purchaseOrderLineItemSchema], default: [] },
    pdfUrl: { type: String },
    pdfStorageKey: { type: String },
    updatedBy: { type: String, required: true },
    updatedAt: { type: Date, required: true }
  },
  { _id: false }
);

const purchaseOrderActivitySchema = new Schema(
  {
    message: { type: String, required: true },
    user: { type: String, required: true },
    date: { type: Date, required: true }
  },
  { _id: false }
);

const purchaseOrderDocumentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    storageKey: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedDate: { type: Date, required: true }
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema<IPurchaseOrderDocument>(
  {
    projectRef: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    poNo: { type: String, required: true, unique: true, trim: true },
    vendorName: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Ordered", "Delivered"],
      required: true,
      default: "Pending"
    },
    items: { type: [purchaseOrderLineItemSchema], default: [] },
    pdfUrl: { type: String },
    pdfStorageKey: { type: String },
    pdfDocs: { type: [purchaseOrderDocumentSchema], default: [] },
    revision: { type: Number, required: true, default: 0 },
    revisions: { type: [purchaseOrderRevisionSchema], default: [] },
    activityLog: { type: [purchaseOrderActivitySchema], default: [] }
  },
  { timestamps: true }
);

export const PurchaseOrderModel = model<IPurchaseOrderDocument>("PurchaseOrder", purchaseOrderSchema);


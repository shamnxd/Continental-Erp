import { Schema, model, Document } from "mongoose";
import { IWarranty } from "../interfaces/models/IWarranty";

export interface IWarrantyDocument extends Document, Omit<IWarranty, "id" | "clientRef" | "projectRef"> {
  clientRef: Schema.Types.ObjectId;
  projectRef?: Schema.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const warrantySchema = new Schema<IWarrantyDocument>(
  {
    warrantyNo: { type: String, required: true, unique: true, trim: true },
    clientRef: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    projectRef: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
    product: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Active", "Expiring Soon", "Expired", "Claimed"],
      required: true,
      default: "Active"
    },
    remarks: { type: String, default: "" }
  },
  { timestamps: true }
);

export const WarrantyModel = model<IWarrantyDocument>("Warranty", warrantySchema);

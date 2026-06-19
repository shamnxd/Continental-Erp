import { Schema, model, Document } from "mongoose";
import { IClient } from "../interfaces/models/IClient";

export interface IClientDocument extends Document, Omit<IClient, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClientDocument>(
  {
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    gst: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "" },
    projectsCount: { type: Number, default: 0 },
    amcStatus: { type: String, enum: ["Active", "Inactive", "Expired"], default: "Inactive" },
    parentCompany: { type: String, trim: true, default: "" },
    logoUrl: { type: String, trim: true, default: "" },
    tallyLedgerName: { type: String, trim: true },
    tallySyncStatus: { type: String, enum: ["Pending", "Synced", "Failed"], default: "Pending" },
    tallySyncError: { type: String, default: "" },
    tallyLastSyncedAt: { type: Date }
  },
  { timestamps: true }
);

export const ClientModel = model<IClientDocument>("Client", clientSchema);

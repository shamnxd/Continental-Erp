import { Schema, model, Document, Types } from "mongoose";
import { IAmc } from "../interfaces/models/IAmc";

export interface IAmcDocument extends Document, Omit<IAmc, "id" | "clientId"> {
  clientId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const amcSchema = new Schema<IAmcDocument>(
  {
    amcNo: { type: String, required: true, unique: true, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    clientName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    location: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    frequency: {
      type: String,
      enum: ["Monthly", "Quarterly", "Bi-Annual", "Annual"],
      required: true
    },
    nextVisit: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Active", "Due for Renewal", "Expired"],
      required: true,
      default: "Active"
    },
    amount: { type: Number, required: true, min: 0 },
    visitsCompleted: { type: Number, required: true, default: 0, min: 0 },
    totalVisits: { type: Number, required: true, min: 1 },
    serviceType: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, default: "" },
    remarks: {
      type: [
        {
          user: { type: String, required: true },
          date: { type: Date, required: true, default: Date.now },
          text: { type: String, required: true }
        }
      ],
      default: []
    },
    advancePaid: { type: Number, default: 0, min: 0 },
    payments: {
      type: [
        {
          date: { type: Date, required: true, default: Date.now },
          amount: { type: Number, required: true, min: 0 },
          type: { type: String, enum: ["Advance", "Payment"], required: true },
          note: { type: String, trim: true, default: "" },
          recordedBy: { type: String, trim: true, default: "" }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

export const AmcModel = model<IAmcDocument>("Amc", amcSchema);

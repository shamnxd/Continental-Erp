import { Schema, model, Document, Types } from "mongoose";
import { IAmcVisit } from "../interfaces/models/IAmcVisit";

export interface IAmcVisitDocument extends Document, Omit<IAmcVisit, "id" | "amcId"> {
  amcId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const amcVisitSchema = new Schema<IAmcVisitDocument>(
  {
    amcId: { type: Schema.Types.ObjectId, ref: "Amc", required: true, index: true },
    scheduledDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
      required: true
    },
    notes: { type: String, trim: true, default: "" },
    assignedStaffIds: [{ type: Schema.Types.ObjectId, ref: "Staff" }],
    smrId: { type: Schema.Types.ObjectId, ref: "SMR", default: null }
  },
  { timestamps: true }
);

export const AmcVisitModel = model<IAmcVisitDocument>("AmcVisit", amcVisitSchema);

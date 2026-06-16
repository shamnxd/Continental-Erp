import { Schema, model, Document } from "mongoose";
import { IMinorJob } from "../interfaces/models/IMinorJob";

export interface IMinorJobDocument extends Document, Omit<IMinorJob, "id" | "clientRef"> {
  clientRef: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const minorJobSchema = new Schema<IMinorJobDocument>(
  {
    jobNo: { type: String, required: true, unique: true, trim: true },
    clientRef: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    description: { type: String, required: true, trim: true },
    scheduledDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed"],
      required: true,
      default: "Open"
    },
    assignedTo: { type: String, default: "", trim: true },
    assignedStaffId: { type: String, default: "" },
    quotationRef: { type: Schema.Types.ObjectId, ref: "Quotation", default: null }
  },
  { timestamps: true }
);

export const MinorJobModel = model<IMinorJobDocument>("MinorJob", minorJobSchema);

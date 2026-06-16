import { Schema, model, Document } from "mongoose";
import { IProject } from "../interfaces/models/IProject";

export interface IProjectDocument extends Document, Omit<IProject, "id" | "clientRef"> {
  clientRef: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProjectDocument>(
  {
    projectNo: { type: String, required: true, unique: true, trim: true },
    clientRef: { type: Schema.Types.ObjectId, ref: "Client", required: true, index: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Planning", "Active", "On Hold", "Completed"],
      required: true,
      default: "Planning"
    },
    value: { type: Number, required: true, min: 0 },
    quotationRef: { type: Schema.Types.ObjectId, ref: "Quotation", default: null },
    expectedCompletionDate: { type: Date, default: null },
    actualCompletionDate: { type: Date, default: null },
    handoverDocs: {
      type: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        storageKey: { type: String },
        uploadedBy: { type: String, required: true },
        uploadedDate: { type: Date, default: Date.now }
      }],
      default: []
    }
  },
  { timestamps: true }
);

export const ProjectModel = model<IProjectDocument>("Project", projectSchema);

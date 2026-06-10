import { Schema, model, Document } from "mongoose";
import { IRemark } from "../interfaces/models/IRemark";

export interface IRemarkDocument extends Document, Omit<IRemark, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const remarkSchema = new Schema<IRemarkDocument>(
  {
    entityType: {
      type: String,
      enum: ["enquiry", "complaint", "complaint_request", "amc", "project", "minorjob", "warranty", "quotation"],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    user: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    attachments: { type: [attachmentSchema], default: [] },
    parentRemarkId: { type: String, default: null },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

remarkSchema.index({ entityType: 1, entityId: 1 });

export const RemarkModel = model<IRemarkDocument>("Remark", remarkSchema);

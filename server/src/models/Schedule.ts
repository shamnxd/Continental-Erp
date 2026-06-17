import { Schema, model, Document, Types } from "mongoose";
import { ISchedule } from "../interfaces/models/ISchedule";

export interface IScheduleDocument extends Document, Omit<ISchedule, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<IScheduleDocument>(
  {
    entityType: {
      type: String,
      enum: ["enquiry", "complaint", "amc", "project", "minorjob"],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    entityNo: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    clientRef: { type: Schema.Types.ObjectId, ref: "Client", default: null, index: true },
    title: { type: String, required: true, trim: true },
    scheduleType: {
      type: String,
      enum: [
        "Follow-up",
        "Schedule Visit",
        "Enquiry Visit",
        "AMC Visit",
        "Complaint Resolution",
        "Project Installation",
        "Minor Job",
      ],
      required: true,
      index: true,
    },
    scheduledDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled", "Pending", "In Progress"],
      required: true,
      default: "Scheduled",
    },
    assignedStaffIds: { type: [String], default: [] },
    assignedTo: { type: [String], default: [] },
    notes: { type: String, trim: true, default: "" },
    smrId: { type: Schema.Types.ObjectId, ref: "SMR", default: null },
    completedAt: { type: Date, default: null },
    completionNotes: { type: String, trim: true, default: "" },
    completionAttachment: {
      type: {
        name: { type: String, required: true },
        url: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
      },
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index for querying schedules of a specific entity efficiently
scheduleSchema.index({ entityType: 1, entityId: 1 });

export const ScheduleModel = model<IScheduleDocument>("Schedule", scheduleSchema);

import { Schema, model, Document } from "mongoose";
import { ITallySyncQueue } from "../interfaces/models/ITallySyncQueue";

export interface ITallySyncQueueDocument extends Document, Omit<ITallySyncQueue, "id" | "entityId"> {
  entityId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tallySyncQueueSchema = new Schema<ITallySyncQueueDocument>(
  {
    entityType: {
      type: String,
      enum: ["Client", "Quotation", "PurchaseOrder", "Invoice"],
      required: true,
      index: true
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Synced", "Failed"],
      required: true,
      default: "Pending",
      index: true
    },
    attempts: {
      type: Number,
      required: true,
      default: 0
    },
    lastError: {
      type: String,
      default: ""
    },
    syncedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Compound index for getting next item in queue quickly
tallySyncQueueSchema.index({ status: 1, createdAt: 1 });

export const TallySyncQueueModel = model<ITallySyncQueueDocument>(
  "TallySyncQueue",
  tallySyncQueueSchema
);

import { Schema, model, Document } from "mongoose";
import { ITallyCache } from "../interfaces/models/ITallyCache";

export interface ITallyCacheDocument extends Document, Omit<ITallyCache, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const tallyCacheSchema = new Schema<ITallyCacheDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    lastSyncedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

export const TallyCacheModel = model<ITallyCacheDocument>("TallyCache", tallyCacheSchema);

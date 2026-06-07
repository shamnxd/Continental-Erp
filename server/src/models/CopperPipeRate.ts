import { Schema, model, Document } from "mongoose";

export interface ICopperPipeRate {
  size: string;
  type: "hard" | "soft";
  rate: number;
  sleeveRate: number;
  unit: string;
  remarks?: string;
}

export interface ICopperPipeRateDocument extends Document, Omit<ICopperPipeRate, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const copperPipeRateSchema = new Schema<ICopperPipeRateDocument>(
  {
    size: { type: String, required: true },
    type: { type: String, enum: ["hard", "soft"], required: true },
    rate: { type: Number, required: true, min: 0 },
    sleeveRate: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "M" },
    remarks: { type: String, default: "" },
  },
  { timestamps: true }
);

export const CopperPipeRateModel = model<ICopperPipeRateDocument>("CopperPipeRate", copperPipeRateSchema);

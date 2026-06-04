import { Schema } from "mongoose";

export const financeLineItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    itemCode: { type: String, trim: true },
    unit: { type: String, trim: true, default: "Nos" },
    qty: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true, default: 0 },
    discountPercent: { type: Number, default: 0 },
    total: { type: Number, required: true, default: 0 },
    hsnSac: { type: String, trim: true },
  },
  { _id: false },
);

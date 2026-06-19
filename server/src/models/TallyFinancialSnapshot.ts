import { Schema, model, Document } from "mongoose";
import { ITallyFinancialSnapshot } from "../interfaces/models/ITallyFinancialSnapshot";

export interface ITallyFinancialSnapshotDocument extends Document, Omit<ITallyFinancialSnapshot, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const tallyFinancialSnapshotSchema = new Schema<ITallyFinancialSnapshotDocument>(
  {
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true, index: true },
    revenue: { type: Number, required: true, default: 0 },
    expenses: { type: Number, required: true, default: 0 },
    netProfit: { type: Number, required: true, default: 0 },
    grossProfit: { type: Number, required: true, default: 0 },
    topExpenseLedgers: [
      {
        ledgerName: { type: String, required: true },
        amount: { type: Number, required: true }
      }
    ],
    tallySyncedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

// Ensure query performance for period ranges
tallyFinancialSnapshotSchema.index({ periodStart: 1, periodEnd: 1 }, { unique: true });

export const TallyFinancialSnapshotModel = model<ITallyFinancialSnapshotDocument>(
  "TallyFinancialSnapshot",
  tallyFinancialSnapshotSchema
);

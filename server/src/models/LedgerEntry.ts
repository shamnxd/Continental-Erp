import { Schema, model, Document } from "mongoose";
import { ILedgerEntry } from "../interfaces/models/ILedgerEntry";

export interface ILedgerEntryDocument extends Document, Omit<ILedgerEntry, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const ledgerEntrySchema = new Schema<ILedgerEntryDocument>(
  {
    date: { type: String, required: true },
    refType: { type: String, enum: ["INVOICE", "VENDOR_BILL", "PAYMENT_IN", "PAYMENT_OUT", "ADVANCE_IN", "ADJUSTMENT"], required: true },
    refNo: { type: String, required: true, trim: true },
    narration: { type: String, required: true, trim: true },
    debit: { type: Number, required: true, default: 0 },
    credit: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const LedgerEntryModel = model<ILedgerEntryDocument>("LedgerEntry", ledgerEntrySchema);

import { Schema, model, Document } from "mongoose";
import { IExpenseEntry } from "../interfaces/models/IExpenseEntry";

export interface IExpenseEntryDocument extends Document, Omit<IExpenseEntry, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const expenseEntrySchema = new Schema<IExpenseEntryDocument>(
  {
    category: { type: String, enum: ["Salary", "Rent", "GST", "Utilities", "Materials", "Travel", "Fuel", "Other"], required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    payee: { type: String, trim: true },
    expenseDate: { type: String, required: true },
    periodMonth: { type: String, required: true },
    paymentMethod: { type: String, trim: true },
    referenceNo: { type: String, trim: true },
    budget: { type: Number, required: true, default: 0 },
    actual: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["Planned", "Recorded", "Paid"], required: true, default: "Recorded" },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export const ExpenseEntryModel = model<IExpenseEntryDocument>("ExpenseEntry", expenseEntrySchema);

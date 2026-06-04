export interface IExpenseEntry {
  id?: string;
  category: "Salary" | "Rent" | "GST" | "Utilities" | "Materials" | "Travel" | "Fuel" | "Other";
  name: string;
  description?: string;
  payee?: string;
  expenseDate: string;
  periodMonth: string;
  paymentMethod?: string;
  referenceNo?: string;
  budget: number;
  actual: number;
  status: "Planned" | "Recorded" | "Paid";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

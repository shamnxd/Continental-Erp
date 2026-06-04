import { IFinanceLineItem } from "./IFinanceLineItem";

export interface IVendorBill {
  id?: string;
  billNo: string;
  vendor: string;
  vendorGstin?: string;
  vendorInvoiceNo?: string;
  category: "Spare Parts" | "Subcontractor" | "Salary" | "Rent" | "GST" | "Utility";
  billDate: string;
  dueDate: string;
  paymentTerms?: string;
  referenceNo?: string;
  items: IFinanceLineItem[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
  amountPaid: number;
  outstanding: number;
  status: "Paid" | "Partially Paid" | "Overdue" | "Open";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

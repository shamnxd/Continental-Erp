import { IClientInvoice } from "../interfaces/models/IClientInvoice";
import { IVendorBill } from "../interfaces/models/IVendorBill";

export type InvoicePaymentState = IClientInvoice["paymentState"];
export type VendorBillStatus = IVendorBill["status"];

function todayIsoDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function computeOutstanding(total: number, amountPaid: number): number {
  return Math.max(0, total - amountPaid);
}

export function computeInvoicePaymentState(
  grandTotal: number,
  amountPaid: number,
  dueDate: string,
  asOfDate: string = todayIsoDate(),
): InvoicePaymentState {
  const outstanding = computeOutstanding(grandTotal, amountPaid);

  if (grandTotal <= 0) return "Fully Paid";
  if (outstanding === 0) return "Fully Paid";
  if (amountPaid > grandTotal) return "Advance Received";
  if (amountPaid > 0) return asOfDate > dueDate ? "Overdue" : "Partially Paid";
  return asOfDate > dueDate ? "Overdue" : "Open";
}

export function computeVendorBillStatus(
  total: number,
  amountPaid: number,
  dueDate: string,
  asOfDate: string = todayIsoDate(),
): VendorBillStatus {
  const outstanding = computeOutstanding(total, amountPaid);

  if (total <= 0) return "Paid";
  if (outstanding === 0) return "Paid";
  if (amountPaid > 0) return asOfDate > dueDate ? "Overdue" : "Partially Paid";
  return asOfDate > dueDate ? "Overdue" : "Open";
}

export function buildInvoiceNo(existingCount: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(existingCount + 1).padStart(3, "0")}`;
}

export function buildReceiptNo(existingLedgerCount: number): string {
  const year = new Date().getFullYear();
  return `RCPT-${year}-${String(existingLedgerCount + 1).padStart(3, "0")}`;
}

export function buildPaymentOutNo(existingLedgerCount: number): string {
  const year = new Date().getFullYear();
  return `PAY-${year}-${String(existingLedgerCount + 1).padStart(3, "0")}`;
}

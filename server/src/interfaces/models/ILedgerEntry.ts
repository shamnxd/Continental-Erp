export interface ILedgerEntry {
  id?: string;
  date: string;
  refType: "INVOICE" | "VENDOR_BILL" | "PAYMENT_IN" | "PAYMENT_OUT" | "ADVANCE_IN" | "ADJUSTMENT";
  refNo: string;
  narration: string;
  debit: number;
  credit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

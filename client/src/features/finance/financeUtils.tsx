import type { ClientInvoice, LedgerEntry, PaymentState, VendorBill } from "../../interfaces/finance.interface";

export function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export function stateBadge(state: PaymentState) {
  const map: Record<PaymentState, string> = {
    "Fully Paid": "bg-green-500/10 text-green-700",
    "Partially Paid": "bg-amber-500/10 text-amber-700",
    "Advance Received": "bg-blue-500/10 text-blue-700",
    Open: "bg-slate-500/10 text-slate-700",
    Overdue: "bg-red-500/10 text-red-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${map[state]}`}>
      {state}
    </span>
  );
}

export function billStatusBadge(status: VendorBill["status"]) {
  const map: Record<VendorBill["status"], string> = {
    Paid: "bg-green-500/10 text-green-700",
    "Partially Paid": "bg-amber-500/10 text-amber-700",
    Overdue: "bg-red-500/10 text-red-700",
    Open: "bg-slate-500/10 text-slate-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${map[status]}`}>{status}</span>;
}

export function ledgerMoneyIn(row: LedgerEntry) {
  return row.debit > 0 ? row.debit : 0;
}

export function ledgerMoneyOut(row: LedgerEntry) {
  return row.credit > 0 ? row.credit : 0;
}

export function isInvoiceOverdue(inv: ClientInvoice) {
  return inv.paymentState === "Overdue" || (inv.outstanding > 0 && inv.dueDate < todayIsoDate());
}

export function isBillOverdue(bill: VendorBill) {
  return bill.status === "Overdue" || (bill.outstanding > 0 && bill.dueDate < todayIsoDate());
}

import type {
  ClientInvoice,
  ExpenseEntry,
  IncomeEntry,
  LedgerEntry,
  VendorBill,
} from "../../interfaces/finance.interface";
import { isBillOverdue, isInvoiceOverdue, ledgerMoneyIn, ledgerMoneyOut } from "./financeUtils";

export interface FinanceMetrics {
  receivableOutstanding: number;
  payableOutstanding: number;
  cashReceived: number;
  cashPaidOut: number;
  overdueReceivableAmount: number;
  overduePayableAmount: number;
  overdueInvoiceCount: number;
  overdueBillCount: number;
  incomeExpected: number;
  incomeActual: number;
  expenseBudget: number;
  expenseActual: number;
  netCashPosition: number;
}

export function computeFinanceMetrics(
  invoices: ClientInvoice[],
  payables: VendorBill[],
  ledger: LedgerEntry[],
  income: IncomeEntry[],
  expenses: ExpenseEntry[],
): FinanceMetrics {
  const receivableOutstanding = invoices.reduce((s, x) => s + x.outstanding, 0);
  const payableOutstanding = payables.reduce((s, x) => s + x.outstanding, 0);
  const cashReceived = ledger
    .filter((x) => x.refType === "PAYMENT_IN" || x.refType === "ADVANCE_IN")
    .reduce((s, x) => s + ledgerMoneyIn(x), 0);
  const cashPaidOut = ledger
    .filter((x) => x.refType === "PAYMENT_OUT")
    .reduce((s, x) => s + ledgerMoneyOut(x), 0);

  const overdueInvoices = invoices.filter(isInvoiceOverdue);
  const overdueBills = payables.filter(isBillOverdue);

  return {
    receivableOutstanding,
    payableOutstanding,
    cashReceived,
    cashPaidOut,
    overdueReceivableAmount: overdueInvoices.reduce((s, x) => s + x.outstanding, 0),
    overduePayableAmount: overdueBills.reduce((s, x) => s + x.outstanding, 0),
    overdueInvoiceCount: overdueInvoices.length,
    overdueBillCount: overdueBills.length,
    incomeExpected: income.reduce((s, x) => s + x.expectedAmount, 0),
    incomeActual: income.reduce((s, x) => s + x.actualReceived, 0),
    expenseBudget: expenses.reduce((s, x) => s + x.budget, 0),
    expenseActual: expenses.reduce((s, x) => s + x.actual, 0),
    netCashPosition: cashReceived - cashPaidOut,
  };
}

import { api } from "./index";
import { ApiRoute } from "../constants/routes.enum";
import type {
  ClientInvoice,
  VendorBill,
  LedgerEntry,
  IncomeEntry,
  ExpenseEntry,
  CreateClientInvoicePayload,
  CreateVendorBillPayload,
  CreateIncomeEntryPayload,
  CreateExpenseEntryPayload,
  RecordPaymentPayload,
} from "../interfaces/finance.interface";

interface FinanceListResponse<T> {
  success: boolean;
  data: T[];
}

interface FinanceItemResponse<T> {
  success: boolean;
  data: T;
}

export async function getClientInvoicesApi(): Promise<FinanceListResponse<ClientInvoice>> {
  return await api.get(ApiRoute.FINANCE_INVOICES);
}

export async function getClientInvoiceByIdApi(invoiceId: string): Promise<FinanceItemResponse<ClientInvoice>> {
  return await api.get(`${ApiRoute.FINANCE_INVOICES}/${invoiceId}`);
}

export async function createClientInvoiceApi(
  payload: CreateClientInvoicePayload,
): Promise<FinanceItemResponse<ClientInvoice>> {
  return await api.post(ApiRoute.FINANCE_INVOICES, payload);
}

export async function recordInvoicePaymentApi(
  invoiceId: string,
  payload: RecordPaymentPayload,
): Promise<FinanceItemResponse<ClientInvoice>> {
  return await api.post(`${ApiRoute.FINANCE_INVOICES}/${invoiceId}/payments`, payload);
}

export async function sendInvoiceEmailApi(
  invoiceId: string,
  payload: { recipientEmail: string; message?: string },
): Promise<{ success: boolean; message: string }> {
  return await api.post(`${ApiRoute.FINANCE_INVOICES}/${invoiceId}/send-email`, payload);
}

export async function getVendorBillsApi(): Promise<FinanceListResponse<VendorBill>> {
  return await api.get(ApiRoute.FINANCE_BILLS);
}

export async function createVendorBillApi(
  payload: CreateVendorBillPayload,
): Promise<FinanceItemResponse<VendorBill>> {
  return await api.post(ApiRoute.FINANCE_BILLS, payload);
}

export async function recordVendorBillPaymentApi(
  billId: string,
  payload: RecordPaymentPayload,
): Promise<FinanceItemResponse<VendorBill>> {
  return await api.post(`${ApiRoute.FINANCE_BILLS}/${billId}/payments`, payload);
}

export async function getLedgerEntriesApi(): Promise<FinanceListResponse<LedgerEntry>> {
  return await api.get(ApiRoute.FINANCE_LEDGER);
}

export async function getIncomeEntriesApi(): Promise<FinanceListResponse<IncomeEntry>> {
  return await api.get(ApiRoute.FINANCE_INCOME);
}

export async function createIncomeEntryApi(
  payload: CreateIncomeEntryPayload,
): Promise<FinanceItemResponse<IncomeEntry>> {
  return await api.post(ApiRoute.FINANCE_INCOME, payload);
}

export async function getExpenseEntriesApi(): Promise<FinanceListResponse<ExpenseEntry>> {
  return await api.get(ApiRoute.FINANCE_EXPENSES);
}

export async function createExpenseEntryApi(
  payload: CreateExpenseEntryPayload,
): Promise<FinanceItemResponse<ExpenseEntry>> {
  return await api.post(ApiRoute.FINANCE_EXPENSES, payload);
}

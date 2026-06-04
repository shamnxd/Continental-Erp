import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getClientsApi } from "../../api/client.api";
import {
  getClientInvoicesApi,
  getExpenseEntriesApi,
  getIncomeEntriesApi,
  getLedgerEntriesApi,
  getVendorBillsApi,
} from "../../api/finance.api";
import type {
  ClientInvoice,
  ExpenseEntry,
  IncomeEntry,
  LedgerEntry,
  VendorBill,
} from "../../interfaces/finance.interface";
import type { Client } from "../../interfaces/client.interface";
import { computeFinanceMetrics, type FinanceMetrics } from "./financeMetrics";

interface FinanceContextValue {
  isLoading: boolean;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
  invoices: ClientInvoice[];
  payables: VendorBill[];
  ledger: LedgerEntry[];
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  clients: Client[];
  metrics: FinanceMetrics;
  refresh: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [payables, setPayables] = useState<VendorBill[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [invRes, billRes, ledgerRes, incomeRes, expenseRes, clientsRes] = await Promise.all([
        getClientInvoicesApi(),
        getVendorBillsApi(),
        getLedgerEntriesApi(),
        getIncomeEntriesApi(),
        getExpenseEntriesApi(),
        getClientsApi({ page: 1, limit: 200 }),
      ]);
      if (invRes.success) setInvoices(invRes.data);
      if (billRes.success) setPayables(billRes.data);
      if (ledgerRes.success) setLedger(ledgerRes.data);
      if (incomeRes.success) setIncome(incomeRes.data);
      if (expenseRes.success) setExpenses(expenseRes.data);
      if (clientsRes.success) setClients(clientsRes.data);
    } catch {
      toast.error("Failed to load finance data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const metrics = useMemo(
    () => computeFinanceMetrics(invoices, payables, ledger, income, expenses),
    [invoices, payables, ledger, income, expenses],
  );

  const value = useMemo(
    () => ({
      isLoading,
      isSaving,
      setIsSaving,
      invoices,
      payables,
      ledger,
      income,
      expenses,
      clients,
      metrics,
      refresh,
    }),
    [isLoading, isSaving, invoices, payables, ledger, income, expenses, clients, metrics, refresh],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}

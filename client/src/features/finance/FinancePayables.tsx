import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import { AppRoute } from "../../constants/routes.enum";
import { recordVendorBillPaymentApi } from "../../api/finance.api";
import type { ExpenseEntry, VendorBill } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { billStatusBadge, formatInr } from "./financeUtils";
import {
  RecordPaymentDialog,
  formatOutstandingLine,
  paymentDialogDefaults,
} from "./RecordPaymentDialog";
import { ExpenseEntryFormDialog } from "./ExpenseEntryFormDialog";

export function FinancePayables() {
  const { payables, expenses, refresh, isSaving, setIsSaving } = useFinance();
  const [search, setSearch] = useState("");
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [paymentBill, setPaymentBill] = useState<VendorBill | null>(null);
  const [paymentForm, setPaymentForm] = useState(paymentDialogDefaults(0));

  const filteredBills = useMemo(
    () =>
      payables.filter(
        (x) =>
          x.billNo.toLowerCase().includes(search.toLowerCase()) ||
          x.vendor.toLowerCase().includes(search.toLowerCase()) ||
          (x.vendorInvoiceNo ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [search, payables],
  );

  const billColumns = [
    { header: "Bill", accessor: (row: VendorBill) => <span className="font-semibold">{row.billNo}</span> },
    { header: "Vendor", accessor: (row: VendorBill) => row.vendor },
    { header: "Vendor inv.", accessor: (row: VendorBill) => row.vendorInvoiceNo ?? "—" },
    { header: "Category", accessor: (row: VendorBill) => row.category },
    { header: "Bill / Due", accessor: (row: VendorBill) => `${row.billDate} / ${row.dueDate}` },
    { header: "Total", accessor: (row: VendorBill) => <span className="font-semibold">{formatInr(row.total)}</span> },
    { header: "Outstanding", accessor: (row: VendorBill) => <span className="font-semibold text-red-600">{formatInr(row.outstanding)}</span> },
    { header: "Status", accessor: (row: VendorBill) => billStatusBadge(row.status) },
    {
      header: "Actions",
      accessor: (row: VendorBill) =>
        row.outstanding > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPaymentForm(paymentDialogDefaults(row.outstanding));
              setPaymentBill(row);
            }}
          >
            Pay bill
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  const expenseColumns = [
    { header: "Date", accessor: (row: ExpenseEntry) => row.expenseDate },
    { header: "Period", accessor: (row: ExpenseEntry) => row.periodMonth },
    { header: "Title", accessor: (row: ExpenseEntry) => <span className="font-semibold">{row.name}</span> },
    { header: "Category", accessor: (row: ExpenseEntry) => row.category },
    { header: "Payee", accessor: (row: ExpenseEntry) => row.payee ?? "—" },
    { header: "Status", accessor: (row: ExpenseEntry) => <span className="text-xs font-semibold">{row.status}</span> },
    { header: "Budget", accessor: (row: ExpenseEntry) => formatInr(row.budget) },
    { header: "Actual", accessor: (row: ExpenseEntry) => <span className="font-semibold text-red-700">{formatInr(row.actual)}</span> },
  ];

  const submitPayment = async () => {
    if (!paymentBill || paymentForm.amount <= 0) return;
    setIsSaving(true);
    try {
      const res = await recordVendorBillPaymentApi(paymentBill.id, {
        amount: paymentForm.amount,
        paymentDate: paymentForm.paymentDate,
        note: paymentForm.note.trim() || undefined,
      });
      if (res.success) {
        toast.success("Vendor payment recorded");
        setPaymentBill(null);
        await refresh();
      }
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-start">
        <div>
          <h2 className="text-lg font-bold text-foreground">Payables</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Vendor bills and operating expenses.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setAddExpenseOpen(true)}>
            <Plus className="h-4 w-4" /> Record expense
          </Button>
          <Button asChild className="gap-1.5 bg-pink-700 hover:bg-pink-800">
            <Link to={AppRoute.FINANCE_VENDOR_BILL_CREATE}>
              <Plus className="h-4 w-4" /> New vendor bill
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search bills, vendors…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-background/50 shadow-sm">
        <div className="px-4 py-3 border-b border-border bg-muted/30 text-sm text-muted-foreground">
          Vendor bills (supplier invoices)
        </div>
        <ReusableTable data={filteredBills} columns={billColumns} emptyMessage="No vendor bills yet" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-background/50 shadow-sm">
        <div className="px-4 py-3 border-b border-border bg-muted/30 text-sm text-muted-foreground">
          Expense register (budget vs actual by period)
        </div>
        <ReusableTable data={expenses} columns={expenseColumns} emptyMessage="No expenses recorded yet" />
      </div>

      <ExpenseEntryFormDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        onSuccess={refresh}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
      />

      <RecordPaymentDialog
        open={!!paymentBill}
        onOpenChange={(open) => !open && setPaymentBill(null)}
        title={`Pay vendor bill — ${paymentBill?.billNo ?? ""}`}
        subtitle={formatOutstandingLine(paymentBill?.outstanding ?? 0, paymentBill?.vendor ?? "")}
        amount={paymentForm.amount}
        paymentDate={paymentForm.paymentDate}
        note={paymentForm.note}
        onAmountChange={(amount) => setPaymentForm((p) => ({ ...p, amount }))}
        onDateChange={(paymentDate) => setPaymentForm((p) => ({ ...p, paymentDate }))}
        onNoteChange={(note) => setPaymentForm((p) => ({ ...p, note }))}
        onSubmit={submitPayment}
        isSaving={isSaving}
        submitLabel="Pay bill"
      />
    </div>
  );
}

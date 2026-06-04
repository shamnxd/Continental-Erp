import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import { AppRoute } from "../../constants/routes.enum";
import { recordInvoicePaymentApi } from "../../api/finance.api";
import type { ClientInvoice, IncomeEntry } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { formatInr, stateBadge } from "./financeUtils";
import {
  RecordPaymentDialog,
  formatOutstandingLine,
  paymentDialogDefaults,
} from "./RecordPaymentDialog";
import { IncomeEntryFormDialog } from "./IncomeEntryFormDialog";
import { toast } from "sonner";

export function FinanceReceivables() {
  const { invoices, income, clients, refresh, isSaving, setIsSaving } = useFinance();
  const [search, setSearch] = useState("");
  const [addIncomeOpen, setAddIncomeOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<ClientInvoice | null>(null);
  const [paymentForm, setPaymentForm] = useState(paymentDialogDefaults(0));

  const filteredInvoices = useMemo(
    () =>
      invoices.filter(
        (x) =>
          x.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
          x.clientName.toLowerCase().includes(search.toLowerCase()) ||
          x.paymentState.toLowerCase().includes(search.toLowerCase()) ||
          (x.referenceNo ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [search, invoices],
  );

  const invoiceColumns = [
    { header: "Invoice", accessor: (row: ClientInvoice) => <span className="font-semibold">{row.invoiceNo}</span> },
    { header: "Client", accessor: (row: ClientInvoice) => row.clientName },
    { header: "Type", accessor: (row: ClientInvoice) => <span className="text-xs font-semibold">{row.invoiceType}</span> },
    {
      header: "Refs",
      accessor: (row: ClientInvoice) => (
        <span className="text-[10px] text-muted-foreground">
          {[
            row.quotationNo && `QT ${row.quotationNo}`,
            row.complaintNo && `CMP ${row.complaintNo}`,
            row.jobCardNo && `JC ${row.jobCardNo}`,
            row.amcNo && `AMC ${row.amcNo}`,
            row.smrNo && `SMR ${row.smrNo}`,
          ]
            .filter(Boolean)
            .join(" · ") || "—"}
        </span>
      ),
    },
    {
      header: "Doc status",
      accessor: (row: ClientInvoice) => (
        <span className="text-xs font-semibold">{row.documentStatus ?? "Draft"}</span>
      ),
    },
    { header: "Issue / Due", accessor: (row: ClientInvoice) => `${row.issueDate} / ${row.dueDate}` },
    {
      header: "Taxable / GST",
      accessor: (row: ClientInvoice) => (
        <span className="text-xs">
          {formatInr(row.subtotal ?? row.grandTotal)} + {formatInr(row.gstAmount ?? 0)}
        </span>
      ),
    },
    { header: "Total", accessor: (row: ClientInvoice) => <span className="font-semibold">{formatInr(row.grandTotal)}</span> },
    { header: "Outstanding", accessor: (row: ClientInvoice) => <span className="font-semibold text-red-600">{formatInr(row.outstanding)}</span> },
    { header: "Status", accessor: (row: ClientInvoice) => stateBadge(row.paymentState) },
    {
      header: "Actions",
      accessor: (row: ClientInvoice) =>
        row.outstanding > 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setPaymentForm(paymentDialogDefaults(row.outstanding));
              setPaymentInvoice(row);
            }}
          >
            Record payment
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  const incomeColumns = [
    { header: "Source", accessor: (row: IncomeEntry) => <span className="font-semibold">{row.source}</span> },
    { header: "Type", accessor: (row: IncomeEntry) => <span className="text-xs">{row.sourceType}</span> },
    { header: "Client", accessor: (row: IncomeEntry) => row.clientName ?? "—" },
    { header: "Date", accessor: (row: IncomeEntry) => row.incomeDate },
    { header: "Expected", accessor: (row: IncomeEntry) => formatInr(row.expectedAmount) },
    { header: "Received", accessor: (row: IncomeEntry) => <span className="font-semibold text-green-700">{formatInr(row.actualReceived)}</span> },
    {
      header: "Balance",
      accessor: (row: IncomeEntry) => (
        <span className="font-semibold text-amber-700">{formatInr(Math.max(0, row.expectedAmount - row.actualReceived))}</span>
      ),
    },
  ];

  const submitPayment = async () => {
    if (!paymentInvoice || paymentForm.amount <= 0) return;
    setIsSaving(true);
    try {
      const res = await recordInvoicePaymentApi(paymentInvoice.id, {
        amount: paymentForm.amount,
        paymentDate: paymentForm.paymentDate,
        note: paymentForm.note.trim() || undefined,
      });
      if (res.success) {
        toast.success("Payment recorded");
        setPaymentInvoice(null);
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
          <h2 className="text-lg font-bold text-foreground">Receivables</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Tax invoices, collections, and income pipeline.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setAddIncomeOpen(true)}>
            <Plus className="h-4 w-4" /> Add income
          </Button>
          <Button asChild className="gap-1.5 bg-pink-700 hover:bg-pink-800">
            <Link to={AppRoute.FINANCE_INVOICE_CREATE}>
              <Plus className="h-4 w-4" /> Create invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search invoices, clients, reference…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-background/50 shadow-sm">
        <div className="px-4 py-3 border-b border-border bg-muted/30 text-sm text-muted-foreground">
          Client invoices (line items + GST)
        </div>
        <ReusableTable data={filteredInvoices} columns={invoiceColumns} emptyMessage="No invoices — create your first tax invoice" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-background/50 shadow-sm">
        <div className="px-4 py-3 border-b border-border bg-muted/30 text-sm text-muted-foreground">
          Income forecast & collections
        </div>
        <ReusableTable data={income} columns={incomeColumns} emptyMessage="No income entries yet" />
      </div>

      <IncomeEntryFormDialog
        open={addIncomeOpen}
        onOpenChange={setAddIncomeOpen}
        onSuccess={refresh}
        clients={clients}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
      />

      <RecordPaymentDialog
        open={!!paymentInvoice}
        onOpenChange={(open) => !open && setPaymentInvoice(null)}
        title={`Record payment — ${paymentInvoice?.invoiceNo ?? ""}`}
        subtitle={formatOutstandingLine(paymentInvoice?.outstanding ?? 0, paymentInvoice?.clientName ?? "")}
        amount={paymentForm.amount}
        paymentDate={paymentForm.paymentDate}
        note={paymentForm.note}
        onAmountChange={(amount) => setPaymentForm((p) => ({ ...p, amount }))}
        onDateChange={(paymentDate) => setPaymentForm((p) => ({ ...p, paymentDate }))}
        onNoteChange={(note) => setPaymentForm((p) => ({ ...p, note }))}
        onSubmit={submitPayment}
        isSaving={isSaving}
      />
    </div>
  );
}

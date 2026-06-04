import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Search, Eye } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import { AppRoute } from "../../constants/routes.enum";
import { recordInvoicePaymentApi } from "../../api/finance.api";
import type { ClientInvoice } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { formatInr, stateBadge } from "./financeUtils";
import { RecordPaymentDialog, formatOutstandingLine, paymentDialogDefaults } from "./RecordPaymentDialog";
import { toast } from "sonner";

export function FinanceCustomerInvoices() {
  const { invoices, refresh, isSaving, setIsSaving } = useFinance();
  const [search, setSearch] = useState("");
  const [paymentInvoice, setPaymentInvoice] = useState<ClientInvoice | null>(null);
  const [paymentForm, setPaymentForm] = useState(paymentDialogDefaults(0));

  const filtered = useMemo(
    () =>
      invoices.filter(
        (x) =>
          x.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
          x.clientName.toLowerCase().includes(search.toLowerCase()) ||
          x.paymentState.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, invoices],
  );

  const columns = [
    { header: "Invoice", accessor: (row: ClientInvoice) => <span className="font-semibold">{row.invoiceNo}</span> },
    { header: "Client", accessor: (row: ClientInvoice) => row.clientName },
    { header: "Type", accessor: (row: ClientInvoice) => <span className="text-xs">{row.invoiceType}</span> },
    {
      header: "Doc",
      accessor: (row: ClientInvoice) => <span className="text-xs font-semibold">{row.documentStatus ?? "Draft"}</span>,
    },
    { header: "Issue / Due", accessor: (row: ClientInvoice) => `${row.issueDate} / ${row.dueDate}` },
    { header: "Total", accessor: (row: ClientInvoice) => <span className="font-semibold">{formatInr(row.grandTotal)}</span> },
    { header: "Outstanding", accessor: (row: ClientInvoice) => <span className="font-semibold text-red-600">{formatInr(row.outstanding)}</span> },
    { header: "Status", accessor: (row: ClientInvoice) => stateBadge(row.paymentState) },
    {
      header: "Actions",
      accessor: (row: ClientInvoice) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            asChild
            title="View invoice details"
          >
            <Link to={`/finance/receivables/invoices/${row.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          {row.outstanding > 0 && (
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
          )}
        </div>
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
          <h2 className="text-lg font-bold">Customer invoices</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Tax invoices raised to clients.</p>
        </div>
        <Button asChild className="gap-1.5 bg-pink-700 hover:bg-pink-800">
          <Link to={AppRoute.FINANCE_INVOICE_CREATE}>
            <Plus className="h-4 w-4" /> Create invoice
          </Link>
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search invoices…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border overflow-hidden bg-background/50 shadow-sm">
        <ReusableTable data={filtered} columns={columns} emptyMessage="No invoices yet" />
      </div>
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

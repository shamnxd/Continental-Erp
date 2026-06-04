import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import { recordVendorBillPaymentApi } from "../../api/finance.api";
import type { VendorBill } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { billStatusBadge, formatInr } from "./financeUtils";
import { RecordPaymentDialog, formatOutstandingLine, paymentDialogDefaults } from "./RecordPaymentDialog";

export function FinanceVendorPayments() {
  const { payables, refresh, isSaving, setIsSaving } = useFinance();
  const [search, setSearch] = useState("");
  const [paymentBill, setPaymentBill] = useState<VendorBill | null>(null);
  const [paymentForm, setPaymentForm] = useState(paymentDialogDefaults(0));

  const openBills = useMemo(
    () =>
      payables
        .filter((x) => x.outstanding > 0)
        .filter(
          (x) =>
            x.billNo.toLowerCase().includes(search.toLowerCase()) ||
            x.vendor.toLowerCase().includes(search.toLowerCase()),
        ),
    [payables, search],
  );

  const columns = [
    { header: "Bill", accessor: (row: VendorBill) => <span className="font-semibold">{row.billNo}</span> },
    { header: "Vendor", accessor: (row: VendorBill) => row.vendor },
    { header: "Paid", accessor: (row: VendorBill) => formatInr(row.amountPaid) },
    { header: "Outstanding", accessor: (row: VendorBill) => <span className="font-semibold text-red-600">{formatInr(row.outstanding)}</span> },
    { header: "Status", accessor: (row: VendorBill) => billStatusBadge(row.status) },
    {
      header: "Actions",
      accessor: (row: VendorBill) => (
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
      ),
    },
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
      <div>
        <h2 className="text-lg font-bold">Vendor payments</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Pay open vendor bills and track settlements.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search bills to pay…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border overflow-hidden bg-background/50 shadow-sm">
        <ReusableTable data={openBills} columns={columns} emptyMessage="No bills awaiting payment" />
      </div>
      <RecordPaymentDialog
        open={!!paymentBill}
        onOpenChange={(open) => !open && setPaymentBill(null)}
        title={`Pay vendor — ${paymentBill?.billNo ?? ""}`}
        subtitle={formatOutstandingLine(paymentBill?.outstanding ?? 0, paymentBill?.vendor ?? "")}
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

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import type { IncomeEntry } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { formatInr } from "./financeUtils";
import { CustomerPaymentFormDialog } from "./CustomerPaymentFormDialog";

export function FinanceCustomerPayments() {
  const { income, clients, refresh, isSaving, setIsSaving } = useFinance();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(
    () =>
      income.filter(
        (x) =>
          x.source.toLowerCase().includes(search.toLowerCase()) ||
          (x.clientName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (x.quotationNo ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (x.amcNo ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [income, search],
  );

  const columns = [
    { header: "Date", accessor: (row: IncomeEntry) => row.incomeDate },
    { header: "Type", accessor: (row: IncomeEntry) => <span className="text-xs font-semibold">{row.sourceType}</span> },
    { header: "Client", accessor: (row: IncomeEntry) => row.clientName ?? "—" },
    {
      header: "Linked to",
      accessor: (row: IncomeEntry) => (
        <span className="text-[10px] text-muted-foreground">
          {[row.quotationNo && `QT ${row.quotationNo}`, row.amcNo && `AMC ${row.amcNo}`, row.complaintNo && `CMP ${row.complaintNo}`]
            .filter(Boolean)
            .join(" · ") || "—"}
        </span>
      ),
    },
    { header: "Received", accessor: (row: IncomeEntry) => <span className="font-semibold text-green-700">{formatInr(row.actualReceived)}</span> },
    {
      header: "Applied",
      accessor: (row: IncomeEntry) =>
        row.appliedToInvoiceId ? (
          <span className="text-xs text-muted-foreground">On invoice</span>
        ) : (
          <span className="text-xs font-semibold text-amber-700">Unapplied</span>
        ),
    },
    { header: "UTR / ref", accessor: (row: IncomeEntry) => row.referenceNo ?? "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-start">
        <div>
          <h2 className="text-lg font-bold">Customer payments</h2>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
            Record advances and collections linked to a quotation, AMC, or complaint. When you create an invoice for that source, unapplied advances auto-fill as amount received.
          </p>
        </div>
        <Button className="gap-1.5 bg-pink-700 hover:bg-pink-800" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Record payment / advance
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search payments…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border overflow-hidden bg-background/50 shadow-sm">
        <ReusableTable data={filtered} columns={columns} emptyMessage="No customer payments recorded" />
      </div>
      <CustomerPaymentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        clients={clients}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
      />
    </div>
  );
}

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import type { ClientInvoice } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { formatInr, stateBadge, isInvoiceOverdue } from "./financeUtils";

export function FinanceOutstandingReceivables() {
  const { invoices, metrics } = useFinance();
  const [search, setSearch] = useState("");

  const outstanding = useMemo(
    () =>
      invoices
        .filter((x) => x.outstanding > 0)
        .filter(
          (x) =>
            x.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
            x.clientName.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [invoices, search],
  );

  const columns = [
    { header: "Invoice", accessor: (row: ClientInvoice) => <span className="font-semibold">{row.invoiceNo}</span> },
    { header: "Client", accessor: (row: ClientInvoice) => row.clientName },
    { header: "Due", accessor: (row: ClientInvoice) => row.dueDate },
    {
      header: "Overdue",
      accessor: (row: ClientInvoice) =>
        isInvoiceOverdue(row) ? (
          <span className="text-xs font-bold text-red-600">Yes</span>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        ),
    },
    { header: "Outstanding", accessor: (row: ClientInvoice) => <span className="font-semibold text-red-600">{formatInr(row.outstanding)}</span> },
    { header: "Status", accessor: (row: ClientInvoice) => stateBadge(row.paymentState) },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Outstanding receivables</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Total outstanding: <span className="font-bold text-red-700">{formatInr(metrics.receivableOutstanding)}</span>
          {metrics.overdueInvoiceCount > 0 && (
            <span className="ml-2 text-amber-700">({metrics.overdueInvoiceCount} overdue)</span>
          )}
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border overflow-hidden bg-background/50 shadow-sm">
        <ReusableTable data={outstanding} columns={columns} emptyMessage="No outstanding invoices" />
      </div>
    </div>
  );
}

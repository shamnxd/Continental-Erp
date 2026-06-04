import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import type { VendorBill } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { billStatusBadge, formatInr, isBillOverdue } from "./financeUtils";

export function FinanceOutstandingPayables() {
  const { payables, metrics } = useFinance();
  const [search, setSearch] = useState("");

  const outstanding = useMemo(
    () =>
      payables
        .filter((x) => x.outstanding > 0)
        .filter(
          (x) =>
            x.billNo.toLowerCase().includes(search.toLowerCase()) ||
            x.vendor.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [payables, search],
  );

  const columns = [
    { header: "Bill", accessor: (row: VendorBill) => <span className="font-semibold">{row.billNo}</span> },
    { header: "Vendor", accessor: (row: VendorBill) => row.vendor },
    { header: "Due", accessor: (row: VendorBill) => row.dueDate },
    {
      header: "Overdue",
      accessor: (row: VendorBill) =>
        isBillOverdue(row) ? (
          <span className="text-xs font-bold text-red-600">Yes</span>
        ) : (
          <span className="text-xs text-muted-foreground">No</span>
        ),
    },
    { header: "Outstanding", accessor: (row: VendorBill) => <span className="font-semibold text-red-600">{formatInr(row.outstanding)}</span> },
    { header: "Status", accessor: (row: VendorBill) => billStatusBadge(row.status) },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Outstanding payables</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Total outstanding: <span className="font-bold text-red-700">{formatInr(metrics.payableOutstanding)}</span>
        </p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border overflow-hidden bg-background/50 shadow-sm">
        <ReusableTable data={outstanding} columns={columns} emptyMessage="No outstanding bills" />
      </div>
    </div>
  );
}

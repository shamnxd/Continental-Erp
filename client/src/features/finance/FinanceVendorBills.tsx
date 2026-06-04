import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import { AppRoute } from "../../constants/routes.enum";
import type { VendorBill } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { billStatusBadge, formatInr } from "./financeUtils";

export function FinanceVendorBills() {
  const { payables } = useFinance();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      payables.filter(
        (x) =>
          x.billNo.toLowerCase().includes(search.toLowerCase()) ||
          x.vendor.toLowerCase().includes(search.toLowerCase()),
      ),
    [payables, search],
  );

  const columns = [
    { header: "Bill", accessor: (row: VendorBill) => <span className="font-semibold">{row.billNo}</span> },
    { header: "Vendor", accessor: (row: VendorBill) => row.vendor },
    { header: "Category", accessor: (row: VendorBill) => row.category },
    { header: "Bill / Due", accessor: (row: VendorBill) => `${row.billDate} / ${row.dueDate}` },
    { header: "Total", accessor: (row: VendorBill) => <span className="font-semibold">{formatInr(row.total)}</span> },
    { header: "Outstanding", accessor: (row: VendorBill) => <span className="font-semibold text-red-600">{formatInr(row.outstanding)}</span> },
    { header: "Status", accessor: (row: VendorBill) => billStatusBadge(row.status) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-start">
        <div>
          <h2 className="text-lg font-bold">Vendor bills</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Supplier invoices and payables.</p>
        </div>
        <Button asChild className="gap-1.5 bg-pink-700 hover:bg-pink-800">
          <Link to={AppRoute.FINANCE_VENDOR_BILL_CREATE}>
            <Plus className="h-4 w-4" /> New vendor bill
          </Link>
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search bills…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border overflow-hidden bg-background/50 shadow-sm">
        <ReusableTable data={filtered} columns={columns} emptyMessage="No vendor bills" />
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import type { LedgerEntry } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { formatInr, ledgerMoneyIn, ledgerMoneyOut } from "./financeUtils";

export function FinanceLedger() {
  const { ledger } = useFinance();
  const [search, setSearch] = useState("");

  const filteredLedger = useMemo(
    () =>
      ledger.filter(
        (x) =>
          x.refNo.toLowerCase().includes(search.toLowerCase()) ||
          x.refType.toLowerCase().includes(search.toLowerCase()) ||
          x.narration.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, ledger],
  );

  const ledgerColumns = [
    { header: "Date", accessor: (row: LedgerEntry) => row.date },
    { header: "Type", accessor: (row: LedgerEntry) => <span className="font-semibold text-xs">{row.refType}</span> },
    { header: "Reference", accessor: (row: LedgerEntry) => row.refNo },
    { header: "Narration", accessor: (row: LedgerEntry) => <span className="line-clamp-2 text-sm">{row.narration}</span> },
    {
      header: "Money In",
      accessor: (row: LedgerEntry) => {
        const v = ledgerMoneyIn(row);
        return v > 0 ? <span className="text-green-700 font-semibold">{formatInr(v)}</span> : "—";
      },
    },
    {
      header: "Money Out",
      accessor: (row: LedgerEntry) => {
        const v = ledgerMoneyOut(row);
        return v > 0 ? <span className="text-red-700 font-semibold">{formatInr(v)}</span> : "—";
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Cash & Ledger</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Full cashbook: receivables/payables on billing; cash movement on payments.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search reference, type, narration…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-background/50 shadow-sm">
        <ReusableTable data={filteredLedger} columns={ledgerColumns} emptyMessage="No ledger entries yet" />
      </div>
    </div>
  );
}

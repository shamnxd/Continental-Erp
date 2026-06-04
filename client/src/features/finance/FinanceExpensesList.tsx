import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ReusableTable } from "../../components/ReusableTable";
import type { ExpenseEntry } from "../../interfaces/finance.interface";
import { useFinance } from "./FinanceContext";
import { formatInr } from "./financeUtils";
import { ExpenseEntryFormDialog } from "./ExpenseEntryFormDialog";

type ExpenseFilter = "direct" | "travel" | "fuel" | "misc" | "all";

const FILTER_CATEGORIES: Record<ExpenseFilter, ExpenseEntry["category"][] | null> = {
  all: null,
  direct: ["Materials", "Salary", "Utilities"],
  travel: ["Travel"],
  fuel: ["Fuel"],
  misc: ["Other", "Rent", "GST"],
};

const FILTER_TITLES: Record<ExpenseFilter, string> = {
  all: "All expenses",
  direct: "Direct expenses",
  travel: "Travel",
  fuel: "Fuel",
  misc: "Misc expenses",
};

export function FinanceExpensesList({ filter }: { filter: ExpenseFilter }) {
  const { expenses, refresh, isSaving, setIsSaving } = useFinance();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<ExpenseEntry["category"]>("Other");

  const categories = FILTER_CATEGORIES[filter];

  const filtered = useMemo(() => {
    let list = expenses;
    if (categories) list = list.filter((x) => categories.includes(x.category));
    return list.filter(
      (x) =>
        x.name.toLowerCase().includes(search.toLowerCase()) ||
        (x.payee ?? "").toLowerCase().includes(search.toLowerCase()),
    );
  }, [expenses, categories, search]);

  const columns = [
    { header: "Date", accessor: (row: ExpenseEntry) => row.expenseDate },
    { header: "Title", accessor: (row: ExpenseEntry) => <span className="font-semibold">{row.name}</span> },
    { header: "Category", accessor: (row: ExpenseEntry) => row.category },
    { header: "Payee", accessor: (row: ExpenseEntry) => row.payee ?? "—" },
    { header: "Actual", accessor: (row: ExpenseEntry) => <span className="font-semibold text-red-700">{formatInr(row.actual)}</span> },
    { header: "Status", accessor: (row: ExpenseEntry) => <span className="text-xs">{row.status}</span> },
  ];

  const openAdd = () => {
    if (filter === "travel") setDefaultCategory("Travel");
    else if (filter === "fuel") setDefaultCategory("Fuel");
    else if (filter === "direct") setDefaultCategory("Materials");
    else setDefaultCategory("Other");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-start">
        <div>
          <h2 className="text-lg font-bold">{FILTER_TITLES[filter]}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Operating costs and reimbursements.</p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Record expense
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search expenses…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="rounded-xl border overflow-hidden bg-background/50 shadow-sm">
        <ReusableTable data={filtered} columns={columns} emptyMessage="No expenses in this category" />
      </div>
      <ExpenseEntryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        defaultCategory={defaultCategory}
      />
    </div>
  );
}

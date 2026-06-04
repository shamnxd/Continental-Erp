import { PieChart } from "lucide-react";
import { useFinance } from "./FinanceContext";
import { formatInr } from "./financeUtils";

export function FinanceReports() {
  const { metrics } = useFinance();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Finance reports</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Aging, P&amp;L-style summary, and GST reports — coming in a later phase.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
          <PieChart className="h-7 w-7 text-pink-700" />
        </div>
        <h3 className="font-semibold text-foreground">Reports module (planned)</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Receivable aging buckets, expense vs income summary, and GST filing views will be added here.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <PreviewCard title="Quick P&amp;L snapshot" rows={[
          ["Income (actual)", formatInr(metrics.incomeActual)],
          ["Expenses (actual)", formatInr(metrics.expenseActual)],
          ["Surplus / deficit", formatInr(metrics.incomeActual - metrics.expenseActual)],
        ]} />
        <PreviewCard title="Aging preview" rows={[
          ["Overdue receivables", formatInr(metrics.overdueReceivableAmount)],
          ["Overdue payables", formatInr(metrics.overduePayableAmount)],
          ["Net cash position", formatInr(metrics.netCashPosition)],
        ]} />
      </div>
    </div>
  );
}

function PreviewCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 opacity-80">
      <p className="text-xs font-bold uppercase text-muted-foreground tracking-wide">{title}</p>
      <ul className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <li key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold">{value}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground mt-3">Preview only — full reports not yet implemented</p>
    </div>
  );
}

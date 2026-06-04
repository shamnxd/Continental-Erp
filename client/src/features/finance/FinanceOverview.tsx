import type { ComponentType } from "react";
import { Link } from "react-router";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Banknote, TrendingDown, TrendingUp } from "lucide-react";
import { AppRoute } from "../../constants/routes.enum";
import { useFinance } from "./FinanceContext";
import { formatInr, stateBadge, billStatusBadge, isInvoiceOverdue, isBillOverdue } from "./financeUtils";
import { ReusableTable } from "../../components/ReusableTable";
import type { ClientInvoice, VendorBill } from "../../interfaces/finance.interface";

export function FinanceOverview() {
  const { metrics, invoices, payables } = useFinance();

  const overdueInvoices = invoices.filter(isInvoiceOverdue).slice(0, 5);
  const overdueBills = payables.filter(isBillOverdue).slice(0, 5);

  const overdueInvoiceColumns = [
    { header: "Invoice", accessor: (r: ClientInvoice) => <span className="font-semibold">{r.invoiceNo}</span> },
    { header: "Client", accessor: (r: ClientInvoice) => r.clientName },
    { header: "Due", accessor: (r: ClientInvoice) => r.dueDate },
    { header: "Outstanding", accessor: (r: ClientInvoice) => <span className="font-semibold text-red-600">{formatInr(r.outstanding)}</span> },
    { header: "Status", accessor: (r: ClientInvoice) => stateBadge(r.paymentState) },
  ];

  const overdueBillColumns = [
    { header: "Bill", accessor: (r: VendorBill) => <span className="font-semibold">{r.billNo}</span> },
    { header: "Vendor", accessor: (r: VendorBill) => r.vendor },
    { header: "Due", accessor: (r: VendorBill) => r.dueDate },
    { header: "Outstanding", accessor: (r: VendorBill) => <span className="font-semibold text-red-600">{formatInr(r.outstanding)}</span> },
    { header: "Status", accessor: (r: VendorBill) => billStatusBadge(r.status) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Finance overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Receivables, payables, cash movement, and overdue items at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Receivable outstanding"
          value={formatInr(metrics.receivableOutstanding)}
          valueClass="text-red-700"
          icon={ArrowDownCircle}
          link={AppRoute.FINANCE_RECEIVABLES_INVOICES}
          linkLabel="View invoices"
        />
        <KpiCard
          label="Payable outstanding"
          value={formatInr(metrics.payableOutstanding)}
          valueClass="text-red-700"
          icon={ArrowUpCircle}
          link={AppRoute.FINANCE_PAYABLES_BILLS}
          linkLabel="View bills"
        />
        <KpiCard
          label="Cash received"
          value={formatInr(metrics.cashReceived)}
          valueClass="text-green-700"
          icon={TrendingUp}
          link={AppRoute.FINANCE_LEDGER}
          linkLabel="View cashbook"
        />
        <KpiCard
          label="Cash paid out"
          value={formatInr(metrics.cashPaidOut)}
          valueClass="text-red-700"
          icon={TrendingDown}
          link={AppRoute.FINANCE_LEDGER}
          linkLabel="View cashbook"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card rounded-lg border border-border p-4 flex gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Overdue receivables</p>
            <p className="text-xl font-bold text-amber-800 mt-0.5">{formatInr(metrics.overdueReceivableAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.overdueInvoiceCount} invoice(s)</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 flex gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Overdue payables</p>
            <p className="text-xl font-bold text-amber-800 mt-0.5">{formatInr(metrics.overduePayableAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.overdueBillCount} bill(s)</p>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 flex gap-3">
          <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
            <Banknote className="h-5 w-5 text-pink-700" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">Net cash (in − out)</p>
            <p className={`text-xl font-bold mt-0.5 ${metrics.netCashPosition >= 0 ? "text-green-700" : "text-red-700"}`}>
              {formatInr(metrics.netCashPosition)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase">Income forecast</p>
          <p className="text-lg font-bold mt-1">
            {formatInr(metrics.incomeExpected)} / <span className="text-green-700">{formatInr(metrics.incomeActual)}</span>
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase">Expense budget</p>
          <p className="text-lg font-bold mt-1">
            {formatInr(metrics.expenseBudget)} / <span className="text-red-700">{formatInr(metrics.expenseActual)}</span>
          </p>
        </div>
      </div>

      {overdueInvoices.length > 0 && (
        <section className="rounded-xl border border-border overflow-hidden bg-background/50 shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Overdue invoices</span>
            <Link to={AppRoute.FINANCE_RECEIVABLES_OUTSTANDING} className="text-xs font-semibold text-pink-700 hover:underline">
              View all
            </Link>
          </div>
          <ReusableTable data={overdueInvoices} columns={overdueInvoiceColumns} emptyMessage="None" />
        </section>
      )}

      {overdueBills.length > 0 && (
        <section className="rounded-xl border border-border overflow-hidden bg-background/50 shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Overdue vendor bills</span>
            <Link to={AppRoute.FINANCE_PAYABLES_OUTSTANDING} className="text-xs font-semibold text-pink-700 hover:underline">
              View all
            </Link>
          </div>
          <ReusableTable data={overdueBills} columns={overdueBillColumns} emptyMessage="None" />
        </section>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  valueClass,
  icon: Icon,
  link,
  linkLabel,
}: {
  label: string;
  value: string;
  valueClass: string;
  icon: ComponentType<{ className?: string }>;
  link: string;
  linkLabel: string;
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground uppercase">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      <p className={`text-xl font-bold mt-1 ${valueClass}`}>{value}</p>
      <Link to={link} className="text-xs font-semibold text-pink-700 hover:underline mt-2 inline-block">
        {linkLabel}
      </Link>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { ApiRoute } from "../../constants/routes.enum";
import { toast } from "sonner";
import {
  Plus,
  RotateCw,
  Tag,
  Building,
  User
} from "lucide-react";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import { TableStatusBadge, tableCellClass } from "../../components/tableCells";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

interface TallyExpense {
  voucherNo: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  payee: string;
  bankOrCashLedger: string;
}

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<TallyExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Date Filters
  const currentStart = new Date();
  currentStart.setDate(1);
  const defaultStartStr = `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultEndStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-30`;

  const [startDate, setStartDate] = useState<string>(defaultStartStr);
  const [endDate, setEndDate] = useState<string>(defaultEndStr);

  // Form State
  const [category, setCategory] = useState<string>("Office Overhead & Utilities");
  const [voucherNo, setVoucherNo] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [amount, setAmount] = useState<number>(0);
  const [payee, setPayee] = useState<string>("");
  const [bankOrCashLedger, setBankOrCashLedger] = useState<string>("HDFC Current Account");

  // Common expense categories in Tally
  const expenseCategories = [
    "Office Overhead & Utilities",
    "Travel & Fuel Reimbursement",
    "Direct Subcontract Work",
    "Technician Salaries",
    "Indirect Expenses",
    "Office Rent",
    "General Office Expenses"
  ];

  // Common bank/cash accounts
  const bankLedgers = [
    "HDFC Current Account",
    "SBI Current Account",
    "Cash Ledger",
    "Petty Cash Account"
  ];

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(ApiRoute.TALLY_EXPENSES, {
        params: { periodStart: startDate, periodEnd: endDate }
      });
      if (res.data) {
        setExpenses(res.data);
      }
      setIsCached(!!res.isCached);
      setLastSyncedAt(res.lastSyncedAt || null);
    } catch (error: any) {
      toast.error(error.message || "Failed to load expenses from Tally");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherNo || !payee || amount <= 0) {
      toast.warning("Please complete all fields with a valid amount.");
      return;
    }

    setSyncing(true);
    toast.info("Sending Payment Voucher to Tally...");

    try {
      const payload = {
        voucherNo,
        date: paymentDate,
        category,
        amount,
        payee,
        bankOrCashLedger
      };

      const res: any = await api.post(ApiRoute.TALLY_EXPENSES, payload);
      if (res.success) {
        toast.success(`Expense Voucher ${voucherNo} successfully generated and synced in Tally!`);
        setIsModalOpen(false);
        // Reset state
        setVoucherNo("");
        setPayee("");
        setAmount(0);
        // Refresh
        await fetchExpenses();
      } else {
        toast.error("Failed to sync expense. Verify Tally connection.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to log expense");
    } finally {
      setSyncing(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const filteredExpenses = expenses.filter(
    (exp) =>
      exp.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.payee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = filteredExpenses.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const columns: Column<TallyExpense>[] = [
    {
      header: "Voucher No",
      accessor: (row) => (
        <span className="font-mono font-bold text-foreground">{row.voucherNo}</span>
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Date",
      accessor: (row) => (
        <span className="text-muted-foreground font-semibold">{row.date}</span>
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Expense Category",
      accessor: (row) => (
        <span className="font-semibold text-foreground flex items-center gap-1.5 mt-1">
          <Tag className="h-3.5 w-3.5 text-pink-700" strokeWidth={2} />
          {row.category}
        </span>
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Payee Reference",
      accessor: (row) => (
        <span className="text-muted-foreground font-medium flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          {row.payee}
        </span>
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Paid From",
      accessor: (row) => (
        <span className="text-muted-foreground font-medium flex items-center gap-1">
          <Building className="h-3.5 w-3.5 text-muted-foreground" />
          {row.bankOrCashLedger}
        </span>
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Voucher Value",
      accessor: (row) => (
        <span className="font-bold text-rose-500">₹{row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
      ),
      className: "px-6 py-4 text-right w-[150px] font-bold text-rose-500",
    },
    {
      header: "Status",
      accessor: (row) => (
        <TableStatusBadge label="Tally Saved" tone="green" />
      ),
      className: tableCellClass.narrow + " text-center",
    }
  ];

  return (
    <div className="relative space-y-4">
      {isCached && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2 shadow-sm">
          <span className="font-semibold">⚠️ Tally Agent is Offline.</span>
          <span>Showing cached records from {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "N/A"}.</span>
        </div>
      )}
      <ManagementListPage
        title="Expense Log"
        subtitle="Track business operating expenses and directly post Payment Vouchers in Tally."
        searchPlaceholder="Search expenses by Voucher, Category, or Payee..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={loading}
        headerAction={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-pink-700 hover:bg-pink-800 text-white rounded-xl shadow-md px-4 py-2.5 h-11 transition-colors font-semibold"
          >
            <Plus className="h-4.5 w-4.5" />
            Log Expense Voucher
          </Button>
        }
        extraFilters={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchExpenses}
              disabled={loading}
              className="h-11 w-11 hover:bg-muted"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
        columns={columns}
        data={paginatedExpenses}
        emptyMessage="No operating expense records found in this period."
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="expenses"
      />

      {/* RECORD EXPENSE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-xl sm:rounded-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Record Operating Expense (Tally Payout)</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expense category (Tally Ledger)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Voucher Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXP-0542"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700 font-mono"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Date</label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payee Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vendor Name or Staff Employee"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700"
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount Paid</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="₹"
                  value={amount === 0 ? "" : amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700 text-right font-bold text-foreground"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Paid From (Tally Ledger)</label>
                <select
                  value={bankOrCashLedger}
                  onChange={(e) => setBankOrCashLedger(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700"
                >
                  {bankLedgers.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={syncing}
                className="flex items-center gap-2 bg-pink-700 hover:bg-pink-800 text-white font-semibold rounded-xl"
              >
                {syncing ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  "Save & Sync"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

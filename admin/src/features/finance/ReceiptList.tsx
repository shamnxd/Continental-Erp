import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { ApiRoute } from "../../constants/routes.enum";
import { toast } from "sonner";
import {
  Plus,
  RotateCw,
  CreditCard,
  Building
} from "lucide-react";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import { TableStatusBadge, tableCellClass } from "../../components/tableCells";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

interface TallyReceipt {
  receiptNo: string;
  date: string;
  clientName: string;
  amount: number;
  paymentMode: string;
  depositLedger: string;
}

export default function ReceiptList() {
  const [receipts, setReceipts] = useState<TallyReceipt[]>([]);
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
  const [clientName, setClientName] = useState<string>("");
  const [receiptNo, setReceiptNo] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [amount, setAmount] = useState<number>(0);
  const [depositLedger, setDepositLedger] = useState<string>("HDFC Current Account");

  // Common deposit bank/cash accounts in Tally
  const bankLedgers = [
    "HDFC Current Account",
    "SBI Current Account",
    "Cash Ledger",
    "Petty Cash Account"
  ];

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(ApiRoute.TALLY_RECEIPTS, {
        params: { periodStart: startDate, periodEnd: endDate }
      });
      if (res.data) {
        setReceipts(res.data);
      }
      setIsCached(!!res.isCached);
      setLastSyncedAt(res.lastSyncedAt || null);
    } catch (error: any) {
      toast.error(error.message || "Failed to load receipts from Tally");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !receiptNo || amount <= 0) {
      toast.warning("Please complete all fields with a valid amount.");
      return;
    }

    setSyncing(true);
    toast.info("Sending Receipt Voucher to Tally...");

    try {
      const payload = {
        receiptNo,
        clientName,
        paymentDate,
        amount,
        depositLedger
      };

      const res: any = await api.post(ApiRoute.TALLY_RECEIPTS, payload);
      if (res.success) {
        toast.success(`Receipt ${receiptNo} successfully recorded and synced in Tally!`);
        setIsModalOpen(false);
        // Reset state
        setClientName("");
        setReceiptNo("");
        setAmount(0);
        // Refresh
        await fetchReceipts();
      } else {
        toast.error("Failed to sync receipt voucher. Please check Tally connection.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to create receipt");
    } finally {
      setSyncing(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const filteredReceipts = receipts.filter(
    (rcp) =>
      rcp.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rcp.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = filteredReceipts.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const columns: Column<TallyReceipt>[] = [
    {
      header: "Receipt No",
      accessor: (row) => (
        <span className="font-mono font-bold text-foreground">{row.receiptNo}</span>
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
      header: "Client Name",
      accessor: (row) => (
        <span className="font-semibold text-foreground">{row.clientName}</span>
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Deposit Account",
      accessor: (row) => (
        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-muted-foreground" />
          {row.depositLedger}
        </span>
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Payment Mode",
      accessor: (row) => (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 border ${
          row.paymentMode === "Cash" 
            ? "text-amber-600 bg-amber-50 border-amber-200" 
            : "text-blue-600 bg-blue-50 border-blue-200"
        }`}>
          <CreditCard className="h-3 w-3" />
          {row.paymentMode}
        </span>
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Amount Collected",
      accessor: (row) => (
        <span className="font-bold text-emerald-600">₹{row.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
      ),
      className: "px-6 py-4 text-right w-[150px] font-bold text-emerald-600",
    },
    {
      header: "Status",
      accessor: (row) => (
        <TableStatusBadge label="Cleared in Tally" tone="green" />
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
        title="Client Receipts"
        subtitle="Track payments collected from clients and record Receipt Vouchers directly in Tally."
        searchPlaceholder="Search receipts by Number or Client..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={loading}
        headerAction={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-pink-700 hover:bg-pink-800 text-white rounded-xl shadow-md px-4 py-2.5 h-11 transition-colors font-semibold"
          >
            <Plus className="h-4.5 w-4.5" />
            Record Client Payment
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
              onClick={fetchReceipts}
              disabled={loading}
              className="h-11 w-11 hover:bg-muted"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
        columns={columns}
        data={paginatedReceipts}
        emptyMessage="No receipt records found in this period."
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="receipts"
      />

      {/* RECORD CLIENT PAYMENT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-xl sm:rounded-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Record Client Payment in Tally</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Name</label>
              <input
                type="text"
                required
                placeholder="e.g. ABC Corporation"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700"
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Receipt Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RCP-0045"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700 font-mono"
                />
              </div>
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
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount Collected</label>
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
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deposit Account (Tally Ledger)</label>
                <select
                  value={depositLedger}
                  onChange={(e) => setDepositLedger(e.target.value)}
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

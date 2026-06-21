import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { ApiRoute } from "../../constants/routes.enum";
import { toast } from "sonner";
import {
  Plus,
  RotateCw,
  Trash2,
  FileText
} from "lucide-react";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import { TableStatusBadge, tableCellClass } from "../../components/tableCells";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";

interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
  gstRate: number;
  amount: number;
}

interface TallyInvoice {
  invoiceNo: string;
  date: string;
  clientName: string;
  subTotal: number;
  tax: number;
  total: number;
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<TallyInvoice[]>([]);
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

  // Invoice Form State
  const [clientName, setClientName] = useState<string>("");
  const [invoiceNo, setInvoiceNo] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", qty: 1, rate: 0, gstRate: 18, amount: 0 }
  ]);

  // Approved Quotations for auto-generation
  const [approvedQuotations, setApprovedQuotations] = useState<any[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("");

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(ApiRoute.TALLY_INVOICES, {
        params: { periodStart: startDate, periodEnd: endDate }
      });
      if (res.data) {
        setInvoices(res.data);
      }
      setIsCached(!!res.isCached);
      setLastSyncedAt(res.lastSyncedAt || null);
    } catch (error: any) {
      toast.error(error.message || "Failed to load invoices from Tally");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async () => {
    try {
      const res: any = await api.get("/quotations");
      if (res.success && res.data) {
        // Filter quotations that are approved or similar
        const approved = res.data.filter((q: any) => q.status === "Approved" || q.status === "Accepted");
        setApprovedQuotations(approved);
      }
    } catch (err) {
      console.error("Failed to load quotations for invoice generator", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [startDate, endDate]);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleAddItem = () => {
    setItems([...items, { description: "", qty: 1, rate: 0, gstRate: 18, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = items.map((item, idx) => {
      if (idx === index) {
        const updatedItem = { ...item, [field]: value };
        if (field === "qty" || field === "rate") {
          updatedItem.amount = Number(updatedItem.qty) * Number(updatedItem.rate);
        }
        return updatedItem;
      }
      return item;
    });
    setItems(updated);
  };

  // Auto-populate from quotation selector
  const handleSelectQuotation = (quotationId: string) => {
    setSelectedQuotationId(quotationId);
    if (!quotationId) return;

    const q = approvedQuotations.find((x) => x._id === quotationId);
    if (q) {
      setClientName(q.clientRef?.companyName || q.companyName || "");
      setInvoiceNo(`INV-${q.quotationNo || "NEW"}`);
      
      let mappedItems: InvoiceItem[] = [];
      if (q.items && q.items.length > 0) {
        mappedItems = q.items.map((i: any) => ({
          description: i.description || i.name || "Services rendered",
          qty: i.qty || i.quantity || 1,
          rate: i.rate || i.price || 0,
          gstRate: i.gstRate || 18,
          amount: (i.qty || i.quantity || 1) * (i.rate || i.price || 0)
        }));
      } else if (q.totalAmount) {
        mappedItems = [{
          description: `Contract Services: ${q.subject || "Order Billing"}`,
          qty: 1,
          rate: q.totalAmount,
          gstRate: 18,
          amount: q.totalAmount
        }];
      }

      if (mappedItems.length > 0) {
        setItems(mappedItems);
      }
      toast.success("Loaded line items from approved quotation!");
    }
  };

  // Calculations
  const calculateTotals = () => {
    const subTotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const tax = items.reduce((sum, item) => sum + (Number(item.amount) * Number(item.gstRate)) / 100, 0);
    const total = subTotal + tax;
    return { subTotal, tax, total };
  };

  const { subTotal, tax, total } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !invoiceNo) {
      toast.warning("Please fill in the client name and invoice number.");
      return;
    }

    setSyncing(true);
    toast.info("Sending Sales Invoice to Tally...");

    try {
      const payload = {
        invoiceNo,
        clientName,
        date: invoiceDate,
        subTotal,
        tax,
        total,
        items
      };

      const res: any = await api.post(ApiRoute.TALLY_INVOICES, payload);
      if (res.success) {
        toast.success(`Invoice ${invoiceNo} successfully generated and synced in Tally!`);
        setIsModalOpen(false);
        // Reset state
        setClientName("");
        setInvoiceNo("");
        setItems([{ description: "", qty: 1, rate: 0, gstRate: 18, amount: 0 }]);
        setSelectedQuotationId("");
        // Refresh list
        await fetchInvoices();
      } else {
        toast.error("Failed to sync invoice. Please check agent logs.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to create invoice");
    } finally {
      setSyncing(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = filteredInvoices.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const columns: Column<TallyInvoice>[] = [
    {
      header: "Invoice No",
      accessor: (row) => (
        <span className="font-mono font-bold text-foreground">{row.invoiceNo}</span>
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
      header: "Subtotal",
      accessor: (row) => (
        <span className="font-medium text-foreground">₹{row.subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
      ),
      className: "px-6 py-4 text-right w-[150px] font-medium text-foreground",
    },
    {
      header: "GST (18%)",
      accessor: (row) => (
        <span className="font-medium text-muted-foreground">₹{row.tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
      ),
      className: "px-6 py-4 text-right w-[150px] font-medium text-muted-foreground",
    },
    {
      header: "Total Amount",
      accessor: (row) => (
        <span className="font-extrabold text-pink-700">₹{row.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
      ),
      className: "px-6 py-4 text-right w-[150px] font-extrabold text-pink-700",
    },
    {
      header: "Status",
      accessor: (row) => (
        <TableStatusBadge label="Tally Active" tone="green" />
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
        title="Sales Invoices"
        subtitle="Manage your billing records and directly sync Sales Vouchers in your local Tally database."
        searchPlaceholder="Search by Invoice No or Client Name..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isLoading={loading}
        headerAction={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-pink-700 hover:bg-pink-800 text-white rounded-xl shadow-md px-4 py-2.5 h-11 transition-colors"
          >
            <Plus className="h-4.5 w-4.5" />
            Create Sales Invoice
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
              onClick={fetchInvoices}
              disabled={loading}
              className="h-11 w-11 hover:bg-muted"
            >
              <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
        columns={columns}
        data={paginatedInvoices}
        emptyMessage="No sales invoices found in this period."
        currentPage={currentPage}
        totalPages={totalPages}
        total={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="sales invoices"
      />

      {/* CREATE INVOICE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent 
          className="w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Create Tally Sales Invoice</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Optional CRM Quotation Generator */}
            <div className="bg-primary/5 rounded-xl border border-primary/10 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <FileText className="h-4 w-4" />
                Auto-fill from CRM Approved Quotation
              </div>
              <select
                value={selectedQuotationId}
                onChange={(e) => handleSelectQuotation(e.target.value)}
                className="w-full bg-background border border-primary/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700"
              >
                <option value="">-- Choose an Approved Quotation (Optional) --</option>
                {approvedQuotations.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.quotationNo} - {q.companyName || q.clientRef?.companyName} (₹{q.totalAmount?.toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>

            {/* Main Fields */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Ledger Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sundry Debtor Ledger in Tally..."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-0001"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700 font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Date</label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-700"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Line Items</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-semibold text-pink-700 hover:underline"
                >
                  + Add Item Row
                </button>
              </div>

              <div className="border rounded-xl overflow-hidden bg-background">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted border-b text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2 flex-1">Description / Services</th>
                      <th className="px-4 py-2 w-20 text-center">Qty</th>
                      <th className="px-4 py-2 w-32 text-right">Rate (₹)</th>
                      <th className="px-4 py-2 w-24 text-center">GST %</th>
                      <th className="px-4 py-2 w-32 text-right">Amount (₹)</th>
                      <th className="px-4 py-2 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            placeholder="Describe services rendered..."
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 outline-none p-1 text-foreground"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, "qty", parseInt(e.target.value) || 1)}
                            className="w-full bg-transparent border-none text-center outline-none focus:ring-0 p-1 text-foreground"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            required
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, "rate", parseFloat(e.target.value) || 0)}
                            className="w-full bg-transparent border-none text-right outline-none focus:ring-0 p-1 text-foreground"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.gstRate}
                            onChange={(e) => handleItemChange(idx, "gstRate", parseInt(e.target.value) || 0)}
                            className="w-full bg-transparent border-none text-center outline-none focus:ring-0 p-1 text-foreground"
                          >
                            <option value="18">18%</option>
                            <option value="12">12%</option>
                            <option value="5">5%</option>
                            <option value="0">0%</option>
                          </select>
                        </td>
                        <td className="p-2 text-right pr-4 font-semibold text-foreground">
                          ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-600 disabled:opacity-30"
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-80 bg-muted/30 border rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>Subtotal:</span>
                  <span>₹{subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                  <span>Tax (GST 18%):</span>
                  <span>₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-sm font-extrabold text-pink-700">
                  <span>Total Invoice Value:</span>
                  <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
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
                  "Create & Sync"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

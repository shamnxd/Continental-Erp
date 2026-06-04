import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { createVendorBillApi } from "../../api/finance.api";
import { AppRoute } from "../../constants/routes.enum";
import type { BillCategory, FinanceLineItem } from "../../interfaces/finance.interface";
import { FinanceLineItemsEditor } from "./FinanceLineItemsEditor";
import { PAYMENT_TERMS, dueDateFromPaymentTerms } from "./financeFormConstants";
import { computeDocumentTotals, emptyLineItem, normalizeItemsForApi } from "./financeLineItems";
import { formatInr, todayIsoDate } from "./financeUtils";

export function VendorBillFormPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vendor, setVendor] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState("");
  const [category, setCategory] = useState<BillCategory>("Spare Parts");
  const [billDate, setBillDate] = useState(todayIsoDate());
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [dueDate, setDueDate] = useState(dueDateFromPaymentTerms(todayIsoDate(), "Net 30"));
  const [referenceNo, setReferenceNo] = useState("");
  const [gstPercent, setGstPercent] = useState(18);
  const [items, setItems] = useState<FinanceLineItem[]>([emptyLineItem()]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const totals = useMemo(() => computeDocumentTotals(items, gstPercent), [items, gstPercent]);

  const handleBillDateChange = (date: string) => {
    setBillDate(date);
    setDueDate(dueDateFromPaymentTerms(date, paymentTerms));
  };

  const handlePaymentTermsChange = (terms: string) => {
    setPaymentTerms(terms);
    setDueDate(dueDateFromPaymentTerms(billDate, terms));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    const normalized = normalizeItemsForApi(items);
    if (normalized.length === 0) {
      toast.error("Add at least one line item");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createVendorBillApi({
        vendor: vendor.trim(),
        vendorGstin: vendorGstin.trim() || undefined,
        vendorInvoiceNo: vendorInvoiceNo.trim() || undefined,
        category,
        billDate,
        dueDate,
        paymentTerms,
        referenceNo: referenceNo.trim() || undefined,
        items: normalized,
        gstPercent,
        amountPaid: Number(amountPaid) || 0,
        notes: notes.trim() || undefined,
      });
      if (res.success) {
        toast.success(`Bill ${res.data.billNo} created`);
        navigate(AppRoute.FINANCE_PAYABLES);
      }
    } catch {
      toast.error("Failed to create vendor bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(AppRoute.FINANCE_PAYABLES)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Record vendor bill</h2>
          <p className="text-sm text-muted-foreground">Supplier invoice with line items and GST (accounts payable)</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <ScrollArea className="max-h-[calc(100vh-11rem)]">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Vendor / supplier name *</Label>
                <Input value={vendor} onChange={(e) => setVendor(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Vendor GSTIN</Label>
                <Input value={vendorGstin} onChange={(e) => setVendorGstin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vendor invoice no.</Label>
                <Input value={vendorInvoiceNo} onChange={(e) => setVendorInvoiceNo(e.target.value)} placeholder="Their bill number" />
              </div>
              <div className="space-y-2">
                <Label>Expense category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as BillCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spare Parts">Spare Parts</SelectItem>
                    <SelectItem value="Subcontractor">Subcontractor</SelectItem>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Rent">Rent</SelectItem>
                    <SelectItem value="GST">GST</SelectItem>
                    <SelectItem value="Utility">Utility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Internal reference</Label>
                <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bill date</Label>
                <Input type="date" value={billDate} onChange={(e) => handleBillDateChange(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Payment terms</Label>
                <Select value={paymentTerms} onValueChange={handlePaymentTermsChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TERMS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </div>
            </section>

            <FinanceLineItemsEditor items={items} onChange={setItems} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>GST %</Label>
                <Input type="number" min={0} max={100} value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))} />
              </div>
              <div className="text-right space-y-1 text-sm border rounded-lg p-4 bg-muted/20">
                <p>Subtotal: <span className="font-semibold">{formatInr(totals.subtotal)}</span></p>
                <p>GST: <span className="font-semibold">{formatInr(totals.gstAmount)}</span></p>
                <p className="text-base">Bill total: <span className="font-bold text-pink-700">{formatInr(totals.grandTotal)}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Already paid (₹)</Label>
                <Input type="number" min={0} value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(AppRoute.FINANCE_PAYABLES)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-pink-700 hover:bg-pink-800">
                {isSubmitting ? "Saving…" : "Save vendor bill"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { createQuotationApi, updateQuotationApi } from "../api/quotation.api";
import { Quotation, QuotationLineItem, QuotationStatus } from "../interfaces/quotation.interface";
import { Client } from "../interfaces/client.interface";
import { Enquiry } from "../interfaces/enquiry.interface";
import { getEnquiriesApi } from "../api/enquiry.api";
import { useDebounce } from "../hooks/useDebounce";
import { toast } from "sonner";

const QUOTATION_STATUSES: QuotationStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Expired",
];

export interface QuotationPrefillFromEnquiry {
  enquiryId: string;
  enquiryNo: string;
  clientId: string;
  clientName: string;
  requirement?: string;
  description?: string;
}

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  quotation?: Quotation | null;
  clients: Client[];
  prefillFromEnquiry?: QuotationPrefillFromEnquiry | null;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function emptyLineItem(): QuotationLineItem {
  return { description: "", qty: 1, rate: 0, total: 0 };
}

function computeTotals(items: QuotationLineItem[], gstPercent: number) {
  const amount = items.reduce((sum, i) => sum + (i.qty || 0) * (i.rate || 0), 0);
  const gst = Math.round((amount * gstPercent) / 100);
  return { amount, gst, total: amount + gst };
}

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function QuotationFormModal({
  isOpen,
  onClose,
  onSuccess,
  quotation = null,
  clients,
  prefillFromEnquiry = null,
}: QuotationFormModalProps) {
  const isEdit = !!quotation?.id;

  const [selectedClientId, setSelectedClientId] = useState("");
  const [enquiryId, setEnquiryId] = useState("");
  const [enquiryNo, setEnquiryNo] = useState("");
  const [enquirySearch, setEnquirySearch] = useState("");
  const debouncedEnquirySearch = useDebounce(enquirySearch, 250);
  const [enquirySuggestions, setEnquirySuggestions] = useState<Enquiry[]>([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
  const [quotationDate, setQuotationDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [status, setStatus] = useState<QuotationStatus>("Pending Approval");
  const [gstPercent, setGstPercent] = useState(18);
  const [items, setItems] = useState<QuotationLineItem[]>([emptyLineItem()]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const debouncedClientSearch = useDebounce(clientSearch, 300);

  useEffect(() => {
    if (!isOpen) return;
    if (!debouncedEnquirySearch.trim()) {
      setEnquirySuggestions([]);
      return;
    }
    setIsLoadingEnquiries(true);
    getEnquiriesApi({
      page: 1,
      limit: 10,
      search: debouncedEnquirySearch.trim(),
      clientId: selectedClientId || undefined,
    })
      .then((res) => {
        if (res.success) {
          const openOnly = res.data.filter(
            (e) =>
              (!selectedClientId || e.clientId === selectedClientId) &&
              e.status !== "Closed" &&
              e.status !== "Converted to Project",
          );
          setEnquirySuggestions(openOnly);
        }
      })
      .catch(() => setEnquirySuggestions([]))
      .finally(() => setIsLoadingEnquiries(false));
  }, [debouncedEnquirySearch, isOpen, selectedClientId]);

  useEffect(() => {
    if (!isOpen) return;
    if (quotation) {
      setSelectedClientId(quotation.clientId);
      setEnquiryId(quotation.enquiryId ?? "");
      setEnquiryNo(quotation.enquiryNo ?? "");
      setEnquirySearch("");
      setQuotationDate(toDateInputValue(quotation.date));
      setValidUntil(toDateInputValue(quotation.validUntil));
      setStatus(quotation.status);
      setGstPercent(quotation.gstPercent ?? 18);
      setItems(quotation.items?.length ? quotation.items.map((i) => ({ ...i })) : [emptyLineItem()]);
      setNotes(quotation.notes ?? "");
    } else if (prefillFromEnquiry) {
      setSelectedClientId(prefillFromEnquiry.clientId);
      setEnquiryId(prefillFromEnquiry.enquiryId);
      setEnquiryNo(prefillFromEnquiry.enquiryNo);
      setEnquirySearch("");
      setQuotationDate(new Date().toISOString().split("T")[0]);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setValidUntil(d.toISOString().split("T")[0]);
      setStatus("Pending Approval");
      setGstPercent(18);
      if (prefillFromEnquiry.requirement) {
        const desc = prefillFromEnquiry.description
          ? `${prefillFromEnquiry.requirement} - ${prefillFromEnquiry.description}`
          : prefillFromEnquiry.requirement;
        setItems([{ description: desc, qty: 1, rate: 0, total: 0 }]);
      } else {
        setItems([emptyLineItem()]);
      }
      setNotes("");
    } else {
      setSelectedClientId("");
      setEnquiryId("");
      setEnquiryNo("");
      setEnquirySearch("");
      setQuotationDate(new Date().toISOString().split("T")[0]);
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setValidUntil(d.toISOString().split("T")[0]);
      setStatus("Pending Approval");
      setGstPercent(18);
      setItems([emptyLineItem()]);
      setNotes("");
    }
    setClientSearch("");
  }, [isOpen, quotation, prefillFromEnquiry]);

  const filteredClients = clients.filter(
    (c) =>
      debouncedClientSearch === "" ||
      c.companyName.toLowerCase().includes(debouncedClientSearch.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(debouncedClientSearch.toLowerCase()),
  );

  const normalizedItems = useMemo(
    () =>
      items.map((item) => {
        const qty = Number(item.qty) || 0;
        const rate = Number(item.rate) || 0;
        return { ...item, qty, rate, total: qty * rate };
      }),
    [items],
  );

  const totals = useMemo(() => computeTotals(normalizedItems, gstPercent), [normalizedItems, gstPercent]);

  const updateItem = (index: number, field: keyof QuotationLineItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyLineItem()]);
  const removeItem = (index: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId || (c as { _id?: string })._id === selectedClientId);
    if (!client) {
      toast.error("Please select a client");
      return;
    }
    const validItems = normalizedItems.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      toast.error("Add at least one line item");
      return;
    }

    const clientId = client.id || (client as { _id?: string })._id || "";
    const payload = {
      date: new Date(quotationDate).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
      clientId,
      clientName: client.companyName,
      enquiryId: enquiryId.trim(),
      enquiryNo: enquiryNo.trim(),
      gstPercent,
      items: validItems,
      notes: notes.trim(),
      status,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && quotation?.id) {
        await updateQuotationApi(quotation.id, payload);
        toast.success("Quotation updated");
      } else {
        await createQuotationApi(payload);
        toast.success("Quotation created");
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(isEdit ? "Failed to update quotation" : "Failed to create quotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Quotation" : "Create Quotation"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quotation Date</Label>
              <Input type="date" value={quotationDate} onChange={(e) => setQuotationDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search client…"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9 mb-2"
                disabled={isEdit || !!prefillFromEnquiry}
              />
            </div>
            <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={isEdit || !!prefillFromEnquiry}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {filteredClients.map((c) => {
                  const id = c.id || (c as { _id?: string })._id || "";
                  return (
                    <SelectItem key={id} value={id}>
                      {c.companyName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Enquiry (optional)</Label>
              <div className="relative">
                <Input
                  value={enquirySearch || enquiryNo}
                  onChange={(e) => {
                    setEnquirySearch(e.target.value);
                    setEnquiryNo(e.target.value);
                    if (!e.target.value.trim()) setEnquiryId("");
                  }}
                  placeholder="Type enquiry no / client / phone…"
                  readOnly={!!prefillFromEnquiry}
                />
                {(enquiryId || enquiryNo) && !prefillFromEnquiry && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                    onClick={() => {
                      setEnquiryId("");
                      setEnquiryNo("");
                      setEnquirySearch("");
                      setEnquirySuggestions([]);
                    }}
                    aria-label="Clear enquiry"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}

                {!prefillFromEnquiry && enquirySearch.trim() && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
                    {isLoadingEnquiries ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
                    ) : enquirySuggestions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No enquiries found</div>
                    ) : (
                      <div className="max-h-56 overflow-auto">
                        {enquirySuggestions.map((enq) => (
                          <button
                            key={enq.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted/60 text-sm"
                            onClick={() => {
                              setEnquiryId(enq.id || "");
                              setEnquiryNo(enq.enquiryNo);
                              setEnquirySearch("");
                              setEnquirySuggestions([]);
                              setSelectedClientId(enq.clientId);
                              if (enq.requirement) {
                                const desc = enq.description
                                  ? `${enq.requirement} - ${enq.description}`
                                  : enq.requirement;
                                setItems([{ description: desc, qty: 1, rate: 0, total: 0 }]);
                              }
                            }}
                          >
                            <div className="font-semibold text-foreground">{enq.enquiryNo}</div>
                            <div className="text-xs text-muted-foreground">
                              {enq.clientName} · {enq.phone}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              {isEdit ? (
                <Select value={status} onValueChange={(v) => setStatus(v as QuotationStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Add row
              </Button>
            </div>
            <div className="space-y-2 border rounded-lg p-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-end rounded-lg border border-border/50 p-2 sm:p-0 sm:border-0"
                >
                  <div className="col-span-12 sm:col-span-5">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Qty"
                      value={item.qty || ""}
                      onChange={(e) => updateItem(index, "qty", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Rate"
                      value={item.rate || ""}
                      onChange={(e) => updateItem(index, "rate", Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-sm font-medium text-right pb-0 sm:pb-2">
                    {formatInr((Number(item.qty) || 0) * (Number(item.rate) || 0))}
                  </div>
                  <div className="col-span-1 flex justify-end pb-0 sm:pb-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>GST %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
              />
            </div>
            <div className="text-right space-y-1 text-sm">
              <p>
                Subtotal: <span className="font-semibold">{formatInr(totals.amount)}</span>
              </p>
              <p>
                GST: <span className="font-semibold">{formatInr(totals.gst)}</span>
              </p>
              <p className="text-base">
                Total: <span className="font-bold text-pink-700">{formatInr(totals.total)}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Internal notes…" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-pink-700 hover:bg-pink-800">
              {isSubmitting ? "Saving…" : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { createIncomeEntryApi } from "../../api/finance.api";
import type { Client } from "../../interfaces/client.interface";
import type { IncomeSourceType } from "../../interfaces/finance.interface";
import { PAYMENT_METHODS } from "./financeFormConstants";
import { ReferenceSearchSelect } from "./ReferenceSearchSelect";
import { todayIsoDate } from "./financeUtils";

interface CustomerPaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  clients: Client[];
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

const initialState = () => ({
  sourceType: "Advance" as IncomeSourceType,
  clientId: "",
  quotationId: "",
  quotationNo: "",
  amcId: "",
  amcNo: "",
  complaintId: "",
  complaintNo: "",
  incomeDate: todayIsoDate(),
  actualReceived: 0,
  paymentMethod: "Bank Transfer",
  referenceNo: "",
  notes: "",
});

export function CustomerPaymentFormDialog({
  open,
  onOpenChange,
  onSuccess,
  clients,
  isSaving,
  setIsSaving,
}: CustomerPaymentFormDialogProps) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (!open) setForm(initialState());
  }, [open]);

  const selectedClient = clients.find((c) => c.id === form.clientId);

  const searchQuotations = useCallback(
    async (q: string) => {
      const { getQuotationsApi } = await import("../../api/quotation.api");
      const res = await getQuotationsApi({ search: q, page: 1, limit: 8, clientId: form.clientId || undefined });
      if (!res.success) return [];
      return res.data.map((qu) => ({
        id: qu.id!,
        label: qu.quotationNo,
        sublabel: qu.clientName,
      }));
    },
    [form.clientId],
  );

  const searchAmc = useCallback(
    async (q: string) => {
      const { getAmcApi } = await import("../../api/amc.api");
      const res = await getAmcApi({ search: q, page: 1, limit: 8, clientId: form.clientId || undefined });
      if (!res.success) return [];
      return res.data.map((a) => ({
        id: a.id!,
        label: a.amcNo,
        sublabel: a.clientName,
      }));
    },
    [form.clientId],
  );

  const searchComplaints = useCallback(
    async (q: string) => {
      const { getComplaintsApi } = await import("../../api/complaint.api");
      const res = await getComplaintsApi({ search: q, page: 1, limit: 8, clientId: form.clientId || undefined });
      if (!res.success) return [];
      return res.data.map((c) => ({
        id: c.id!,
        label: c.complaintNo,
        sublabel: c.clientName,
      }));
    },
    [form.clientId],
  );

  const resetAndClose = () => {
    setForm(initialState());
    onOpenChange(false);
  };

  const buildSourceLabel = () => {
    if (form.quotationNo) return `Advance — ${form.quotationNo}`;
    if (form.amcNo) return `Advance — ${form.amcNo}`;
    if (form.complaintNo) return `Payment — ${form.complaintNo}`;
    return `${form.sourceType} — ${selectedClient?.companyName ?? "Customer"}`;
  };

  const handleSubmit = async () => {
    if (!form.clientId) {
      toast.error("Select a client");
      return;
    }
    if (form.actualReceived <= 0) {
      toast.error("Enter amount received");
      return;
    }
    if (form.sourceType === "Advance" && !form.quotationId && !form.amcId && !form.complaintId) {
      toast.error("Link advance to a quotation, AMC, or complaint");
      return;
    }

    setIsSaving(true);
    try {
      const res = await createIncomeEntryApi({
        source: buildSourceLabel(),
        sourceType: form.sourceType,
        clientId: form.clientId,
        clientName: selectedClient?.companyName,
        incomeDate: form.incomeDate,
        expectedAmount: form.actualReceived,
        actualReceived: form.actualReceived,
        paymentMethod: form.paymentMethod,
        referenceNo: form.referenceNo.trim() || undefined,
        quotationId: form.quotationId || undefined,
        quotationNo: form.quotationNo || undefined,
        amcId: form.amcId || undefined,
        amcNo: form.amcNo || undefined,
        complaintId: form.complaintId || undefined,
        complaintNo: form.complaintNo || undefined,
        notes: form.notes.trim() || undefined,
      });
      if (res.success) {
        toast.success("Customer payment recorded");
        resetAndClose();
        onSuccess();
      }
    } catch {
      toast.error("Failed to save payment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record customer payment / advance</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Link to a quotation or AMC so the amount auto-applies when you create the matching invoice.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <Label>Payment type</Label>
            <Select
              value={form.sourceType}
              onValueChange={(v) => setForm((p) => ({ ...p, sourceType: v as IncomeSourceType }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Advance">Advance (before invoice)</SelectItem>
                <SelectItem value="Client Payment">Client payment</SelectItem>
                <SelectItem value="AMC Renewal">AMC renewal</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={form.clientId} onValueChange={(v) => setForm((p) => ({ ...p, clientId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id!}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ReferenceSearchSelect
            label="Quotation (for advance)"
            selectedId={form.quotationId}
            selectedLabel={form.quotationNo}
            onSelect={(o) =>
              setForm((p) => ({
                ...p,
                quotationId: o?.id ?? "",
                quotationNo: o?.label ?? "",
                amcId: "",
                amcNo: "",
              }))
            }
            searchFn={searchQuotations}
            disabled={!form.clientId}
          />
          <ReferenceSearchSelect
            label="AMC contract"
            selectedId={form.amcId}
            selectedLabel={form.amcNo}
            onSelect={(o) =>
              setForm((p) => ({
                ...p,
                amcId: o?.id ?? "",
                amcNo: o?.label ?? "",
                quotationId: "",
                quotationNo: "",
              }))
            }
            searchFn={searchAmc}
            disabled={!form.clientId}
          />
          <ReferenceSearchSelect
            label="Complaint (optional)"
            selectedId={form.complaintId}
            selectedLabel={form.complaintNo}
            onSelect={(o) =>
              setForm((p) => ({
                ...p,
                complaintId: o?.id ?? "",
                complaintNo: o?.label ?? "",
              }))
            }
            searchFn={searchComplaints}
            disabled={!form.clientId}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Receipt date</Label>
              <Input type="date" value={form.incomeDate} onChange={(e) => setForm((p) => ({ ...p, incomeDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Amount received (₹) *</Label>
              <Input
                type="number"
                min={0}
                value={form.actualReceived || ""}
                onChange={(e) => setForm((p) => ({ ...p, actualReceived: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm((p) => ({ ...p, paymentMethod: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>UTR / reference</Label>
              <Input value={form.referenceNo} onChange={(e) => setForm((p) => ({ ...p, referenceNo: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-pink-700 hover:bg-pink-800">
            Save payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

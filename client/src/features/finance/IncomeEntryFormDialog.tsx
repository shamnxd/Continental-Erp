import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { createIncomeEntryApi } from "../../api/finance.api";
import type { Client } from "../../interfaces/client.interface";
import type { IncomeSourceType } from "../../interfaces/finance.interface";
import { INCOME_SOURCE_TYPES, PAYMENT_METHODS } from "./financeFormConstants";
import { todayIsoDate } from "./financeUtils";

interface IncomeEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  clients: Client[];
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

const initialState = () => ({
  source: "",
  sourceType: "Client Payment" as IncomeSourceType,
  clientId: "",
  incomeDate: todayIsoDate(),
  expectedDate: "",
  expectedAmount: 0,
  actualReceived: 0,
  paymentMethod: "Bank Transfer",
  referenceNo: "",
  notes: "",
});

export function IncomeEntryFormDialog({
  open,
  onOpenChange,
  onSuccess,
  clients,
  isSaving,
  setIsSaving,
}: IncomeEntryFormDialogProps) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (!open) setForm(initialState());
  }, [open]);

  const selectedClient = clients.find((c) => c.id === form.clientId);

  const resetAndClose = () => {
    setForm(initialState());
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!form.source.trim()) {
      toast.error("Income source label is required");
      return;
    }

    setIsSaving(true);
    try {
      const res = await createIncomeEntryApi({
        source: form.source.trim(),
        sourceType: form.sourceType,
        clientId: form.clientId || undefined,
        clientName: selectedClient?.companyName,
        incomeDate: form.incomeDate,
        expectedDate: form.expectedDate || undefined,
        expectedAmount: Number(form.expectedAmount) || 0,
        actualReceived: Number(form.actualReceived) || 0,
        paymentMethod: form.paymentMethod,
        referenceNo: form.referenceNo.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      if (res.success) {
        toast.success("Income entry added");
        resetAndClose();
        onSuccess();
      }
    } catch {
      toast.error("Failed to add income");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record expected income</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Source type</Label>
            <Select value={form.sourceType} onValueChange={(v) => setForm((p) => ({ ...p, sourceType: v as IncomeSourceType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INCOME_SOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Source label *</Label>
            <Input value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} placeholder="e.g. AMC renewal Q2" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Client (optional)</Label>
            <Select value={form.clientId || "__none__"} onValueChange={(v) => setForm((p) => ({ ...p, clientId: v === "__none__" ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="Link to client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id!}>{c.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Income / receipt date</Label>
            <Input type="date" value={form.incomeDate} onChange={(e) => setForm((p) => ({ ...p, incomeDate: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Expected collection date</Label>
            <Input type="date" value={form.expectedDate} onChange={(e) => setForm((p) => ({ ...p, expectedDate: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Expected amount (₹)</Label>
            <Input type="number" min={0} value={form.expectedAmount} onChange={(e) => setForm((p) => ({ ...p, expectedAmount: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Actual received (₹)</Label>
            <Input type="number" min={0} value={form.actualReceived} onChange={(e) => setForm((p) => ({ ...p, actualReceived: Number(e.target.value) }))} />
          </div>
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
            <Label>Reference / UTR</Label>
            <Input value={form.referenceNo} onChange={(e) => setForm((p) => ({ ...p, referenceNo: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>Save income</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

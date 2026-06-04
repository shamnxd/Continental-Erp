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
import { createExpenseEntryApi } from "../../api/finance.api";
import type { ExpenseEntry, ExpenseStatus } from "../../interfaces/finance.interface";
import { currentPeriodMonth, EXPENSE_STATUSES, PAYMENT_METHODS } from "./financeFormConstants";
import { todayIsoDate } from "./financeUtils";

interface ExpenseEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
  defaultCategory?: ExpenseEntry["category"];
}

const initialState = () => ({
  category: "Other" as ExpenseEntry["category"],
  name: "",
  description: "",
  payee: "",
  expenseDate: todayIsoDate(),
  periodMonth: currentPeriodMonth(),
  paymentMethod: "Bank Transfer",
  referenceNo: "",
  budget: 0,
  actual: 0,
  status: "Recorded" as ExpenseStatus,
  notes: "",
});

export function ExpenseEntryFormDialog({
  open,
  onOpenChange,
  onSuccess,
  isSaving,
  setIsSaving,
  defaultCategory = "Other",
}: ExpenseEntryFormDialogProps) {
  const [form, setForm] = useState(() => ({ ...initialState(), category: defaultCategory }));

  useEffect(() => {
    if (open) setForm({ ...initialState(), category: defaultCategory });
  }, [open, defaultCategory]);

  const resetAndClose = () => {
    setForm(initialState());
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Expense title is required");
      return;
    }
    if (form.actual <= 0 && form.status !== "Planned") {
      toast.error("Enter actual amount for recorded/paid expenses");
      return;
    }

    setIsSaving(true);
    try {
      const res = await createExpenseEntryApi({
        category: form.category,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        payee: form.payee.trim() || undefined,
        expenseDate: form.expenseDate,
        periodMonth: form.periodMonth,
        paymentMethod: form.paymentMethod,
        referenceNo: form.referenceNo.trim() || undefined,
        budget: Number(form.budget) || 0,
        actual: Number(form.actual) || 0,
        status: form.status,
        notes: form.notes.trim() || undefined,
      });
      if (res.success) {
        toast.success("Expense recorded");
        resetAndClose();
        onSuccess();
      }
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record expense</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          ERP-style expense: what, who was paid, when, and which budget period.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-2">
            <Label>Expense title *</Label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Office rent April" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as ExpenseEntry["category"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Salary">Salary</SelectItem>
                <SelectItem value="Rent">Rent</SelectItem>
                <SelectItem value="GST">GST</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Materials">Materials</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Fuel">Fuel</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as ExpenseStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payee / vendor</Label>
            <Input value={form.payee} onChange={(e) => setForm((p) => ({ ...p, payee: e.target.value }))} />
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
            <Label>Expense date</Label>
            <Input type="date" value={form.expenseDate} onChange={(e) => setForm((p) => ({ ...p, expenseDate: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Budget period (YYYY-MM)</Label>
            <Input type="month" value={form.periodMonth} onChange={(e) => setForm((p) => ({ ...p, periodMonth: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Budget (₹)</Label>
            <Input type="number" min={0} value={form.budget} onChange={(e) => setForm((p) => ({ ...p, budget: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Actual amount (₹) *</Label>
            <Input type="number" min={0} value={form.actual} onChange={(e) => setForm((p) => ({ ...p, actual: Number(e.target.value) }))} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Reference / voucher no.</Label>
            <Input value={form.referenceNo} onChange={(e) => setForm((p) => ({ ...p, referenceNo: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>Save expense</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

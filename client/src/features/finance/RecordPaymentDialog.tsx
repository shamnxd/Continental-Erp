import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { formatInr, todayIsoDate } from "./financeUtils";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  amount: number;
  paymentDate: string;
  note: string;
  onAmountChange: (amount: number) => void;
  onDateChange: (date: string) => void;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
  submitLabel?: string;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  amount,
  paymentDate,
  note,
  onAmountChange,
  onDateChange,
  onNoteChange,
  onSubmit,
  isSaving,
  submitLabel = "Record payment",
}: RecordPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="space-y-3">
          <div>
            <Label>Amount (₹)</Label>
            <Input type="number" value={amount} onChange={(e) => onAmountChange(Number(e.target.value))} />
          </div>
          <div>
            <Label>Payment Date</Label>
            <Input type="date" value={paymentDate} onChange={(e) => onDateChange(e.target.value)} />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input value={note} onChange={(e) => onNoteChange(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isSaving || amount <= 0}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function paymentDialogDefaults(outstanding: number) {
  return { amount: outstanding, paymentDate: todayIsoDate(), note: "" };
}

export function formatOutstandingLine(outstanding: number, name: string) {
  return `Outstanding: ${formatInr(outstanding)} · ${name}`;
}

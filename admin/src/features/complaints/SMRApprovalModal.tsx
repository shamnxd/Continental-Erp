import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { approveSMRApi } from "../../api/smr.api";
import { SMR } from "../../interfaces/smr.interface";
import { toast } from "sonner";

interface SMRApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  smr: SMR | null;
  defaultRepName?: string;
  onApproved: () => void;
}

export function SMRApprovalModal({
  isOpen,
  onClose,
  smr,
  defaultRepName = "",
  onApproved,
}: SMRApprovalModalProps) {
  const [clientRepName, setClientRepName] = useState(defaultRepName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClientRepName(defaultRepName);
    }
  }, [isOpen, defaultRepName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smr?.id || !clientRepName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await approveSMRApi(smr.id, { clientRepName: clientRepName.trim() });
      if (res.success) {
        toast.success("SMR approved successfully!");
        onApproved();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve SMR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border border-border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Approve SMR — {smr?.smrNo}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Enter the client representative name to approve this service report.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="repName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Representative Name *
            </Label>
            <Input
              id="repName"
              value={clientRepName}
              onChange={(e) => setClientRepName(e.target.value)}
              placeholder="Client representative name"
              className="mt-1 h-9"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="font-bold">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !clientRepName.trim()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {isSubmitting ? "Approving..." : "Approve SMR"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

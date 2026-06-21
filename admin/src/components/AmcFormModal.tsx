import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { AmcContract, AmcFrequency, CreateAmcPayload } from "../interfaces/amc.interface";
import { createAmcApi, getAmcApi, updateAmcApi } from "../api/amc.api";
import { getClientsApi } from "../api/client.api";
import type { Client } from "../interfaces/client.interface";
import { calculateTotalVisits, formatContractDate } from "../utils/calculateAmcVisits";
import { getDefaultRenewalDates, hasBlockingAmcContract } from "../utils/amcRenewal";
import { ClientFormModal } from "../features/clients/ClientFormModal";
import { AmcBlockedModal } from "./AmcBlockedModal";

interface AmcFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contract: AmcContract | null;
  /** When set, creates a renewal contract for this client. */
  renewalSource?: AmcContract | null;
  /** Pre-select client when opening from client detail. */
  initialClientId?: string;
}

const frequencies: AmcFrequency[] = ["Monthly", "Quarterly", "Bi-Annual", "Annual"];

const dateInputClass =
  "border border-input bg-background text-foreground [color-scheme:light] dark:[color-scheme:dark]";

function toDateInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function AmcFormModal({
  isOpen,
  onClose,
  onSuccess,
  contract,
  renewalSource = null,
  initialClientId,
}: AmcFormModalProps) {
  const [renewFromBlocked, setRenewFromBlocked] = useState<AmcContract | null>(null);
  const activeRenewal = renewalSource ?? renewFromBlocked;
  const isRenewal = !!activeRenewal?.id;
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [blockedContract, setBlockedContract] = useState<AmcContract | null>(null);

  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState<AmcFrequency>("Quarterly");
  const [amount, setAmount] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");

  const isEdit = !!contract?.id;

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contactPerson?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const fetchClients = useCallback(() => {
    setLoadingClients(true);
    getClientsApi({ page: 1, limit: 200 })
      .then((res) => {
        if (res.success) setClients(res.data);
      })
      .catch(() => toast.error("Failed to load clients"))
      .finally(() => setLoadingClients(false));
  }, []);

  const calculatedVisits = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const n = calculateTotalVisits(startDate, endDate, frequency);
    return n > 0 ? n : 1;
  }, [startDate, endDate, frequency]);

  useEffect(() => {
    if (!isOpen) return;
    fetchClients();
  }, [isOpen, fetchClients]);

  useEffect(() => {
    if (!isOpen) return;

    if (contract) {
      setClientId(contract.clientId);
      setStartDate(toDateInput(contract.startDate));
      setEndDate(toDateInput(contract.endDate));
      setFrequency(contract.frequency);
      setAmount(contract.amount ? String(contract.amount) : "");
      setServiceType(contract.serviceType);
      setNotes(contract.notes ?? "");
    } else if (activeRenewal) {
      const { startDate: rs, endDate: re } = getDefaultRenewalDates(activeRenewal.endDate);
      setClientId(activeRenewal.clientId);
      setStartDate(rs);
      setEndDate(re);
      setFrequency(activeRenewal.frequency);
      setAmount(activeRenewal.amount ? String(activeRenewal.amount) : "");
      setServiceType(activeRenewal.serviceType);
      setNotes(activeRenewal.notes ?? "");
    } else {
      const today = new Date().toISOString().split("T")[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      setClientId(initialClientId ?? "");
      setStartDate(today);
      setEndDate(nextYear.toISOString().split("T")[0]);
      setFrequency("Quarterly");
      setAmount("");
      setServiceType("");
      setNotes("");
    }
  }, [contract, activeRenewal, initialClientId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be on or after start date");
      return;
    }
    if (!serviceType.trim()) {
      toast.error("Service type is required");
      return;
    }

    const payload: CreateAmcPayload = {
      clientId,
      startDate,
      endDate,
      frequency,
      amount: amount.trim() === "" ? 0 : Number(amount) || 0,
      totalVisits: calculatedVisits,
      serviceType: serviceType.trim(),
      notes: notes.trim() || undefined,
      renewalOfAmcId: isRenewal && activeRenewal?.id ? activeRenewal.id : undefined,
    };

    setIsSubmitting(true);
    try {
      if (contract?.id) {
        const res = await updateAmcApi(contract.id, payload);
        if (res.success) {
          toast.success("AMC contract updated");
          onSuccess();
          onClose();
        }
      } else {
        if (!isRenewal) {
          const check = await getAmcApi({ clientId, limit: 20 });
          if (check.success) {
            const blocking = hasBlockingAmcContract(check.data);
            if (blocking) {
              setBlockedContract(blocking);
              setIsSubmitting(false);
              return;
            }
          }
        }

        const res = await createAmcApi(payload);
        if (res.success) {
          toast.success(isRenewal ? "AMC contract renewed" : "AMC contract created");
          onSuccess();
          onClose();
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || (contract?.id ? "Failed to update contract" : "Failed to create contract"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "border border-input bg-background text-foreground placeholder:text-muted-foreground";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {contract ? "Edit AMC Contract" : isRenewal ? "Renew AMC Contract" : "Add AMC Contract"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            {isRenewal && activeRenewal && (
              <p className="text-xs text-muted-foreground">
                Renewing from {activeRenewal.amcNo} · {activeRenewal.clientName}
              </p>
            )}
            {isEdit ? (
              <Input value={contract?.clientName ?? ""} readOnly className={`${inputClass} bg-muted/50`} />
            ) : (
              <Select
                value={clientId}
                onValueChange={setClientId}
                disabled={loadingClients || isRenewal}
                onOpenChange={(open) => {
                  if (!open) setClientSearch("");
                }}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select client"} />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-2 border-b border-border/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Search clients..."
                        className="w-full pl-7 pr-2 py-1.5 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                  {filteredClients.map((c) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {c.companyName}
                      {c.contactPerson && (
                        <span className="text-muted-foreground text-xs ml-1">— {c.contactPerson}</span>
                      )}
                    </SelectItem>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="px-2 py-3 text-sm text-center text-muted-foreground">No clients found</div>
                  )}
                  <div
                    className="flex items-center gap-2 px-2 py-2 mt-1 border-t border-border/50 cursor-pointer text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-sm text-sm font-semibold"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsAddClientOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add New Client
                  </div>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amc-start-date">Start Date *</Label>
              <Input
                id="amc-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={dateInputClass}
                required
              />
              {startDate && (
                <p className="text-xs text-muted-foreground">{formatContractDate(startDate)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amc-end-date">End Date *</Label>
              <Input
                id="amc-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={dateInputClass}
                required
              />
              {endDate && (
                <p className="text-xs text-muted-foreground">{formatContractDate(endDate)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visit Frequency *</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as AmcFrequency)}>
                <SelectTrigger className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="e.g. HVAC Maintenance"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amc-total-visits">Total Visits</Label>
              <Input
                id="amc-total-visits"
                type="number"
                value={calculatedVisits}
                readOnly
                className={`${inputClass} bg-muted/50 cursor-default`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amc-amount">Contract Amount (₹)</Label>
              <Input
                id="amc-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contract notes or special terms..."
              className={`${inputClass} min-h-[80px]`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-pink-700 hover:bg-pink-800 text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {contract ? "Save Changes" : isRenewal ? "Renew Contract" : "Create Contract"}
            </Button>
          </div>
        </form>
      </DialogContent>

      <AmcBlockedModal
        isOpen={!!blockedContract}
        onClose={() => setBlockedContract(null)}
        existingContract={blockedContract}
        onRenew={(c) => {
          setBlockedContract(null);
          setRenewFromBlocked(c);
        }}
      />

      <ClientFormModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSuccess={(client) => {
          fetchClients();
          if (client.id) setClientId(client.id);
          setIsAddClientOpen(false);
        }}
        client={null}
      />
    </Dialog>
  );
}

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
import { Loader2, Search, UserPlus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { createMinorJobApi } from "../api/minorJob.api";
import { getClientsApi } from "../api/client.api";
import { getStaffApi } from "../api/staff.api";
import type { Client } from "../interfaces/client.interface";
import { ClientFormModal } from "../features/clients/ClientFormModal";
import { StaffSelectDropdown } from "./StaffSelectDropdown";

interface MinorJobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MinorJobFormModal({
  isOpen,
  onClose,
  onSuccess,
}: MinorJobFormModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);

  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");

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

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      getStaffApi({ limit: 200, activeOnly: true })
        .then((res) => {
          if (res.success) setStaffList(res.data);
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen, fetchClients]);

  useEffect(() => {
    if (isOpen) {
      setClientId("");
      setDescription("");
      setScheduledDate(new Date().toISOString().split("T")[0]);
      setSelectedStaffIds([]);
      setClientSearch("");
    }
  }, [isOpen]);

  const handleClientCreated = (created: Client) => {
    if (created.id) {
      setClients((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev;
        return [created, ...prev];
      });
      setClientId(created.id);
    }
    fetchClients();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedStaffNames = selectedStaffIds
        .map((id) => staffList.find((s) => (s.id || s._id) === id)?.fullName)
        .filter(Boolean);

      const payload = {
        clientRef: clientId,
        description: description.trim(),
        scheduledDate: new Date(scheduledDate).toISOString(),
        assignedTo: selectedStaffNames.join(", "),
        assignedStaffId: selectedStaffIds.join(", "),
      };

      const res = await createMinorJobApi(payload);
      if (res.success) {
        toast.success("Minor job created successfully");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create minor job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "border border-input bg-background text-foreground placeholder:text-muted-foreground";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-lg rounded-xl bg-card border border-border shadow-lg p-5 overflow-y-auto max-h-[90vh]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-1.5">
              <Wrench className="h-5 w-5 text-pink-700" />
              Create Minor Job
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-3">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select
                value={clientId}
                onValueChange={setClientId}
                disabled={loadingClients}
                onOpenChange={(open) => {
                  if (!open) setClientSearch("");
                }}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select client"} />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minorJobDateInput">Scheduled Date *</Label>
              <Input
                id="minorJobDateInput"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="[color-scheme:light] dark:[color-scheme:dark]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="minorJobDescInput">Description *</Label>
              <Textarea
                id="minorJobDescInput"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify job scope and details..."
                rows={3}
                required
              />
            </div>

            <div className="pt-1">
              <StaffSelectDropdown
                selected={selectedStaffIds}
                onChange={setSelectedStaffIds}
                label="Assign Staff"
                placement="bottom"
                nameById={staffList.reduce((acc, curr) => {
                  const id = curr.id || curr._id;
                  if (id) acc[id] = curr.fullName;
                  return acc;
                }, {} as Record<string, string>)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-9 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-700 hover:bg-pink-800 text-white font-semibold h-9 text-xs"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  "Create Job"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ClientFormModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSuccess={handleClientCreated}
      />
    </>
  );
}

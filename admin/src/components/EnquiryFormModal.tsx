import { useState, useEffect } from "react";
import { Search, UserPlus } from "lucide-react";
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
import { createEnquiryApi, updateEnquiryApi } from "../api/enquiry.api";
import { Enquiry, EnquiryPriority, EnquiryStatus } from "../interfaces/enquiry.interface";
import { Client } from "../interfaces/client.interface";
import { ClientFormModal } from "../features/clients/ClientFormModal";
import { StaffSelectDropdown } from "./StaffSelectDropdown";
import { useDebounce } from "../hooks/useDebounce";
import { toast } from "sonner";

const ENQUIRY_STATUSES: EnquiryStatus[] = [
  "Site Visit Scheduled",
  "Quotation Prepared",
  "Follow-up Required",
  "Converted to Project",
  "Converted to AMC",
  "Converted to Minor Job",
  "Closed",
];

interface EnquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  enquiry?: Enquiry | null;
  clients: Client[];
  onClientsRefresh: () => void;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function EnquiryFormModal({
  isOpen,
  onClose,
  onSuccess,
  enquiry = null,
  clients,
  onClientsRefresh,
}: EnquiryFormModalProps) {
  const isEdit = !!enquiry?.id;

  const [selectedClientId, setSelectedClientId] = useState("");
  const [enquiryDate, setEnquiryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<EnquiryStatus>("Follow-up Required");
  const [priority, setPriority] = useState<EnquiryPriority>("Medium");
  const [requirement, setRequirement] = useState("");
  const [description, setDescription] = useState("");
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);
  const [followUpDate, setFollowUpDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const debouncedClientSearch = useDebounce(clientSearch, 300);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (enquiry) {
      setSelectedClientId(enquiry.clientId);
      setEnquiryDate(toDateInputValue(enquiry.date));
      setStatus(enquiry.status);
      setPriority(enquiry.priority);
      setRequirement(enquiry.requirement);
      setDescription(enquiry.description);
      setAssignedStaffIds(enquiry.assignedStaffId ? [enquiry.assignedStaffId] : []);
      setFollowUpDate(toDateInputValue(enquiry.followUpDate));
    } else {
      setSelectedClientId("");
      setEnquiryDate(new Date().toISOString().split("T")[0]);
      setStatus("Follow-up Required");
      setPriority("Medium");
      setRequirement("");
      setDescription("");
      setAssignedStaffIds([]);
      setFollowUpDate("");
    }
    setClientSearch("");
  }, [isOpen, enquiry]);

  const filteredClients = clients.filter(
    (c) =>
      debouncedClientSearch === "" ||
      c.companyName.toLowerCase().includes(debouncedClientSearch.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(debouncedClientSearch.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId || (c as { _id?: string })._id === selectedClientId);
    if (!client) {
      toast.error("Please select a client");
      return;
    }
    if (!requirement.trim()) {
      toast.error("Requirement is required");
      return;
    }

    const clientId = client.id || (client as { _id?: string })._id || "";
    const payload = {
      date: new Date(enquiryDate).toISOString(),
      clientId,
      clientName: client.companyName,
      contactPerson: client.contactPerson,
      phone: client.phone,
      email: client.email || "",
      requirement: requirement.trim(),
      description: description.trim() || requirement.trim(),
      status,
      priority,
      assignedStaffId: assignedStaffIds[0] || "",
      assignedTo: "",
      followUpDate: followUpDate ? new Date(followUpDate).toISOString() : null,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && enquiry?.id) {
        const res = await updateEnquiryApi(enquiry.id, payload);
        if (res.success) {
          toast.success("Enquiry updated successfully");
          onSuccess();
          onClose();
        }
      } else {
        const res = await createEnquiryApi(payload);
        if (res.success) {
          toast.success("Enquiry created successfully");
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(isEdit ? "Failed to update enquiry" : "Failed to create enquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg bg-card border border-border shadow-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {isEdit ? `Edit Enquiry — ${enquiry?.enquiryNo}` : "Add New Enquiry"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Client *</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                  onOpenChange={(open) => { if (!open) setClientSearch(""); }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select client" />
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
                      <SelectItem key={c.id || (c as { _id?: string })._id} value={c.id || (c as { _id?: string })._id || ""}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                    {filteredClients.length === 0 && (
                      <div className="px-2 py-3 text-sm text-center text-muted-foreground">No clients found</div>
                    )}
                    <div
                      className="flex items-center gap-2 px-2 py-2 mt-1 border-t border-border/50 cursor-pointer text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-sm text-sm font-semibold"
                      onMouseDown={(e) => { e.preventDefault(); setIsAddClientModalOpen(true); }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add New Client
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="enquiryDate">Enquiry Date *</Label>
                <Input
                  id="enquiryDate"
                  type="date"
                  value={enquiryDate}
                  onChange={(e) => setEnquiryDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Status *</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as EnquiryStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENQUIRY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority *</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as EnquiryPriority)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="requirement">Requirement *</Label>
                <Input
                  id="requirement"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Brief requirement title"
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <StaffSelectDropdown
                  selected={assignedStaffIds}
                  onChange={(ids) => setAssignedStaffIds(ids.slice(-1))}
                  label="Assign To"
                  placement="top"
                  nameById={
                    enquiry?.assignedStaffId && enquiry.assignedTo
                      ? { [enquiry.assignedStaffId]: enquiry.assignedTo }
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-700 hover:bg-pink-800 text-white font-semibold"
              >
                {isSubmitting ? "Saving..." : isEdit ? "Update Enquiry" : "Save Enquiry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ClientFormModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        client={null}
        onSuccess={(newClient: Client) => {
          onClientsRefresh();
          const newId = (newClient as { _id?: string })._id || newClient.id;
          if (newId) setSelectedClientId(newId);
          toast.success(`Client "${newClient.companyName}" added`);
          setIsAddClientModalOpen(false);
        }}
      />
    </>
  );
}

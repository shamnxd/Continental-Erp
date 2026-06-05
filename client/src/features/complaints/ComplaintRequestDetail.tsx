import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Inbox, CheckCircle2, ChevronRight, Search, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import { RemarksPanel } from "../../components/RemarksPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { TableStatusBadge } from "../../components/tableCells";
import {
  getComplaintRequestByIdApi,
  addComplaintRequestRemarkApi,
  convertComplaintRequestApi,
  rejectComplaintRequestApi,
  ComplaintRequest,
} from "../../api/complaintRequest.api";
import { getClientsApi } from "../../api/client.api";

export function ComplaintRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ComplaintRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newRemark, setNewRemark] = useState("");
  const [isEditingRemark, setIsEditingRemark] = useState(false);

  // Conversion Form State
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [expectedResolution, setExpectedResolution] = useState("");
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequestDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await getComplaintRequestByIdApi(id);
      if (res.success) {
        setRequest(res.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load complaint request details");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await getClientsApi({ page: 1, limit: 300 });
      if (res.success) {
        setClients(res.data.map(c => ({ id: c.id || "", companyName: c.companyName })));
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  }, []);

  useEffect(() => {
    fetchRequestDetails();
    fetchClients();
  }, [fetchRequestDetails, fetchClients]);

  const handleReject = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to reject this complaint request?")) return;
    setIsSubmitting(true);
    try {
      const res = await rejectComplaintRequestApi(id);
      if (res.success) {
        toast.success("Request rejected successfully");
        fetchRequestDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !id) return;
    if (!selectedClientId) {
      toast.error("Please select a client to link the complaint.");
      return;
    }
    if (!expectedResolution) {
      toast.error("Expected resolution date is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await convertComplaintRequestApi(id, {
        clientId: selectedClientId,
        priority,
        expectedResolution,
        assignedStaffIds,
      });

      if (res.success) {
        toast.success(`Converted successfully! Official Complaint: ${res.data.complaint.complaintNo}`);
        fetchRequestDetails();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to convert request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRemark = async () => {
    if (!request || !newRemark.trim() || !id) return;
    try {
      const res = await addComplaintRequestRemarkApi(id, newRemark.trim());
      if (res.success) {
        setRequest(res.data);
        setNewRemark("");
        toast.success("Remark added successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add remark");
    }
  };

  const statusTone = (s: string): "amber" | "green" | "red" | "muted" => {
    if (s === "Pending") return "amber";
    if (s === "Converted") return "green";
    if (s === "Rejected") return "red";
    return "muted";
  };

  const filteredClients = clients.filter(c =>
    c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground font-semibold">
        Fetching customer complaint request details...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-muted-foreground font-semibold">
        <p>Complaint request not found.</p>
        <Button onClick={() => navigate("/customer-complaints")}>Back to Requests</Button>
      </div>
    );
  }

  const remarksList = (request.remarks || []).map((r, i) => ({
    id: r.id || String(i),
    user: r.user,
    date: r.date,
    text: r.text,
  }));

  const refCode = request.id ? `REF-${String(request.id).slice(-6).toUpperCase()}` : "REF-PENDING";

  return (
    <div className="space-y-4 pb-8">
      <Tabs defaultValue="details" className="space-y-4">
        {/* Header Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/customer-complaints")}
                className="gap-2 h-9 px-3 hover:bg-muted shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Back</span>
              </Button>
              <div className="h-8 w-px bg-border hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-full bg-pink-50 flex items-center justify-center shrink-0 border border-pink-100 shadow-sm text-pink-700 font-extrabold">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate leading-tight flex items-center gap-2">
                    <span>{refCode}</span>
                    <span className="text-xs font-mono font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {request.id}
                    </span>
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Submitted by {request.clientName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-xs text-muted-foreground mr-1">Status:</span>
              <TableStatusBadge label={request.status} tone={statusTone(request.status)} />
            </div>
          </div>

          {/* Navigation Tabs Header */}
          <div className="px-4 sm:px-6">
            <TabsList className="w-fit h-12 bg-transparent p-0 rounded inline-flex flex-nowrap justify-start gap-6 lg:gap-8">
              <TabsTrigger
                value="details"
                className="flex-none w-auto h-full shrink-0 rounded border-0 !border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 text-xs font-bold uppercase tracking-wider transition-all hover:text-primary"
              >
                Details & Review
              </TabsTrigger>
              <TabsTrigger
                value="remarks"
                className="flex-none w-auto h-full shrink-0 rounded border-0 !border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 text-xs font-bold uppercase tracking-wider transition-all hover:text-primary"
              >
                Remarks ({remarksList.length})
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Col: Customer Submitted Information */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                  <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                    <Inbox className="h-4.5 w-4.5 text-pink-700" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Customer Submitted Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Client / Company Name</span>
                    <span className="font-semibold text-foreground">{request.clientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Person</span>
                    <span className="font-semibold text-foreground">{request.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Phone</span>
                    <span className="font-semibold text-foreground">{request.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Email</span>
                    <span className="font-semibold text-foreground">{request.email || "—"}</span>
                  </div>
                </div>

                <div className="text-sm pt-3 border-t border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Site Location / Address</span>
                  <span className="text-foreground">{request.location}</span>
                </div>

                <div className="text-sm pt-3 border-t border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Issue / Subject</span>
                  <span className="font-bold text-foreground text-base leading-snug">{request.issue}</span>
                </div>

                <div className="text-sm pt-3 border-t border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Full Problem Description</span>
                  <p className="mt-1 text-muted-foreground text-sm leading-relaxed whitespace-pre-line bg-muted/20 p-3 rounded-lg border border-border/50">
                    {request.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: Conversion action panel */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                {request.status === "Pending" ? (
                  <form onSubmit={handleConvert} className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Link & Convert</h3>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientId" className="text-sm font-medium text-foreground">
                        Link Registered Client *
                      </Label>
                      
                      {/* Simple search filter input */}
                      <div className="relative mb-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search system clients..."
                          className="w-full pl-8 pr-2 py-1.5 text-xs border border-border rounded-md bg-background text-foreground"
                        />
                      </div>
                      
                      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground">
                          <SelectValue placeholder="Select Client to Link..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredClients.length === 0 ? (
                            <SelectItem value="none" disabled>No clients found</SelectItem>
                          ) : (
                            filteredClients.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.companyName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium text-foreground">
                        Priority *
                      </Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedResolution" className="text-sm font-medium text-foreground">
                        Expected Resolution *
                      </Label>
                      <input
                        id="expectedResolution"
                        type="date"
                        value={expectedResolution}
                        onChange={(e) => setExpectedResolution(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-foreground text-sm"
                      />
                    </div>

                    <div className="pt-2">
                      <StaffSelectDropdown
                        selected={assignedStaffIds}
                        onChange={setAssignedStaffIds}
                        label="Assign Staff / Technicians"
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-border">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-pink-700 hover:bg-pink-805 text-white font-semibold h-10"
                      >
                        {isSubmitting ? "Converting..." : "Convert to Complaint"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={handleReject}
                        className="w-full border-red-200 text-red-650 hover:bg-red-50 hover:text-red-700"
                      >
                        Reject Request
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4.5 w-4.5 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Request Details</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Status:</span>
                        <span className="font-semibold">{request.status}</span>
                      </div>
                      {request.convertedComplaintId && (
                        <div className="pt-2 border-t border-border flex flex-col gap-2">
                          <span className="text-muted-foreground">Linked Complaint ID:</span>
                          <span className="font-mono text-pink-750 font-bold bg-pink-50 p-2 rounded block break-all text-xs">
                            {request.convertedComplaintId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* REMARKS TAB */}
        <TabsContent value="remarks" className="m-0">
          <RemarksPanel
            remarks={remarksList}
            newRemark={newRemark}
            onNewRemarkChange={setNewRemark}
            onAddRemark={handleAddRemark}
            disabled={request.status !== "Pending"}
            emptyMessage="No follow-up remarks recorded for this request."
            placeholder="Add a remark regarding request follow-up..."
            sectionTitle="Add Follow-up Remark"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

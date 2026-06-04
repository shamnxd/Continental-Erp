import { useState, useEffect, useCallback } from "react";
import { getComplaintRequestsApi, rejectComplaintRequestApi, convertComplaintRequestApi, ComplaintRequest } from "../../api/complaintRequest.api";
import { getClientsApi } from "../../api/client.api";
import { toast } from "sonner";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import {
  TablePrimarySecondary,
  TableStatusBadge,
  tableCellClass,
} from "../../components/tableCells";
import { useDebounce } from "../../hooks/useDebounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Inbox, CheckCircle2, XCircle, Clock, Search, ChevronRight } from "lucide-react";

const PAGE_SIZE = 15;

const statusTone = (s: string): "amber" | "green" | "red" | "muted" => {
  if (s === "Pending") return "amber";
  if (s === "Converted") return "green";
  if (s === "Rejected") return "red";
  return "muted";
};

export function ComplaintRequests() {
  const [requests, setRequests] = useState<ComplaintRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ComplaintRequest | null>(null);

  // Conversion Form State
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [expectedResolution, setExpectedResolution] = useState("");
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getComplaintRequestsApi({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
      });
      if (response.success) {
        setRequests(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load complaint requests");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  const fetchClients = async () => {
    try {
      const res = await getClientsApi({ page: 1, limit: 300 });
      if (res.success) {
        setClients(res.data.map(c => ({ id: c.id || "", companyName: c.companyName })));
      }
    } catch (err) {
      console.error("Failed to fetch clients", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchClients();
  }, []);

  const handleReject = async (id: string) => {
    if (!window.confirm("Are you sure you want to reject this complaint request?")) return;
    setIsSubmitting(true);
    try {
      const res = await rejectComplaintRequestApi(id);
      if (res.success) {
        toast.success("Request rejected successfully");
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
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
      const res = await convertComplaintRequestApi(selectedRequest.id, {
        clientId: selectedClientId,
        priority,
        expectedResolution,
        assignedStaffIds,
      });

      if (res.success) {
        toast.success(`Converted successfully! Official Complaint: ${res.data.complaint.complaintNo}`);
        setSelectedRequest(null);
        // Reset conversion form
        setSelectedClientId("");
        setPriority("Medium");
        setExpectedResolution("");
        setAssignedStaffIds([]);
        fetchRequests();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to convert request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<ComplaintRequest>[] = [
    {
      header: "When",
      accessor: (row) => {
        const d = new Date(row.createdAt);
        const datePart = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const timePart = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        return <TablePrimarySecondary primary={datePart} secondary={timePart} />;
      },
      className: tableCellClass.medium,
    },
    {
      header: "Customer",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.clientName} secondary={row.phone} />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Contact Person",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.contactPerson} secondary={row.email || "No email"} />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Issue / Subject",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={row.issue}
          secondary={row.description}
          secondaryClassName="text-xs text-muted-foreground line-clamp-1 max-w-[280px]"
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Status",
      accessor: (row) => <TableStatusBadge label={row.status} tone={statusTone(row.status)} />,
      className: tableCellClass.narrow,
    },
  ];

  // Filter clients dynamically by user input
  const filteredClients = clients.filter(c =>
    c.companyName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <>
      <ManagementListPage
        title="Unverified Complaint Requests"
        subtitle="Review and convert incoming customer submitted complaints"
        searchPlaceholder="Search requests..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { value: "Pending", label: "Pending Review", count: statusFilter === "Pending" ? total : undefined, tone: "amber" },
          { value: "Converted", label: "Converted", count: statusFilter === "Converted" ? total : undefined, tone: "green" },
          { value: "Rejected", label: "Rejected", count: statusFilter === "Rejected" ? total : undefined, tone: "red" },
          { value: "all", label: "All Requests", count: statusFilter === "all" ? total : undefined, tone: "primary" },
        ]}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        columns={columns}
        data={requests}
        isLoading={isLoading}
        onRowClick={setSelectedRequest}
        emptyMessage="No complaint requests found."
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="complaint requests"
      />

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-2xl p-6 border-0 shadow-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Inbox className="h-5 w-5 text-pink-700" />
              Review Complaint Request
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 pt-4">
              {/* Submitted Information Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-pink-700 uppercase tracking-widest">Submitted Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Client / Company</span>
                    <span className="font-semibold text-slate-800">{selectedRequest.clientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Person</span>
                    <span className="font-semibold text-slate-800">{selectedRequest.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                    <span className="font-semibold text-slate-800">{selectedRequest.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                    <span className="font-semibold text-slate-800">{selectedRequest.email || "—"}</span>
                  </div>
                </div>
                <div className="text-sm pt-1 border-t border-slate-200/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Site Location</span>
                  <span className="text-slate-700">{selectedRequest.location}</span>
                </div>
                <div className="text-sm pt-1 border-t border-slate-200/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Issue Title</span>
                  <span className="font-semibold text-slate-800">{selectedRequest.issue}</span>
                </div>
                <div className="text-sm pt-1 border-t border-slate-200/50">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Description</span>
                  <span className="text-slate-700 whitespace-pre-wrap">{selectedRequest.description}</span>
                </div>
              </div>

              {selectedRequest.status === "Pending" ? (
                /* Conversion Form */
                <form onSubmit={handleConvert} className="space-y-4 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-pink-700 uppercase tracking-widest flex items-center gap-1">
                    <ChevronRight className="h-4 w-4" />
                    Convert to Operational Complaint
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="clientId" className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Link Registered Client <span className="text-pink-600">*</span>
                    </Label>
                    
                    {/* Simple search filter input */}
                    <div className="relative mb-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Search system clients..."
                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-border rounded-md bg-background"
                      />
                    </div>
                    
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger className="w-full h-10 px-3 rounded-lg border border-border">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="priority" className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Priority <span className="text-pink-600">*</span>
                      </Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="w-full h-10 px-3 rounded-lg border border-border">
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

                    <div className="space-y-1.5">
                      <Label htmlFor="expectedResolution" className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Expected Resolution <span className="text-pink-600">*</span>
                      </Label>
                      <input
                        id="expectedResolution"
                        type="date"
                        value={expectedResolution}
                        onChange={(e) => setExpectedResolution(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-lg border border-border text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <StaffSelectDropdown
                      selected={assignedStaffIds}
                      onChange={setAssignedStaffIds}
                      label="Assign Support Staff / Technician"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => handleReject(selectedRequest.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Reject Request
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedRequest(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-pink-700 hover:bg-pink-800 text-white font-semibold"
                      >
                        {isSubmitting ? "Converting..." : "Convert to Complaint"}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Read-only historical status information */
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Processed Status:</span>
                    <TableStatusBadge label={selectedRequest.status} tone={statusTone(selectedRequest.status)} />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedRequest(null)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

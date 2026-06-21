import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Eye, AlertCircle, Calendar, MapPin,
  ChevronLeft, ChevronRight, UserPlus, MoreVertical, Loader2,
} from "lucide-react";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import { Textarea } from "../../components/ui/textarea";
import { getComplaintsApi, createComplaintApi, getComplaintsStatsApi } from "../../api/complaint.api";
import { getClientsApi } from "../../api/client.api";
import { Complaint } from "../../interfaces/complaint.interface";
import { Client } from "../../interfaces/client.interface";
import { toast } from "sonner";
import { ClientFormModal } from "../clients/ClientFormModal";
import { useDebounce } from "../../hooks/useDebounce";
import { ManagementListPage } from "../../components/ManagementListPage";

type StatusFilter = "all" | "Pending" | "In Progress" | "Resolved" | "Critical";

const filterLabels: Record<StatusFilter, string> = {
  all: "All",
  Pending: "Pending",
  "In Progress": "In Progress",
  Resolved: "Resolved",
  Critical: "Critical Priority",
};

const PAGE_SIZE = 10;

export function Complaints() {
  const navigate = useNavigate();

  // ── Table / List State ────────────────────────────────────────────────
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");

  // ── Stats ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
  });

  // ── Register Dialog State ─────────────────────────────────────────────
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [complaintDate, setComplaintDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState("Medium");
  const [location, setLocation] = useState("");
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTechnicians, setAssignedTechnicians] = useState<string[]>([]);
  const [expectedResolution, setExpectedResolution] = useState("");

  // Client dropdown search (debounced, client-side)
  const [clientSearch, setClientSearch] = useState("");
  const debouncedClientSearch = useDebounce(clientSearch, 300);

  // Add New Client modal
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const lastFetchRef = useRef({ page: 1, search: "", filter: "all" });

  // ── Fetch Stat Counts ─────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const response = await getComplaintsStatsApi();
      if (response.success) {
        setStats({
          total: response.data.total ?? 0,
          pending: response.data.pending ?? 0,
          inProgress: response.data.inProgress ?? 0,
          resolved: response.data.resolved ?? 0,
          critical: response.data.critical ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch complaint stats:", err);
    }
  }, []);

  // ── Fetch Complaints ──────────────────────────────────────────────────
  const fetchComplaints = useCallback(async (page: number, search: string, filter: StatusFilter) => {
    setIsLoading(true);
    try {
      const statusParam =
        filter === "all" ? undefined
        : filter === "Critical" ? undefined   // Critical is a priority filter
        : filter;
      const priorityParam = filter === "Critical" ? "Critical" : undefined;

      const res = await getComplaintsApi({
        search: search || undefined,
        status: statusParam,
        priority: priorityParam,
        page,
        limit: PAGE_SIZE,
      });

      if (res.success) {
        setComplaints(res.data);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load complaints");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Fetch Clients for dropdown ────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    try {
      const res = await getClientsApi({ page: 1, limit: 200 });
      if (res.success) setClients(res.data);
    } catch (err) {
      console.error("Failed to load clients list", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (isAddDialogOpen) {
      fetchClients();
    }
  }, [isAddDialogOpen, fetchClients]);

  useEffect(() => {
    const isSearchFilterChange = debouncedSearch !== lastFetchRef.current.search || activeFilter !== lastFetchRef.current.filter;

    if (isSearchFilterChange) {
      if (currentPage !== 1) {
        setCurrentPage(1);
        return; // Page change effect will handle the load
      }
    }

    fetchComplaints(currentPage, debouncedSearch, activeFilter);
    lastFetchRef.current = { page: currentPage, search: debouncedSearch, filter: activeFilter };
  }, [currentPage, debouncedSearch, activeFilter, fetchComplaints]);

  // Auto-populate location from selected client
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === selectedClientId || (c as any)._id === selectedClientId);
      if (client) {
        const clientLoc = client.address ? `${client.address}, ${client.city}` : client.city;
        setLocation(clientLoc || "");
      }
    } else {
      setLocation("");
    }
  }, [selectedClientId, clients]);

  // ── Register Complaint ────────────────────────────────────────────────
  const resetForm = () => {
    setSelectedClientId("");
    setIssue("");
    setDescription("");
    setLocation("");
    setExpectedResolution("");
    setPriority("Medium");
    setAssignedTechnicians([]);
    setComplaintDate(new Date().toISOString().split("T")[0]);
  };

  const handleRegisterComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === selectedClientId || (c as any)._id === selectedClientId);
    if (!client) { toast.error("Please select a valid client"); return; }
    if (!location.trim() || !issue.trim() || !description.trim() || !expectedResolution) {
      toast.error("All fields marked with * are required"); return;
    }
    try {
      const res = await createComplaintApi({
        date: new Date(complaintDate).toISOString(),
        clientId: selectedClientId,
        clientName: client.companyName,
        contactPerson: client.contactPerson,
        phone: client.phone,
        issue,
        description,
        priority: priority as any,
        status: "Pending" as any,
        assignedStaffIds: assignedTechnicians,
        location,
        expectedResolution: new Date(expectedResolution).toISOString(),
        remarks: [],
      });
      if (res.success) {
        toast.success("Complaint registered successfully!");
        setIsAddDialogOpen(false);
        resetForm();
        fetchComplaints(1, debouncedSearch, activeFilter);
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to register complaint");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Resolved: "bg-green-500/10 text-green-600 dark:text-green-400",
      "In Progress": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${map[status] ?? "bg-muted text-muted-foreground"}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (p: string) => {
    const map: Record<string, string> = {
      Critical: "bg-red-500 text-white",
      High: "bg-red-500/10 text-red-600 dark:text-red-400",
      Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      Low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${map[p] ?? "bg-muted text-muted-foreground"}`}>
        {p}
      </span>
    );
  };

  const priorityBorderColor = (p: string) => {
    if (p === "Critical") return "#ef4444";
    if (p === "High") return "#f97316";
    if (p === "Medium") return "#f59e0b";
    return "#10b981";
  };

  // ── Filtered clients for dropdown ─────────────────────────────────────
  const filteredClients = clients.filter(c =>
    debouncedClientSearch === "" ||
    c.companyName.toLowerCase().includes(debouncedClientSearch.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(debouncedClientSearch.toLowerCase())
  );

  const filterChips = [
    { value: "all" as StatusFilter, label: "Total", count: stats.total, tone: "primary" as const },
    { value: "Pending" as StatusFilter, label: "Pending", count: stats.pending, tone: "amber" as const },
    { value: "In Progress" as StatusFilter, label: "In Progress", count: stats.inProgress, tone: "blue" as const },
    { value: "Resolved" as StatusFilter, label: "Resolved", count: stats.resolved, tone: "green" as const },
    { value: "Critical" as StatusFilter, label: "Critical", count: stats.critical, tone: "red" as const },
  ];

  // ── Table Columns ─────────────────────────────────────────────────────
  const columns = [
    {
      header: "Complaint No.",
      accessor: (c: Complaint) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground leading-tight truncate">{c.complaintNo}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {new Date(c.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
      ),
      className: "px-4 py-4 w-[130px]",
    },
    {
      header: "Client",
      accessor: (c: Complaint) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 border border-border shadow-sm bg-muted flex items-center justify-center">
            {c.clientLogoUrl ? (
              <img
                src={c.clientLogoUrl}
                alt={c.clientName}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(c.clientName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                alt={c.clientName}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground leading-tight truncate max-w-[120px]">{c.clientName}</p>
            {c.contactPerson && <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">{c.contactPerson}</p>}
          </div>
        </div>
      ),
      className: "px-4 py-4 w-[160px]",
    },
    {
      header: "Issue",
      accessor: (c: Complaint) => (
        <div className="flex items-start gap-1.5 min-w-0">
          <AlertCircle className="h-3.5 w-3.5 text-pink-600 shrink-0 mt-0.5" />
          <span className="text-sm text-foreground line-clamp-2 leading-snug break-words">{c.issue}</span>
        </div>
      ),
      className: "px-4 py-4 w-[200px] max-w-[200px]",
    },
    {
      header: "Location",
      accessor: (c: Complaint) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-sm text-muted-foreground truncate max-w-[110px]">{c.location}</span>
        </div>
      ),
      className: "px-4 py-4 w-[150px]",
    },
    {
      header: "Priority",
      accessor: (c: Complaint) => getPriorityBadge(c.priority),
      className: "px-4 py-4 w-[90px]",
    },
    {
      header: "Status",
      accessor: (c: Complaint) => getStatusBadge(c.status),
      className: "px-4 py-4 w-[110px]",
    },
    {
      header: "Exp. Resolution",
      accessor: (c: Complaint) => (
        <div className="flex items-center gap-1.5 text-sm text-pink-600 font-medium whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {new Date(c.expectedResolution).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      ),
      className: "px-4 py-4 w-[130px]",
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "px-4 py-4 text-right w-[52px]",
      accessor: (c: Complaint) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              onClick={() => navigate(`/complaints/${c.id || (c as any)._id}`)}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4 text-blue-500" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <ManagementListPage
        title="Complaint Management"
        subtitle="Track and resolve customer complaints"
        headerAction={
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold">
              <Plus className="h-4 w-4" />
              Register Complaint
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg bg-card border border-border shadow-lg p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Register New Complaint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegisterComplaint} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Client dropdown with search */}
                <div>
                  <Label htmlFor="clientDropdown">Client *</Label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                    onOpenChange={(open) => { if (!open) setClientSearch(""); }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select client from system" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Search input */}
                      <div className="px-2 py-2 border-b border-border/50">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <input
                            type="text"
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            placeholder="Search clients..."
                            className="w-full pl-7 pr-2 py-1.5 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 placeholder:text-muted-foreground"
                          />
                        </div>
                      </div>

                      {/* Filtered list */}
                      {filteredClients.map((c) => (
                        <SelectItem key={c.id || (c as any)._id} value={c.id || (c as any)._id}>
                          {c.companyName}
                          {c.contactPerson && (
                            <span className="text-muted-foreground text-xs ml-1">— {c.contactPerson}</span>
                          )}
                        </SelectItem>
                      ))}

                      {filteredClients.length === 0 && (
                        <div className="px-2 py-3 text-sm text-center text-muted-foreground">No clients found</div>
                      )}

                      {/* Add New Client */}
                      <div
                        className="flex items-center gap-2 px-2 py-2 mt-1 border-t border-border/50 cursor-pointer text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-sm text-sm font-semibold transition-colors"
                        onMouseDown={(e) => { e.preventDefault(); setIsAddClientModalOpen(true); }}
                      >
                        <UserPlus className="h-4 w-4" />
                        Add New Client
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="complaintDate">Complaint Date *</Label>
                  <Input id="complaintDate" type="date" value={complaintDate} onChange={(e) => setComplaintDate(e.target.value)} className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">Location / Area</Label>
                  <Input id="location" value={location} disabled placeholder="Auto-populated from client" className="mt-1 bg-muted/40 text-muted-foreground cursor-not-allowed font-medium" />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="issue">Issue Title *</Label>
                  <Input id="issue" value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Brief complaint title e.g. Split AC low cooling" className="mt-1" />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide details about the faulty unit or issues..." className="mt-1" rows={3} />
                </div>

                <div className="md:col-span-2">
                  <StaffSelectDropdown
                    selected={assignedTechnicians}
                    onChange={setAssignedTechnicians}
                    label="Assign Staff"
                    placement="top"
                  />
                </div>

                <div>
                  <Label htmlFor="expectedResolution">Expected Resolution *</Label>
                  <Input id="expectedResolution" type="date" value={expectedResolution} onChange={(e) => setExpectedResolution(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
                <Button type="button" variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" className="bg-pink-700 hover:bg-pink-800 text-white font-semibold">Register Complaint</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        }
        searchPlaceholder="Search by complaint no., client, issue…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterChips}
        filterValue={activeFilter}
        onFilterChange={setActiveFilter}
        activeFilterLabel={activeFilter !== "all" ? filterLabels[activeFilter] : undefined}
        onClearFilter={() => setActiveFilter("all")}
        columns={columns}
        data={complaints}
        isLoading={isLoading}
        rowKey={(c) => c.id || (c as { _id?: string })._id || c.complaintNo}
        onRowClick={(c) => navigate(`/complaints/${c.id || (c as { _id?: string })._id}`)}
        emptyMessage="No complaints found"
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="complaints"
      />

      <ClientFormModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        client={null}
        onSuccess={(newClient: Client) => {
          fetchClients().then(() => {
            const newId = (newClient as { _id?: string })._id || newClient.id;
            if (newId) setSelectedClientId(newId);
          });
          toast.success(`Client "${newClient.companyName}" added and selected!`);
          setIsAddClientModalOpen(false);
        }}
      />
    </>
  );
}

export const mockComplaints: any[] = [];

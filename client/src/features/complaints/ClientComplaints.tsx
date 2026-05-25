import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Search, AlertCircle, Calendar, MapPin, Eye,
  Filter, ChevronLeft, ChevronRight, MoreVertical, Loader2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import { getComplaintsApi } from "../../api/complaint.api";
import { getClientByIdApi } from "../../api/client.api";
import { Complaint } from "../../interfaces/complaint.interface";
import { Client } from "../../interfaces/client.interface";
import { ReusableTable } from "../../components/ReusableTable";
import { toast } from "sonner";
import { useDebounce } from "../../hooks/useDebounce";

type StatusFilter = "all" | "Pending" | "In Progress" | "Resolved";

const filterLabels: Record<StatusFilter, string> = {
  all: "All",
  Pending: "Pending",
  "In Progress": "In Progress",
  Resolved: "Resolved",
};

const PAGE_SIZE = 10;

export function ClientComplaints() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");

  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });

  // ── Fetch client info ─────────────────────────────────────────────────
  useEffect(() => {
    if (!clientId) return;
    getClientByIdApi(clientId)
      .then((res) => { if (res.success) setClient(res.data); })
      .catch(() => toast.error("Failed to load client info"));
  }, [clientId]);

  // ── Fetch stats ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!clientId) return;
    Promise.all([
      getComplaintsApi({ clientId, page: 1, limit: 1 }),
      getComplaintsApi({ clientId, page: 1, limit: 1, status: "Pending" }),
      getComplaintsApi({ clientId, page: 1, limit: 1, status: "In Progress" }),
      getComplaintsApi({ clientId, page: 1, limit: 1, status: "Resolved" }),
    ]).then(([allRes, pendRes, ipRes, resolvedRes]) => {
      setStats({
        total: allRes.total ?? 0,
        pending: pendRes.total ?? 0,
        inProgress: ipRes.total ?? 0,
        resolved: resolvedRes.total ?? 0,
      });
    }).catch(console.error);
  }, [clientId]);

  // ── Fetch complaints ──────────────────────────────────────────────────
  const fetchComplaints = useCallback(async (page: number, search: string, filter: StatusFilter) => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      const res = await getComplaintsApi({
        clientId,
        search: search || undefined,
        status: filter === "all" ? undefined : filter,
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
  }, [clientId]);

  useEffect(() => {
    fetchComplaints(currentPage, debouncedSearch, activeFilter);
  }, [currentPage, debouncedSearch, activeFilter, fetchComplaints]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeFilter]);

  // ── Helpers ───────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Resolved: "bg-green-500/10 text-green-600",
      "In Progress": "bg-blue-500/10 text-blue-600",
      Pending: "bg-amber-500/10 text-amber-600",
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
      High: "bg-red-500/10 text-red-600",
      Medium: "bg-amber-500/10 text-amber-600",
      Low: "bg-blue-500/10 text-blue-600",
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

  // ── Stat cards (clickable filters) ───────────────────────────────────
  const statCards = [
    { label: "Total", value: stats.total, color: "text-foreground", filter: "all" as StatusFilter, bg: activeFilter === "all" ? "bg-primary/5 ring-1 ring-primary/20" : "bg-card" },
    { label: "Pending", value: stats.pending, color: "text-amber-500", filter: "Pending" as StatusFilter, bg: activeFilter === "Pending" ? "bg-amber-500/10 ring-1 ring-amber-500/30" : "bg-card" },
    { label: "In Progress", value: stats.inProgress, color: "text-blue-500", filter: "In Progress" as StatusFilter, bg: activeFilter === "In Progress" ? "bg-blue-500/10 ring-1 ring-blue-500/30" : "bg-card" },
    { label: "Resolved", value: stats.resolved, color: "text-green-500", filter: "Resolved" as StatusFilter, bg: activeFilter === "Resolved" ? "bg-green-500/10 ring-1 ring-green-500/30" : "bg-card" },
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

  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <div className="space-y-4">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 h-9 px-3 hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Back</span>
          </Button>
          <div className="h-8 w-px bg-border hidden sm:block shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {client ? client.companyName : "Client"} — Complaints
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {client ? `${client.contactPerson} · ${client.phone}` : "Previous complaint history"}
            </p>
          </div>
        </div>

        {client && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 font-semibold"
            onClick={() => navigate(`/clients/${clientId}`)}
          >
            View Profile
          </Button>
        )}
      </div>

      {/* ── Stat Cards (clickable filters) ─────────────────────────── */}
      <div className="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => setActiveFilter(card.filter)}
            className={`rounded-lg shadow-sm border border-border p-3 sm:p-4 text-left transition-all cursor-pointer hover:shadow-md ${card.bg} ${activeFilter === card.filter ? "shadow-md" : ""}`}
          >
            <p className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-tight">{card.label}</p>
            <div className={`text-xl sm:text-2xl font-bold mt-1 ${card.color}`}>{card.value}</div>
          </button>
        ))}
      </div>

      {/* ── Search + Filter Tabs ────────────────────────────────────── */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by complaint no., issue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(filterLabels) as StatusFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                activeFilter === key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {key !== "all" && <Filter className="h-3 w-3" />}
              {filterLabels[key]}
              {key === "Pending" && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeFilter === key ? "bg-white/20" : "bg-border"}`}>{stats.pending}</span>}
              {key === "In Progress" && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeFilter === key ? "bg-white/20" : "bg-border"}`}>{stats.inProgress}</span>}
              {key === "Resolved" && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeFilter === key ? "bg-white/20" : "bg-border"}`}>{stats.resolved}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Container ─────────────────────────────────────────── */}
      <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">

        {/* Result count bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground min-w-0 truncate">
            {isLoading ? "Loading..." : total === 0 ? "No complaints found" : (
              <>
                Showing <span className="font-medium text-foreground">{startItem}–{endItem}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span> complaints
                {activeFilter !== "all" && (
                  <span className="hidden sm:inline ml-1">
                    — filtered by <span className="text-primary font-medium">{filterLabels[activeFilter]}</span>
                  </span>
                )}
              </>
            )}
          </p>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors underline shrink-0"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <ReusableTable
            data={complaints}
            columns={columns}
            isLoading={isLoading}
            rowKey={(c) => c.id || (c as any)._id || c.complaintNo}
            onRowClick={(c) => navigate(`/complaints/${c.id || (c as any)._id}`)}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <p className="text-sm">No complaints found</p>
                {activeFilter !== "all" && (
                  <button onClick={() => setActiveFilter("all")} className="mt-2 text-xs text-primary hover:underline">
                    Clear filter
                  </button>
                )}
              </div>
            }
          />
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <span className="text-sm">Loading complaints...</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No complaints found</p>
              {activeFilter !== "all" && (
                <button onClick={() => setActiveFilter("all")} className="mt-2 text-xs text-primary hover:underline">Clear filter</button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {complaints.map((c) => (
                <div
                  key={c.id || (c as any)._id}
                  className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer border-l-4"
                  style={{ borderLeftColor: priorityBorderColor(c.priority) }}
                  onClick={() => navigate(`/complaints/${c.id || (c as any)._id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-tight">{c.complaintNo}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(c.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {getStatusBadge(c.status)}
                      {getPriorityBadge(c.priority)}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-foreground font-medium line-clamp-1">{c.issue}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />{c.location}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-pink-600 font-medium">
                      <Calendar className="h-3 w-3" />
                      {new Date(c.expectedResolution).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
              Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 5) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | "...")[]>((acc, page, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === "number" && (page as number) - (arr[idx - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
                    ) : (
                      <Button key={item} variant={currentPage === item ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(item as number)} className="h-8 w-8 p-0 text-xs">
                        {item}
                      </Button>
                    )
                  )}
              </div>

              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

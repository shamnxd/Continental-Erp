import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  XCircle,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/alert-dialog";
import { getEnquiriesApi, deleteEnquiryApi, updateEnquiryApi, getEnquiriesStatsApi } from "../../api/enquiry.api";
import { getClientsApi } from "../../api/client.api";
import { Enquiry, EnquiryStatus } from "../../interfaces/enquiry.interface";
import { Client } from "../../interfaces/client.interface";
import { toast } from "sonner";
import { useDebounce } from "../../hooks/useDebounce";
import { ManagementListPage } from "../../components/ManagementListPage";
import { EnquiryFormModal } from "../../components/EnquiryFormModal";

type StatusFilter = "all" | EnquiryStatus;

const PAGE_SIZE = 10;

export function Enquiries() {
  const navigate = useNavigate();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");

  const [stats, setStats] = useState({
    total: 0,
    siteVisit: 0,
    quotation: 0,
    followUp: 0,
    converted: 0,
    closed: 0,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editEnquiry, setEditEnquiry] = useState<Enquiry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [closeId, setCloseId] = useState<string | null>(null);

  const lastFetchRef = useRef({ page: 1, search: "", filter: "all" });

  const fetchStats = useCallback(async () => {
    try {
      const response = await getEnquiriesStatsApi();
      if (response.success) {
        setStats({
          total: response.data.total ?? 0,
          siteVisit: response.data.siteVisit ?? 0,
          quotation: response.data.quotation ?? 0,
          followUp: response.data.followUp ?? 0,
          converted: response.data.converted ?? 0,
          closed: response.data.closed ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch enquiry stats:", err);
    }
  }, []);

  const fetchEnquiries = useCallback(async (page: number, search: string, filter: StatusFilter) => {
    setIsLoading(true);
    try {
      const res = await getEnquiriesApi({
        search: search || undefined,
        status: filter === "all" ? undefined : filter,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success) {
        setEnquiries(res.data);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load enquiries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await getClientsApi({ page: 1, limit: 200 });
      if (res.success) setClients(res.data);
    } catch (err) {
      console.error("Failed to load clients", err);
    }
  }, []);

  const refreshList = useCallback(() => {
    fetchEnquiries(currentPage, debouncedSearch, activeFilter);
    fetchStats();
  }, [currentPage, debouncedSearch, activeFilter, fetchEnquiries, fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (isFormOpen) {
      fetchClients();
    }
  }, [isFormOpen, fetchClients]);

  useEffect(() => {
    const isSearchFilterChange = debouncedSearch !== lastFetchRef.current.search || activeFilter !== lastFetchRef.current.filter;

    if (isSearchFilterChange) {
      if (currentPage !== 1) {
        setCurrentPage(1);
        return; // Page change effect will handle the load
      }
    }

    fetchEnquiries(currentPage, debouncedSearch, activeFilter);
    lastFetchRef.current = { page: currentPage, search: debouncedSearch, filter: activeFilter };
  }, [currentPage, debouncedSearch, activeFilter, fetchEnquiries]);

  const handleClose = async () => {
    if (!closeId) return;
    try {
      await updateEnquiryApi(closeId, { status: "Closed" });
      toast.success("Enquiry closed");
      setCloseId(null);
      refreshList();
    } catch (err) {
      console.error(err);
      toast.error("Failed to close enquiry");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEnquiryApi(deleteId);
      toast.success("Enquiry deleted");
      setDeleteId(null);
      refreshList();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete enquiry");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      "Site Visit Scheduled": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      "Quotation Prepared": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      "Follow-up Required": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      "Converted to Project": "bg-green-500/10 text-green-600 dark:text-green-400",
      "Converted to AMC": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      "Converted to Minor Job": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      Closed: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${
          map[status] ?? "bg-muted text-muted-foreground"
        }`}
      >
        {status}
      </span>
    );
  };

  const getPriorityBadge = (p: string) => {
    const map: Record<string, string> = {
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

  const renderEnquiryActions = (row: Enquiry) => (
    <div
      className="flex justify-end"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-muted rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              row.id && navigate(`/enquiries/${row.id}`);
            }}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4 text-blue-500" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditEnquiry(row);
              setIsFormOpen(true);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4 text-green-500" />
            Edit
          </DropdownMenuItem>
          {row.status !== "Closed" && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                if (row.id) setCloseId(row.id);
              }}
              className="cursor-pointer"
            >
              <XCircle className="mr-2 h-4 w-4 text-red-600" />
              Close Enquiry
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              if (row.id) setDeleteId(row.id);
            }}
            className="cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const filterChips = [
    { value: "all" as StatusFilter, label: "Total", count: stats.total, tone: "primary" as const },
    { value: "Site Visit Scheduled" as StatusFilter, label: "Site Visit", count: stats.siteVisit, tone: "blue" as const },
    { value: "Quotation Prepared" as StatusFilter, label: "Quotation", count: stats.quotation, tone: "amber" as const },
    { value: "Follow-up Required" as StatusFilter, label: "Follow-up", count: stats.followUp, tone: "orange" as const },
    { value: "Converted to Project" as StatusFilter, label: "Converted", count: stats.converted, tone: "green" as const },
    { value: "Closed" as StatusFilter, label: "Closed", count: stats.closed, tone: "pink" as const },
  ];

  const columns = [
    {
      header: "Enquiry No.",
      accessor: (row: Enquiry) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground leading-tight truncate">{row.enquiryNo}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
      ),
      className: "px-4 py-4 w-[130px]",
    },
    {
      header: "Client",
      accessor: (row: Enquiry) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 border border-border shadow-sm bg-muted flex items-center justify-center">
            {row.clientLogoUrl ? (
              <img
                src={row.clientLogoUrl}
                alt={row.clientName}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(row.clientName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                alt={row.clientName}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground leading-tight truncate max-w-[120px]">{row.clientName}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">
              {row.contactPerson} {row.clientLocation ? ` · ${row.clientLocation}` : ""}
            </p>
          </div>
        </div>
      ),
      className: "px-4 py-4 w-[160px]",
    },
    {
      header: "Requirement",
      accessor: (row: Enquiry) => (
        <span className="text-sm text-foreground line-clamp-2 leading-snug break-words">{row.requirement}</span>
      ),
      className: "px-4 py-4 w-[200px] max-w-[200px]",
    },
    {
      header: "Priority",
      accessor: (row: Enquiry) => getPriorityBadge(row.priority),
      className: "px-4 py-4 w-[90px]",
    },
    {
      header: "Status",
      accessor: (row: Enquiry) => getStatusBadge(row.status),
      className: "px-4 py-4 w-[140px]",
    },
    {
      header: "Follow-up",
      accessor: (row: Enquiry) =>
        row.followUpDate ? (
          <div className="flex items-center gap-1.5 text-sm text-pink-600 font-medium whitespace-nowrap">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {new Date(row.followUpDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
      className: "px-4 py-4 w-[120px]",
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "px-4 py-4 text-right w-[52px]",
      accessor: (row: Enquiry) => renderEnquiryActions(row),
    },
  ];

  return (
    <>
      <ManagementListPage
        title="Enquiry Management"
        subtitle="Track and manage customer enquiries"
        headerAction={
          <Button
            onClick={() => {
              setEditEnquiry(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Enquiry
          </Button>
        }
        searchPlaceholder="Search by enquiry no., client, requirement…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterChips}
        filterValue={activeFilter}
        onFilterChange={setActiveFilter}
        columns={columns}
        data={enquiries}
        isLoading={isLoading}
        rowKey={(row) => row.id || row.enquiryNo}
        onRowClick={(row) => row.id && navigate(`/enquiries/${row.id}`)}
        emptyMessage="No enquiries found"
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="enquiries"
      />

      <EnquiryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditEnquiry(null);
        }}
        onSuccess={refreshList}
        enquiry={editEnquiry}
        clients={clients}
        onClientsRefresh={fetchClients}
      />

      <AlertDialog open={!!closeId} onOpenChange={() => setCloseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close enquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              The enquiry will be marked as closed. You can reopen it later from the detail page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} className="bg-red-600 text-white hover:bg-red-700">
              Close Enquiry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete enquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The enquiry record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

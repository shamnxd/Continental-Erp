import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { Plus, Eye, Edit, Trash2, Calendar, MoreVertical, TrendingUp } from "lucide-react";
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
import { getQuotationsApi, deleteQuotationApi, getQuotationsStatsApi } from "../../api/quotation.api";
import { Quotation, QuotationStatus } from "../../interfaces/quotation.interface";
import { AppRoute } from "../../constants/routes.enum";
import { toast } from "sonner";
import { useDebounce } from "../../hooks/useDebounce";
import { ManagementListPage } from "../../components/ManagementListPage";
import { SelectCostingDialog } from "../../components/SelectCostingDialog";

type StatusFilter = "all" | QuotationStatus;

const PAGE_SIZE = 10;

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    Draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    "Pending Approval": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Approved: "bg-green-500/10 text-green-600 dark:text-green-400",
    Rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
    Expired: "bg-muted text-muted-foreground",
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
}

export function Quotations() {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSelectCostingOpen, setIsSelectCostingOpen] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
  });

  const lastFetchRef = useRef({ page: 1, search: "", filter: "all" });

  const fetchStats = useCallback(async () => {
    try {
      const response = await getQuotationsStatsApi();
      if (response.success) {
        setStats({
          total: response.data.total ?? 0,
          pending: response.data.pending ?? 0,
          approved: response.data.approved ?? 0,
          rejected: response.data.rejected ?? 0,
          draft: response.data.draft ?? 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch quotation stats:", err);
    }
  }, []);

  const fetchQuotations = useCallback(async (page: number, search: string, filter: StatusFilter) => {
    setIsLoading(true);
    try {
      const res = await getQuotationsApi({
        search: search || undefined,
        status: filter === "all" ? undefined : filter,
        page,
        limit: PAGE_SIZE,
      });
      if (res.success) {
        setQuotations(res.data);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshList = useCallback(() => {
    fetchQuotations(currentPage, debouncedSearch, activeFilter);
    fetchStats();
  }, [currentPage, debouncedSearch, activeFilter, fetchQuotations, fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const isSearchFilterChange = debouncedSearch !== lastFetchRef.current.search || activeFilter !== lastFetchRef.current.filter;

    if (isSearchFilterChange) {
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
    }

    fetchQuotations(currentPage, debouncedSearch, activeFilter);
    lastFetchRef.current = { page: currentPage, search: debouncedSearch, filter: activeFilter };
  }, [currentPage, debouncedSearch, activeFilter, fetchQuotations]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteQuotationApi(deleteId);
      toast.success("Quotation deleted");
      setDeleteId(null);
      refreshList();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete quotation");
    }
  };

  const renderActions = (row: Quotation) => (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted rounded-full" onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          {row.convertedTo && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                const targetType = row.convertedTo?.targetType;
                const targetId = row.convertedTo?.targetId;
                if (targetType === "project") {
                  navigate(`/projects/${targetId}`);
                } else if (targetType === "amc") {
                  navigate(`/amc/${targetId}`);
                } else {
                  navigate(`/minor-jobs/${targetId}`);
                }
              }}
              className="cursor-pointer font-semibold text-purple-700 dark:text-purple-400 focus:text-purple-800"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View Converted {row.convertedTo.targetType === "minorjob" ? "Job" : row.convertedTo.targetType.toUpperCase()}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              row.id && navigate(`${AppRoute.QUOTATIONS}/${row.id}`);
            }}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4 text-blue-500" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              row.id && navigate(`${AppRoute.QUOTATIONS}/${row.id}/edit`);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4 text-green-500" />
            Edit
          </DropdownMenuItem>
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
    { value: "Pending Approval" as StatusFilter, label: "Pending", count: stats.pending, tone: "amber" as const },
    { value: "Approved" as StatusFilter, label: "Approved", count: stats.approved, tone: "green" as const },
    { value: "Rejected" as StatusFilter, label: "Rejected", count: stats.rejected, tone: "red" as const },
    { value: "Draft" as StatusFilter, label: "Draft", count: stats.draft, tone: "blue" as const },
  ];

  const columns = [
    {
      header: "Quotation No.",
      accessor: (row: Quotation) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground leading-tight truncate">{row.quotationNo}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
      ),
      className: "px-4 py-4 w-[130px]",
    },
    {
      header: "Client",
      accessor: (row: Quotation) => (
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
          <p className="font-medium text-foreground leading-tight truncate max-w-[140px]">{row.clientName}</p>
        </div>
      ),
      className: "px-4 py-4 w-[160px]",
    },
    {
      header: "Enquiry",
      accessor: (row: Quotation) =>
        row.enquiryNo ? (
          <span className="text-sm text-foreground font-mono">{row.enquiryNo}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
      className: "px-4 py-4 w-[120px]",
    },
    {
      header: "Valid Until",
      accessor: (row: Quotation) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {new Date(row.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      ),
      className: "px-4 py-4 w-[120px]",
    },
    {
      header: "Status",
      accessor: (row: Quotation) => {
        const badge = getStatusBadge(row.status);
        if (row.convertedTo) {
          const typeLabels: Record<string, string> = {
            project: "Project",
            amc: "AMC",
            minorjob: "Minor Job",
          };
          const label = typeLabels[row.convertedTo.targetType] || row.convertedTo.targetType;
          return (
            <div className="flex flex-col gap-1 items-start" onClick={(e) => e.stopPropagation()}>
              {badge}
              <button
                type="button"
                onClick={() => {
                  const targetType = row.convertedTo?.targetType;
                  const targetId = row.convertedTo?.targetId;
                  if (targetType === "project") {
                    navigate(`/projects/${targetId}`);
                  } else if (targetType === "amc") {
                    navigate(`/amc/${targetId}`);
                  } else {
                    navigate(`/minor-jobs/${targetId}`);
                  }
                }}
                className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-705 dark:bg-purple-950/20 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wide hover:bg-purple-100/80 transition-colors"
              >
                ➔ {label}
              </button>
            </div>
          );
        }
        return badge;
      },
      className: "px-4 py-4 w-[140px]",
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "px-4 py-4 text-right w-[52px]",
      accessor: (row: Quotation) => renderActions(row),
    },
  ];

  return (
    <>
      <ManagementListPage
        title="Quotation Management"
        subtitle="Create and track customer quotations"
        headerAction={
          <Button
            onClick={() => setIsSelectCostingOpen(true)}
            className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Quotation
          </Button>
        }
        searchPlaceholder="Search by quotation no., client, enquiry…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterChips}
        filterValue={activeFilter}
        onFilterChange={setActiveFilter}
        columns={columns}
        data={quotations}
        isLoading={isLoading}
        rowKey={(row) => row.id || row.quotationNo}
        onRowClick={(row) => row.id && navigate(`${AppRoute.QUOTATIONS}/${row.id}`)}
        emptyMessage="No quotations found"
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="quotations"
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quotation?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SelectCostingDialog
        isOpen={isSelectCostingOpen}
        onClose={() => setIsSelectCostingOpen(false)}
      />
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Calendar,
  CalendarClock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import type { AmcContract } from "../../interfaces/amc.interface";
import { getAmcApi, deleteAmcApi } from "../../api/amc.api";
import { AmcFormModal } from "../../components/AmcFormModal";
import { AmcScheduleVisitModal } from "../../components/AmcScheduleVisitModal";
import { canRenewAmc } from "../../utils/amcRenewal";
import { RefreshCw } from "lucide-react";
import { NextVisitCell } from "../../components/NextVisitCell";
import { calculateNextPreferredVisitDate } from "../../utils/calculateAmcVisits";
import { useDebounce } from "../../hooks/useDebounce";
import { ManagementListPage } from "../../components/ManagementListPage";
import { toast } from "sonner";

type StatusFilter = "all" | "Active" | "Due for Renewal" | "Expired";

const statusFilterLabels: Record<StatusFilter, string> = {
  all: "All Status",
  Active: "Active",
  "Due for Renewal": "Due for Renewal",
  Expired: "Expired",
};

const PAGE_SIZE = 10;

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AMC() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [contracts, setContracts] = useState<AmcContract[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editContract, setEditContract] = useState<AmcContract | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [scheduleContract, setScheduleContract] = useState<AmcContract | null>(null);
  const [renewContract, setRenewContract] = useState<AmcContract | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, renewal: 0, expired: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const [all, active, renewal, expired] = await Promise.all([
        getAmcApi({ page: 1, limit: 1 }),
        getAmcApi({ page: 1, limit: 1, status: "Active" }),
        getAmcApi({ page: 1, limit: 1, status: "Due for Renewal" }),
        getAmcApi({ page: 1, limit: 1, status: "Expired" }),
      ]);
      setStats({
        total: all.total ?? 0,
        active: active.total ?? 0,
        renewal: renewal.total ?? 0,
        expired: expired.total ?? 0,
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchContracts = useCallback(
    async (page: number, search: string, status: StatusFilter) => {
      setIsLoading(true);
      try {
        const res = await getAmcApi({
          page,
          limit: PAGE_SIZE,
          search: search || undefined,
          status: status !== "all" ? status : undefined,
        });
        if (res.success) {
          setContracts(res.data);
          setTotal(res.total);
          setTotalPages(res.totalPages);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load AMC contracts");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchContracts(currentPage, debouncedSearch, statusFilter);
  }, [currentPage, debouncedSearch, statusFilter, fetchContracts]);

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      Active: "bg-green-500/10 text-green-600",
      "Due for Renewal": "bg-amber-500/10 text-amber-600",
      Expired: "bg-red-500/10 text-red-500",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  };

  const renderActions = (c: AmcContract) => (
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
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              c.id && navigate(`/amc/${c.id}`);
            }}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4 text-blue-500" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setScheduleContract(c);
            }}
            className="cursor-pointer"
          >
            <CalendarClock className="mr-2 h-4 w-4 text-pink-600" />
            Schedule Visit
          </DropdownMenuItem>
          {canRenewAmc(c) && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setRenewContract(c);
              }}
              className="cursor-pointer"
            >
              <RefreshCw className="mr-2 h-4 w-4 text-amber-600" />
              Renew AMC
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditContract(c);
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
              c.id && setDeleteId(c.id);
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

  const columns = [
    {
      header: "Contract",
      accessor: (c: AmcContract) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground leading-tight truncate max-w-[180px]">{c.amcNo}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">{c.serviceType}</p>
        </div>
      ),
      className: "px-4 py-4 w-[200px] min-w-[180px]",
    },
    {
      header: "Client",
      accessor: (c: AmcContract) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground leading-tight truncate max-w-[180px]">
            {c.clientName}
          </p>
          {c.email?.trim() && (
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{c.email}</p>
          )}
        </div>
      ),
      className: "px-4 py-4 w-[180px] min-w-[150px]",
    },
    {
      header: "Expires",
      accessor: (c: AmcContract) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(c.endDate)}</span>
      ),
      className: "px-4 py-4 w-[120px]",
    },
    {
      header: "Visits",
      accessor: (c: AmcContract) => (
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {c.visitsCompleted}/{c.totalVisits}
        </span>
      ),
      className: "px-4 py-4 w-[80px]",
    },
    {
      header: "Preferred Visit",
      accessor: (c: AmcContract) => (
        <NextVisitCell
          nextVisit={calculateNextPreferredVisitDate(
            c.startDate,
            c.endDate,
            c.visitsCompleted,
            c.totalVisits
          )}
          emptyLabel="All visits done"
        />
      ),
      className: "px-4 py-4 w-[150px]",
    },
    {
      header: "Scheduled Visit",
      accessor: (c: AmcContract) => (
        <NextVisitCell nextVisit={c.nextVisit} emptyLabel="Not scheduled" />
      ),
      className: "px-4 py-4 w-[150px]",
    },
    {
      header: "Status",
      accessor: (c: AmcContract) => (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${statusColor(c.status)}`}>
          {c.status}
        </span>
      ),
      className: "px-4 py-4 w-[130px]",
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "px-4 py-4 text-right w-[52px]",
      accessor: (c: AmcContract) => renderActions(c),
    },
  ];

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAmcApi(deleteId);
      toast.success("AMC contract deleted");
      setDeleteId(null);
      fetchContracts(currentPage, debouncedSearch, statusFilter);
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete contract");
    }
  };

  const refreshList = () => {
    fetchContracts(currentPage, debouncedSearch, statusFilter);
    fetchStats();
  };

  const filterChips = [
    { value: "all" as StatusFilter, label: "All Contracts", count: stats.total, tone: "primary" as const },
    { value: "Active" as StatusFilter, label: "Active", count: stats.active, tone: "green" as const },
    { value: "Due for Renewal" as StatusFilter, label: "Due for Renewal", count: stats.renewal, tone: "amber" as const },
    { value: "Expired" as StatusFilter, label: "Expired", count: stats.expired, tone: "red" as const },
  ];

  return (
    <>
      <ManagementListPage
        title="AMC Contracts"
        subtitle="Manage annual maintenance contracts"
        headerAction={
          <Button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add AMC Contract
          </Button>
        }
        searchPlaceholder="Search by AMC no., client, service type, location…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterChips}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        rowKey={(c) => c.id ?? c.amcNo}
        onRowClick={(c) => c.id && navigate(`/amc/${c.id}`)}
        emptyMessage="No AMC contracts found"
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="contracts"
        activeFilterLabel={statusFilter !== "all" ? statusFilterLabels[statusFilter] : undefined}
        onClearFilter={() => setStatusFilter("all")}
      />

      <AmcFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSuccess={refreshList} contract={null} />
      <AmcFormModal
        isOpen={!!editContract}
        onClose={() => setEditContract(null)}
        onSuccess={refreshList}
        contract={editContract}
      />
      <AmcFormModal
        isOpen={!!renewContract}
        onClose={() => setRenewContract(null)}
        onSuccess={refreshList}
        contract={null}
        renewalSource={renewContract}
      />

      <AmcScheduleVisitModal
        isOpen={!!scheduleContract}
        onClose={() => setScheduleContract(null)}
        onSuccess={() => {
          refreshList();
          setScheduleContract(null);
        }}
        contract={scheduleContract}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AMC contract?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. The client AMC status will be updated.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

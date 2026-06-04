import { useState, useEffect } from "react";
import { api } from "../../api";
import { toast } from "sonner";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import {
  TablePrimarySecondary,
  TableStatusBadge,
  tableCellClass,
} from "../../components/tableCells";
import { useDebounce } from "../../hooks/useDebounce";

type ModuleFilter = "all" | "Clients" | "AMC" | "Complaints" | "Staff" | "Finance";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: ModuleFilter extends "all" ? string : ModuleFilter;
  details: string;
}

const PAGE_SIZE = 15;

const moduleTone = (m: string): "pink" | "blue" | "amber" | "green" | "orange" | "muted" => {
  if (m === "AMC") return "pink";
  if (m === "Clients") return "blue";
  if (m === "Complaints") return "amber";
  if (m === "Staff") return "green";
  if (m === "Finance") return "orange";
  return "muted";
};

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    all: 0,
    Clients: 0,
    AMC: 0,
    Complaints: 0,
    Staff: 0,
    Finance: 0,
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      setError(null);
      const response: any = await api.get("/audit-logs", {
        params: {
          page: currentPage,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          module: moduleFilter,
        },
      });
      if (response.success) {
        setLogs(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
        if (response.counts) {
          setCounts(response.counts);
        }
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || "Failed to load audit logs";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, debouncedSearch, moduleFilter]);

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, moduleFilter]);

  const columns: Column<AuditLogEntry>[] = [
    {
      header: "When",
      accessor: (row) => {
        const d = new Date(row.timestamp);
        const datePart = Number.isNaN(d.getTime())
          ? "—"
          : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const timePart = Number.isNaN(d.getTime())
          ? ""
          : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        return <TablePrimarySecondary primary={datePart} secondary={timePart} />;
      },
      className: tableCellClass.medium,
    },
    {
      header: "User",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.user} secondary={row.module} />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Action",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={row.action}
          secondary={row.details}
          secondaryClassName="text-xs text-muted-foreground line-clamp-2 leading-snug max-w-[280px]"
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Module",
      accessor: (row) => <TableStatusBadge label={row.module} tone={moduleTone(row.module)} />,
      className: tableCellClass.narrow,
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="max-w-md w-full flex flex-col items-center">
          <span className="text-pink-700 font-extrabold text-lg tracking-wider uppercase mb-1">
            Access Denied
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
            Administration Permission Required
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto mb-8">
            {error}
          </p>

          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-lg bg-pink-700 hover:bg-pink-800 text-white text-sm font-semibold transition-all shadow-sm active:scale-95 mb-10"
          >
            Go Back
          </button>

          {/* Minimal lock/gate illustration matching the user's uploaded style */}
          <div className="w-full max-w-[280px] opacity-90 mt-4 select-none">
            <svg viewBox="0 0 200 120" className="w-full h-auto text-pink-700 fill-current">
              {/* Ground line */}
              <line x1="10" y1="110" x2="190" y2="110" stroke="currentColor" strokeWidth="1.5" />
              
              {/* Lock shape */}
              <rect x="85" y="65" width="30" height="24" rx="4" className="text-pink-600/10 fill-current" stroke="currentColor" strokeWidth="1.5" />
              <path d="M92,65 L92,53 A8,8 0 0,1 108,53 L108,65" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="100" cy="74" r="2.5" stroke="currentColor" strokeWidth="1.2" />
              <line x1="100" y1="76" x2="100" y2="82" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

              {/* Barricade poles */}
              <line x1="35" y1="110" x2="35" y2="80" stroke="currentColor" strokeWidth="1.5" />
              <line x1="55" y1="110" x2="55" y2="80" stroke="currentColor" strokeWidth="1.5" />
              <rect x="30" y="80" width="30" height="8" rx="1" fill="currentColor" />
              
              {/* Character standing, looking at lock */}
              <circle cx="145" cy="82" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <line x1="145" y1="86" x2="145" y2="102" stroke="currentColor" strokeWidth="1.5" />
              {/* Arms */}
              <path d="M140,92 L136,86" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <path d="M150,92 L154,88" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              {/* Legs */}
              <line x1="143" y1="102" x2="141" y2="110" stroke="currentColor" strokeWidth="1.5" />
              <line x1="147" y1="102" x2="149" y2="110" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ManagementListPage
      title="Audit Logs"
      subtitle="System activity and change history"
      searchPlaceholder="Search by user, action, or details..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        { value: "all", label: "All Modules", count: counts.all, tone: "primary" },
        { value: "Clients", label: "Clients", count: counts.Clients, tone: "blue" },
        { value: "AMC", label: "AMC", count: counts.AMC, tone: "pink" },
        { value: "Complaints", label: "Complaints", count: counts.Complaints, tone: "amber" },
        { value: "Staff", label: "Staff", count: counts.Staff, tone: "green" },
        { value: "Finance", label: "Finance", count: counts.Finance, tone: "orange" },
      ]}
      filterValue={moduleFilter}
      onFilterChange={setModuleFilter}
      columns={columns}
      data={logs}
      isLoading={isLoading}
      emptyMessage="No audit log entries yet."
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="log entries"
    />
  );
}

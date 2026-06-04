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
      toast.error(err.response?.data?.message || "Failed to load audit logs");
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

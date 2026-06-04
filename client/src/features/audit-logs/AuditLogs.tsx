import { useState, useMemo } from "react";
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

const initialLogs: AuditLogEntry[] = [];

const moduleTone = (m: string): "pink" | "blue" | "amber" | "green" | "orange" | "muted" => {
  if (m === "AMC") return "pink";
  if (m === "Clients") return "blue";
  if (m === "Complaints") return "amber";
  if (m === "Staff") return "green";
  if (m === "Finance") return "orange";
  return "muted";
};

export function AuditLogs() {
  const [logs] = useState<AuditLogEntry[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return logs
      .filter((l) => moduleFilter === "all" || l.module === moduleFilter)
      .filter(
        (l) =>
          !q ||
          l.user.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, debouncedSearch, moduleFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
        { value: "all", label: "All Modules", count: logs.length, tone: "primary" },
        { value: "Clients", label: "Clients", count: logs.filter((l) => l.module === "Clients").length, tone: "blue" },
        { value: "AMC", label: "AMC", count: logs.filter((l) => l.module === "AMC").length, tone: "pink" },
        {
          value: "Complaints",
          label: "Complaints",
          count: logs.filter((l) => l.module === "Complaints").length,
          tone: "amber",
        },
        { value: "Staff", label: "Staff", count: logs.filter((l) => l.module === "Staff").length, tone: "green" },
        { value: "Finance", label: "Finance", count: logs.filter((l) => l.module === "Finance").length, tone: "orange" },
      ]}
      filterValue={moduleFilter}
      onFilterChange={setModuleFilter}
      columns={columns}
      data={pageItems}
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

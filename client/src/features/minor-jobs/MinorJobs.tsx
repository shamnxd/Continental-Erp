import { useState, useMemo } from "react";
import { Plus, Calendar } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import {
  TableClientCell,
  TablePrimarySecondary,
  TableStatusBadge,
  formatTableDate,
  tableCellClass,
} from "../../components/tableCells";
import { useDebounce } from "../../hooks/useDebounce";

type StatusFilter = "all" | "Open" | "In Progress" | "Completed";

interface MinorJob {
  id: string;
  jobNo: string;
  clientName: string;
  clientContact?: string;
  description: string;
  scheduledDate: string;
  status: "Open" | "In Progress" | "Completed";
  assignedTo: string;
}

const PAGE_SIZE = 10;

const initialJobs: MinorJob[] = [];

const statusTone = (s: MinorJob["status"]) => {
  if (s === "Open") return "blue" as const;
  if (s === "In Progress") return "amber" as const;
  return "green" as const;
};

export function MinorJobs() {
  const [jobs] = useState<MinorJob[]>(initialJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return jobs
      .filter((j) => statusFilter === "all" || j.status === statusFilter)
      .filter(
        (j) =>
          !q ||
          j.jobNo.toLowerCase().includes(q) ||
          j.clientName.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  }, [jobs, debouncedSearch, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<MinorJob>[] = [
    {
      header: "Job",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.jobNo} secondary={row.description} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Client",
      accessor: (row) => (
        <TableClientCell
          name={row.clientName}
          subtitle={row.clientContact ?? `Assigned: ${row.assignedTo}`}
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Scheduled",
      accessor: (row) => (
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
          <TablePrimarySecondary
            primary={formatTableDate(row.scheduledDate)}
            secondary={row.assignedTo}
            primaryClassName="text-sm font-semibold text-foreground whitespace-nowrap"
          />
        </div>
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Status",
      accessor: (row) => <TableStatusBadge label={row.status} tone={statusTone(row.status)} />,
      className: tableCellClass.narrow,
    },
  ];

  return (
    <ManagementListPage
      title="Minor Jobs"
      subtitle="Small service jobs and quick fixes"
      headerAction={
        <Button className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold">
          <Plus className="h-4 w-4" />
          New Minor Job
        </Button>
      }
      searchPlaceholder="Search minor jobs..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        { value: "all", label: "All", count: jobs.length, tone: "primary" },
        { value: "Open", label: "Open", count: jobs.filter((j) => j.status === "Open").length, tone: "blue" },
        {
          value: "In Progress",
          label: "In Progress",
          count: jobs.filter((j) => j.status === "In Progress").length,
          tone: "amber",
        },
        {
          value: "Completed",
          label: "Completed",
          count: jobs.filter((j) => j.status === "Completed").length,
          tone: "green",
        },
      ]}
      filterValue={statusFilter}
      onFilterChange={setStatusFilter}
      columns={columns}
      data={pageItems}
      emptyMessage="No minor jobs yet. Create one to get started."
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="minor jobs"
    />
  );
}

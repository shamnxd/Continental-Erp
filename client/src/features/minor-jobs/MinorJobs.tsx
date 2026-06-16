import { useState, useMemo, useEffect, useCallback } from "react";
import { Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router";
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
import { getMinorJobsApi } from "../../api/minorJob.api";
import { MinorJob } from "../../interfaces/minorJob.interface";
import { toast } from "sonner";

type StatusFilter = "all" | "Open" | "In Progress" | "Completed";

const PAGE_SIZE = 10;

const statusTone = (s: MinorJob["status"]) => {
  if (s === "Open") return "blue" as const;
  if (s === "In Progress") return "amber" as const;
  return "green" as const;
};

export function MinorJobs() {
  const [jobs, setJobs] = useState<MinorJob[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const navigate = useNavigate();

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMinorJobsApi({
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      if (res.success) {
        setJobs(res.data);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to load minor jobs", err);
      toast.error("Failed to load minor jobs");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
      accessor: (row) => {
        const clientName = typeof row.clientRef === "object" ? row.clientRef.companyName : "Unknown Client";
        const contactName = typeof row.clientRef === "object" ? row.clientRef.contactPerson : "";
        return (
          <TableClientCell
            name={clientName}
            subtitle={contactName ?? `Assigned: ${row.assignedTo}`}
          />
        );
      },
      className: tableCellClass.wide,
    },
    {
      header: "Scheduled",
      accessor: (row) => (
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
          <TablePrimarySecondary
            primary={formatTableDate(row.scheduledDate)}
            secondary={row.assignedTo || "Unassigned"}
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
    {
      header: "Actions",
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/minor-jobs/${row.id}`);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      ),
      className: tableCellClass.narrow,
    },
  ];

  return (
    <ManagementListPage
      title="Minor Jobs"
      subtitle="Small service jobs and quick fixes"
      headerAction={<div />} // Created via Quotation conversion
      searchPlaceholder="Search minor jobs..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        { value: "all", label: "All", count: total, tone: "primary" },
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
      data={jobs}
      isLoading={isLoading}
      emptyMessage="No minor jobs yet. Convert an approved quotation to create a minor job."
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="minor jobs"
      onRowClick={(row) => navigate(`/minor-jobs/${row.id}`)}
    />
  );
}

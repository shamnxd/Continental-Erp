import { useState, useMemo } from "react";
import { Plus, Calendar, CalendarDays } from "lucide-react";
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
import { Schedules } from "../../components/Schedules";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

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

const initialJobs: MinorJob[] = [
  {
    id: "mj_1",
    jobNo: "MJ-2026-001",
    clientName: "Tech Hub Office",
    clientContact: "Ananth Krishnan",
    description: "Replace faulty compressor in lobby AC",
    scheduledDate: "2026-06-11T10:00:00.000Z",
    status: "In Progress",
    assignedTo: "Rahul Sharma",
  },
  {
    id: "mj_2",
    jobNo: "MJ-2026-002",
    clientName: "Hotel Green Palace",
    clientContact: "Manager",
    description: "Thermostat calibration check",
    scheduledDate: "2026-06-15T14:30:00.000Z",
    status: "Open",
    assignedTo: "Vikram Singh",
  },
];

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
  const [selectedJob, setSelectedJob] = useState<MinorJob | null>(null);

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
    {
      header: "Actions",
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50"
          onClick={() => setSelectedJob(row)}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Schedules
        </Button>
      ),
      className: tableCellClass.narrow,
    },
  ];

  return (
    <>
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

      <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent className="max-w-2xl bg-card border border-border shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Schedules for Minor Job: {selectedJob?.jobNo}
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="mt-4">
              <Schedules
                entityId={selectedJob.id}
                entityType="minorjob"
                entityNo={selectedJob.jobNo}
                clientName={selectedJob.clientName}
                title={selectedJob.description}
                isClosed={selectedJob.status === "Completed"}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


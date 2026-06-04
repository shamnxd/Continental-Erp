import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
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

type StatusFilter = "all" | "Pending" | "Approved" | "Rejected";

interface LeaveRequest {
  id: string;
  staffName: string;
  staffNo?: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
}

const PAGE_SIZE = 10;

const initialLeaves: LeaveRequest[] = [];

const statusTone = (s: LeaveRequest["status"]) => {
  if (s === "Approved") return "green" as const;
  if (s === "Rejected") return "red" as const;
  return "amber" as const;
};

export function LeaveManagement() {
  const [leaves] = useState<LeaveRequest[]>(initialLeaves);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return leaves
      .filter((l) => statusFilter === "all" || l.status === statusFilter)
      .filter(
        (l) =>
          !q ||
          l.staffName.toLowerCase().includes(q) ||
          l.leaveType.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime());
  }, [leaves, debouncedSearch, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<LeaveRequest>[] = [
    {
      header: "Staff",
      accessor: (row) => (
        <TableClientCell
          name={row.staffName}
          subtitle={row.staffNo ?? row.leaveType}
          seed={row.staffName}
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Leave",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={row.leaveType}
          secondary={`${row.days} day${row.days === 1 ? "" : "s"}`}
        />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Period",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={`${formatTableDate(row.fromDate)} → ${formatTableDate(row.toDate)}`}
          secondary="Requested period"
          primaryClassName="text-sm font-medium text-foreground whitespace-nowrap"
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Status",
      accessor: (row) => <TableStatusBadge label={row.status} tone={statusTone(row.status)} />,
      className: tableCellClass.narrow,
    },
  ];

  return (
    <ManagementListPage
      title="Leave Management"
      subtitle="Staff leave requests and approvals"
      headerAction={
        <Button className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold">
          <Plus className="h-4 w-4" />
          Request Leave
        </Button>
      }
      searchPlaceholder="Search by staff or leave type..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        { value: "all", label: "All", count: leaves.length, tone: "primary" },
        {
          value: "Pending",
          label: "Pending",
          count: leaves.filter((l) => l.status === "Pending").length,
          tone: "amber",
        },
        {
          value: "Approved",
          label: "Approved",
          count: leaves.filter((l) => l.status === "Approved").length,
          tone: "green",
        },
        {
          value: "Rejected",
          label: "Rejected",
          count: leaves.filter((l) => l.status === "Rejected").length,
          tone: "red",
        },
      ]}
      filterValue={statusFilter}
      onFilterChange={setStatusFilter}
      columns={columns}
      data={pageItems}
      emptyMessage="No leave requests found."
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="leave requests"
    />
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { getComplaintRequestsApi, ComplaintRequest } from "../../api/complaintRequest.api";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import {
  TablePrimarySecondary,
  TableStatusBadge,
  tableCellClass,
} from "../../components/tableCells";
import { useDebounce } from "../../hooks/useDebounce";
import { Button } from "../../components/ui/button";

const PAGE_SIZE = 15;

const statusTone = (s: string): "amber" | "green" | "red" | "muted" => {
  if (s === "Pending") return "amber";
  if (s === "Converted") return "green";
  if (s === "Rejected") return "red";
  return "muted";
};

export function ComplaintRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ComplaintRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<string>("Pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Stats state for proper counts
  const [stats, setStats] = useState({
    all: 0,
    Pending: 0,
    Converted: 0,
    Rejected: 0,
  });

  // Fetch counts for all statuses
  const fetchStats = useCallback(async () => {
    try {
      const [allRes, pendingRes, convertedRes, rejectedRes] = await Promise.all([
        getComplaintRequestsApi({ page: 1, limit: 1 }),
        getComplaintRequestsApi({ page: 1, limit: 1, status: "Pending" }),
        getComplaintRequestsApi({ page: 1, limit: 1, status: "Converted" }),
        getComplaintRequestsApi({ page: 1, limit: 1, status: "Rejected" }),
      ]);
      setStats({
        all: allRes.pagination.total,
        Pending: pendingRes.pagination.total,
        Converted: convertedRes.pagination.total,
        Rejected: rejectedRes.pagination.total,
      });
    } catch (err) {
      console.error("Failed to fetch complaint request counts:", err);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getComplaintRequestsApi({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
      });
      if (response.success) {
        setRequests(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

  const columns: Column<ComplaintRequest>[] = [
    {
      header: "When",
      accessor: (row) => {
        const d = new Date(row.createdAt);
        const datePart = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const timePart = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        return <TablePrimarySecondary primary={datePart} secondary={timePart} />;
      },
      className: tableCellClass.medium,
    },
    {
      header: "Customer",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.clientName} secondary={row.phone} />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Contact Person",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.contactPerson} secondary={row.email || "No email"} />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Issue / Subject",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={row.issue}
          secondary={row.description}
          secondaryClassName="text-xs text-muted-foreground line-clamp-1 max-w-[280px]"
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Status",
      accessor: (row) => <TableStatusBadge label={row.status} tone={statusTone(row.status)} />,
      className: tableCellClass.narrow,
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "px-4 py-4 text-right w-[80px]",
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/customer-complaints/${row.id || (row as any)._id}`);
          }}
          className="h-8 px-3 border-pink-200 text-pink-700 hover:text-pink-850 hover:bg-pink-50 text-xs font-bold rounded-lg transition-all"
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <ManagementListPage
      title="Customer Complaint Requests"
      subtitle="Review and convert incoming customer submitted complaints"
      searchPlaceholder="Search requests..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        { value: "Pending", label: "Pending Review", count: stats.Pending, tone: "amber" },
        { value: "Converted", label: "Converted", count: stats.Converted, tone: "green" },
        { value: "Rejected", label: "Rejected", count: stats.Rejected, tone: "red" },
        { value: "all", label: "All Requests", count: stats.all, tone: "primary" },
      ]}
      filterValue={statusFilter}
      onFilterChange={setStatusFilter}
      columns={columns}
      data={requests}
      isLoading={isLoading}
      onRowClick={(row) => navigate(`/customer-complaints/${row.id || (row as any)._id}`)}
      emptyMessage="No complaint requests found."
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="complaint requests"
    />
  );
}

import { useState, useMemo } from "react";
import { Plus, Eye } from "lucide-react";
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

type StatusFilter = "all" | "Active" | "Expiring Soon" | "Expired" | "Claimed";

interface WarrantyRecord {
  id: string;
  warrantyNo: string;
  clientName: string;
  product: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Expiring Soon" | "Expired" | "Claimed";
}

const PAGE_SIZE = 10;

const initialWarranties: WarrantyRecord[] = [
  {
    id: "warr_1",
    warrantyNo: "WRN-2026-001",
    clientName: "Metro Mall Center",
    product: "Chiller Unit 500TR - Carrier",
    startDate: "2025-01-15T00:00:00.000Z",
    endDate: "2027-01-15T00:00:00.000Z",
    status: "Active",
  },
  {
    id: "warr_2",
    warrantyNo: "WRN-2026-002",
    clientName: "Capital Residence",
    product: "Ductable Split AC 5.0TR - Daikin",
    startDate: "2025-06-20T00:00:00.000Z",
    endDate: "2026-06-20T00:00:00.000Z",
    status: "Expiring Soon",
  },
];

const statusTone = (s: WarrantyRecord["status"]) => {
  if (s === "Active") return "green" as const;
  if (s === "Expiring Soon") return "amber" as const;
  if (s === "Expired") return "red" as const;
  return "blue" as const;
};

export function WarrantyManagement() {
  const [warranties] = useState<WarrantyRecord[]>(initialWarranties);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return warranties
      .filter((w) => statusFilter === "all" || w.status === statusFilter)
      .filter(
        (w) =>
          !q ||
          w.warrantyNo.toLowerCase().includes(q) ||
          w.clientName.toLowerCase().includes(q) ||
          w.product.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [warranties, debouncedSearch, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<WarrantyRecord>[] = [
    {
      header: "Warranty",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.warrantyNo} secondary={row.product} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Client",
      accessor: (row) => (
        <TableClientCell name={row.clientName} subtitle={row.product} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Coverage",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={`${formatTableDate(row.startDate)} → ${formatTableDate(row.endDate)}`}
          secondary="Warranty period"
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
    {
      header: "Actions",
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/warranty-management/${row.id}`, { state: { warranty: row } });
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
      title="Warranty Management"
      subtitle="Product warranties and claim tracking"
      headerAction={
        <Button className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold">
          <Plus className="h-4 w-4" />
          Register Warranty
        </Button>
      }
      searchPlaceholder="Search warranties..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        { value: "all", label: "All", count: warranties.length, tone: "primary" },
        { value: "Active", label: "Active", count: warranties.filter((w) => w.status === "Active").length, tone: "green" },
        {
          value: "Expiring Soon",
          label: "Expiring Soon",
          count: warranties.filter((w) => w.status === "Expiring Soon").length,
          tone: "amber",
        },
        { value: "Expired", label: "Expired", count: warranties.filter((w) => w.status === "Expired").length, tone: "red" },
        { value: "Claimed", label: "Claimed", count: warranties.filter((w) => w.status === "Claimed").length, tone: "blue" },
      ]}
      filterValue={statusFilter}
      onFilterChange={setStatusFilter}
      columns={columns}
      data={pageItems}
      emptyMessage="No warranty records yet."
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="warranties"
      onRowClick={(row) => navigate(`/warranty-management/${row.id}`, { state: { warranty: row } })}
    />
  );
}

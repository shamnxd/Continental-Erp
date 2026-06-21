import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, Loader2 } from "lucide-react";
import { getProjectsApi } from "../../api/project.api";
import { getAllPurchaseOrdersApi } from "../../api/purchaseOrder.api";
import { Project } from "../../interfaces/project.interface";
import { PurchaseOrder } from "../../interfaces/purchaseOrder.interface";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import { TablePrimarySecondary, TableStatusBadge, tableCellClass } from "../../components/tableCells";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export function PurchaseOrdersList() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Load projects and POs
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [projRes, poRes] = await Promise.all([
          getProjectsApi({ page: 1, limit: 1000 }),
          getAllPurchaseOrdersApi(),
        ]);

        if (projRes.success) {
          setProjects(projRes.data);
        }
        if (poRes.success) {
          setPurchaseOrders(poRes.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load purchase orders and projects data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Map projectRef to Project object
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => {
      const id = p.id || (p as any)._id;
      if (id) map.set(id, p);
    });
    return map;
  }, [projects]);

  // Filtered POs list
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        po.poNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      const matchesProject = projectFilter === "all" || po.projectRef === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [purchaseOrders, searchQuery, statusFilter, projectFilter]);

  // Paginated items
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPurchaseOrders.slice(start, start + PAGE_SIZE);
  }, [filteredPurchaseOrders, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredPurchaseOrders.length / PAGE_SIZE));

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, projectFilter]);

  const columns: Column<PurchaseOrder>[] = [
    {
      header: "PO Number",
      render: (row: PurchaseOrder) => <span className="font-bold text-foreground text-sm">{row.poNo}</span>,
      className: tableCellClass.medium,
    },
    {
      header: "Vendor Name",
      render: (row: PurchaseOrder) => <span className="font-semibold text-foreground">{row.vendorName}</span>,
      className: tableCellClass.wide,
    },
    {
      header: "Project",
      render: (row: PurchaseOrder) => {
        const proj = projectMap.get(row.projectRef);
        return (
          <TablePrimarySecondary
            primary={proj?.name || "Unknown Project"}
            secondary={proj?.projectNo || "—"}
          />
        );
      },
      className: tableCellClass.wide,
    },
    {
      header: "Grand Total",
      render: (row: PurchaseOrder) => <span className="font-semibold text-pink-700 dark:text-pink-400">{fmtCurrency(row.amount)}</span>,
      className: tableCellClass.medium,
    },
    {
      header: "Status",
      render: (row: PurchaseOrder) => {
        const tone =
          row.status === "Delivered" ? "green" :
          row.status === "Ordered" ? "pink" :
          row.status === "Approved" ? "blue" : "amber";
        return <TableStatusBadge label={row.status} tone={tone} />;
      },
      className: tableCellClass.narrow,
    },
    {
      header: "",
      render: (row: PurchaseOrder) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          onClick={() => navigate(`/projects/${row.projectRef}/purchase-orders/${row.id || (row as any)._id}`)}
        >
          <Eye className="h-4 w-4 text-pink-700" />
        </Button>
      ),
      className: tableCellClass.actions,
    },
  ];

  const filterChips = [
    { value: "all", label: "All POs", count: purchaseOrders.length },
    { value: "Pending", label: "Pending", count: purchaseOrders.filter((po) => po.status === "Pending").length },
    { value: "Approved", label: "Approved", count: purchaseOrders.filter((po) => po.status === "Approved").length },
    { value: "Ordered", label: "Ordered", count: purchaseOrders.filter((po) => po.status === "Ordered").length },
    { value: "Delivered", label: "Delivered", count: purchaseOrders.filter((po) => po.status === "Delivered").length },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    );
  }

  return (
    <ManagementListPage
      title="Purchase Order Management"
      subtitle="Track, issue, revise, and verify all material purchase orders across projects."
      searchPlaceholder="Search by PO number or vendor name..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={filterChips}
      filterValue={statusFilter}
      onFilterChange={setStatusFilter}
      columns={columns}
      data={paginatedData}
      rowKey={(row) => row.id || (row as any)._id}
      currentPage={currentPage}
      totalPages={totalPages}
      total={filteredPurchaseOrders.length}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="purchase orders"
      extraFilters={
        <div className="w-full sm:w-[220px]">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full h-11 text-xs">
              <SelectValue placeholder="Filter by Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((proj) => (
                <SelectItem key={proj.id || (proj as any)._id} value={proj.id || (proj as any)._id}>
                  {proj.name} ({proj.projectNo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    />
  );
}

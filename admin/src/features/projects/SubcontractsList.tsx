import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, Loader2 } from "lucide-react";
import { getProjectsApi } from "../../api/project.api";
import { getAllSubcontractsApi } from "../../api/subcontract.api";
import { Project } from "../../interfaces/project.interface";
import { Subcontract } from "../../interfaces/subcontract.interface";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import { TablePrimarySecondary, TableStatusBadge, tableCellClass } from "../../components/tableCells";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

const PAGE_SIZE = 10;

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export function SubcontractsList() {
  const [subcontracts, setSubcontracts] = useState<Subcontract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Load projects and subcontracts
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [projRes, subRes] = await Promise.all([
          getProjectsApi({ page: 1, limit: 1000 }),
          getAllSubcontractsApi(),
        ]);

        if (projRes.success) {
          setProjects(projRes.data);
        }
        if (subRes.success) {
          setSubcontracts(subRes.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load subcontracts and projects data");
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

  // Filtered subcontracts list
  const filteredSubcontracts = useMemo(() => {
    return subcontracts.filter((sub) => {
      const matchesSearch =
        sub.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.scopeOfWork.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
      const matchesProject = projectFilter === "all" || sub.projectRef === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [subcontracts, searchQuery, statusFilter, projectFilter]);

  // Paginated items
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSubcontracts.slice(start, start + PAGE_SIZE);
  }, [filteredSubcontracts, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSubcontracts.length / PAGE_SIZE));

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, projectFilter]);

  const columns: Column<Subcontract>[] = [
    {
      header: "Contractor Name & Scope",
      render: (row: Subcontract) => (
        <TablePrimarySecondary
          primary={row.contractorName}
          secondary={row.scopeOfWork}
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Project",
      render: (row: Subcontract) => {
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
      header: "Contract Value",
      render: (row: Subcontract) => <span className="font-semibold">{fmtCurrency(row.value)}</span>,
      className: tableCellClass.medium,
    },
    {
      header: "Status",
      render: (row: Subcontract) => {
        const tone =
          row.status === "Completed" ? "green" :
          row.status === "Active" ? "blue" : "amber";
        return <TableStatusBadge label={row.status} tone={tone} />;
      },
      className: tableCellClass.narrow,
    },
    {
      header: "",
      render: (row: Subcontract) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          onClick={() => navigate(`/projects/${row.projectRef}/subcontracts/${row.id || (row as any)._id}`)}
        >
          <Eye className="h-4 w-4 text-pink-700" />
        </Button>
      ),
      className: tableCellClass.actions,
    },
  ];

  const filterChips = [
    { value: "all", label: "All Subcontracts", count: subcontracts.length },
    { value: "Pending", label: "Pending", count: subcontracts.filter((s) => s.status === "Pending").length },
    { value: "Active", label: "Active", count: subcontracts.filter((s) => s.status === "Active").length },
    { value: "Completed", label: "Completed", count: subcontracts.filter((s) => s.status === "Completed").length },
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
      title="Subcontract Management"
      subtitle="View, coordinate, and track all subcontractor allocations and reports across projects."
      searchPlaceholder="Search by contractor name or scope of work..."
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
      total={filteredSubcontracts.length}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="subcontracts"
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

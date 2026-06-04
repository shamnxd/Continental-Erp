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

type StatusFilter = "all" | "Planning" | "Active" | "On Hold" | "Completed";

interface Project {
  id: string;
  projectNo: string;
  clientName: string;
  name: string;
  startDate: string;
  status: "Planning" | "Active" | "On Hold" | "Completed";
  value: number;
}

const PAGE_SIZE = 10;

const initialProjects: Project[] = [];

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const statusTone = (s: Project["status"]) => {
  if (s === "Active") return "green" as const;
  if (s === "Planning") return "blue" as const;
  if (s === "On Hold") return "amber" as const;
  return "muted" as const;
};

export function Projects() {
  const [projects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return projects
      .filter((p) => statusFilter === "all" || p.status === statusFilter)
      .filter(
        (p) =>
          !q ||
          p.projectNo.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [projects, debouncedSearch, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const columns: Column<Project>[] = [
    {
      header: "Project",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.name} secondary={row.projectNo} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Client",
      accessor: (row) => (
        <TableClientCell name={row.clientName} subtitle={fmtCurrency(row.value)} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Timeline",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={formatTableDate(row.startDate)}
          secondary={`Value ${fmtCurrency(row.value)}`}
          primaryClassName="text-sm font-semibold text-foreground"
        />
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
      title="Projects"
      subtitle="Converted enquiries and installation projects"
      headerAction={
        <Button className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      }
      searchPlaceholder="Search projects..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        { value: "all", label: "All", count: projects.length, tone: "primary" },
        {
          value: "Planning",
          label: "Planning",
          count: projects.filter((p) => p.status === "Planning").length,
          tone: "blue",
        },
        { value: "Active", label: "Active", count: projects.filter((p) => p.status === "Active").length, tone: "green" },
        { value: "On Hold", label: "On Hold", count: projects.filter((p) => p.status === "On Hold").length, tone: "amber" },
        {
          value: "Completed",
          label: "Completed",
          count: projects.filter((p) => p.status === "Completed").length,
          tone: "muted",
        },
      ]}
      filterValue={statusFilter}
      onFilterChange={setStatusFilter}
      columns={columns}
      data={pageItems}
      emptyMessage="No projects yet. Convert an enquiry to create a project."
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="projects"
    />
  );
}

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Eye, Loader2, Search } from "lucide-react";
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
import { getProjectsApi, createProjectApi } from "../../api/project.api";
import { getClientsApi } from "../../api/client.api";
import { Project } from "../../interfaces/project.interface";
import { Client } from "../../interfaces/client.interface";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";


type StatusFilter = "all" | "Planning" | "Active" | "On Hold" | "Completed";

const PAGE_SIZE = 10;

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const statusTone = (s: Project["status"]) => {
  if (s === "Active") return "green" as const;
  if (s === "Planning") return "blue" as const;
  if (s === "On Hold") return "amber" as const;
  return "muted" as const;
};

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const navigate = useNavigate();

  // Create Project Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [projectValue, setProjectValue] = useState<number>(0);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);

  useEffect(() => {
    if (isCreateDialogOpen) {
      setLoadingClients(true);
      getClientsApi({ page: 1, limit: 300 })
        .then((res) => {
          if (res.success) setClients(res.data);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load clients");
        })
        .finally(() => setLoadingClients(false));
    }
  }, [isCreateDialogOpen]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q))
    );
  }, [clients, clientSearch]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error("Please select a client");
      return;
    }
    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }
    if (projectValue < 0) {
      toast.error("Project value cannot be negative");
      return;
    }

    setIsSavingProject(true);
    try {
      const res = await createProjectApi({
        clientRef: selectedClientId,
        name: projectName.trim(),
        startDate,
        value: projectValue,
        expectedCompletionDate: expectedCompletionDate || undefined,
      });

      if (res.success) {
        toast.success("Project created successfully");
        setIsCreateDialogOpen(false);
        // Reset form
        setSelectedClientId("");
        setProjectName("");
        setStartDate(new Date().toISOString().split("T")[0]);
        setProjectValue(0);
        setExpectedCompletionDate("");
        // Refresh project list
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create project");
    } finally {
      setIsSavingProject(false);
    }
  };


  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getProjectsApi({
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      if (res.success) {
        setProjects(res.data);
        setTotal(res.total ?? 0);
        setTotalPages(res.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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
      accessor: (row) => {
        const clientName = typeof row.clientRef === "object" ? row.clientRef.companyName : "Unknown Client";
        const clientLogoUrl = typeof row.clientRef === "object" ? row.clientRef.logoUrl : undefined;
        return <TableClientCell name={clientName} subtitle={fmtCurrency(row.value)} logoUrl={clientLogoUrl} />;
      },
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
    {
      header: "Actions",
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/projects/${row.id}`);
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
    <>
      <ManagementListPage
        title="Projects"
        subtitle="Converted enquiries and installation projects"
        headerAction={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-pink-700 hover:bg-pink-800 text-white font-semibold h-9 gap-1"
          >
            <Plus className="h-4 w-4" /> Create Project
          </Button>
        }
        searchPlaceholder="Search projects by name..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { value: "all", label: "All", count: total, tone: "primary" },
          { value: "Planning", label: "Planning", count: projects.filter((p) => p.status === "Planning").length, tone: "blue" },
          { value: "Active", label: "Active", count: projects.filter((p) => p.status === "Active").length, tone: "green" },
          { value: "On Hold", label: "On Hold", count: projects.filter((p) => p.status === "On Hold").length, tone: "amber" },
          { value: "Completed", label: "Completed", count: projects.filter((p) => p.status === "Completed").length, tone: "muted" },
        ]}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        columns={columns}
        data={projects}
        isLoading={isLoading}
        emptyMessage="No projects yet. Click 'Create Project' or convert an approved quotation."
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="projects"
        onRowClick={(row) => navigate(`/projects/${row.id}`)}
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Project</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Enter details to initialize a new installation or service project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 mt-3">
            <div>
              <Label>Client *</Label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                disabled={loadingClients}
                onOpenChange={(open) => {
                  if (!open) setClientSearch("");
                }}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select client"} />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-2 border-b border-border/50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Search clients..."
                        className="w-full pl-7 pr-2 py-1.5 text-sm bg-background border border-border rounded-md outline-none focus:ring-1 focus:ring-pink-500 text-foreground"
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredClients.map((c) => (
                      <SelectItem key={c.id} value={c.id!}>
                        {c.companyName}
                        {c.contactPerson && (
                          <span className="text-muted-foreground text-xs ml-1">— {c.contactPerson}</span>
                        )}
                      </SelectItem>
                    ))}
                    {filteredClients.length === 0 && (
                      <div className="px-2 py-3 text-sm text-center text-muted-foreground">No clients found</div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="projectNameInput">Project Name *</Label>
              <Input
                id="projectNameInput"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="HVAC Installation - Phase 1..."
                className="mt-1 text-sm h-9 text-foreground"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="projectStartDateInput">Start Date *</Label>
                <Input
                  id="projectStartDateInput"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 text-sm h-9 text-foreground"
                  required
                />
              </div>
              <div>
                <Label htmlFor="projectExpectedCompletionInput">Expected Completion</Label>
                <Input
                  id="projectExpectedCompletionInput"
                  type="date"
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                  className="mt-1 text-sm h-9 text-foreground"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="projectValueInput">Project Value (INR) *</Label>
              <Input
                id="projectValueInput"
                type="number"
                min="0"
                value={projectValue || ""}
                onChange={(e) => setProjectValue(Number(e.target.value))}
                className="mt-1 text-sm h-9 text-foreground"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSavingProject} className="h-9 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingProject}
                className="bg-pink-700 hover:bg-pink-800 text-white font-semibold h-9 text-xs"
              >
                {isSavingProject ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

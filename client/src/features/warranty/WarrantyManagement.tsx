import { useState, useEffect, useCallback } from "react";
import { Plus, Eye, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import { AmcFormModal } from "../../components/AmcFormModal";
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
import { toast } from "sonner";

// APIs & Interfaces
import { Warranty } from "../../interfaces/warranty.interface";
import { Project } from "../../interfaces/project.interface";
import {
  getWarrantiesApi,
  createWarrantyApi,
  getCompletedProjectsWithoutWarrantyApi,
} from "../../api/warranty.api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

type StatusFilter = "all" | "Active" | "Expiring Soon" | "Expired" | "Claimed";

const PAGE_SIZE = 10;

const statusTone = (s: Warranty["status"]) => {
  if (s === "Active") return "green" as const;
  if (s === "Expiring Soon") return "amber" as const;
  if (s === "Expired") return "red" as const;
  return "blue" as const;
};

export function WarrantyManagement() {
  const navigate = useNavigate();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog & Form States
  const [isOpen, setIsOpen] = useState(false);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [warrantyProduct, setWarrantyProduct] = useState("");
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");
  const [warrantyRemarks, setWarrantyRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Convert to AMC State
  const [selectedClientForAmc, setSelectedClientForAmc] = useState<string | null>(null);

  const fetchWarranties = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getWarrantiesApi({
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      // The API returns paginated structure
      setWarranties(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load warranties");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  // Load Completed Projects without warranties when dialog is opened
  useEffect(() => {
    if (isOpen) {
      setIsLoadingProjects(true);
      setSelectedProjectId("");
      setWarrantyProduct("");
      setWarrantyStartDate("");
      setWarrantyEndDate("");
      setWarrantyRemarks("");
      getCompletedProjectsWithoutWarrantyApi()
        .then((res) => {
          if (res.success) {
            setCompletedProjects(res.data);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Failed to load completed projects list");
        })
        .finally(() => setIsLoadingProjects(false));
    }
  }, [isOpen]);

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    const proj = completedProjects.find((p) => p.id === projId);
    if (!proj) return;

    setWarrantyProduct(proj.name || "");
    const todayStr = proj.actualCompletionDate
      ? new Date(proj.actualCompletionDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    setWarrantyStartDate(todayStr);

    const oneYearLater = new Date(todayStr);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    setWarrantyEndDate(oneYearLater.toISOString().split("T")[0]);
  };

  const handleStartDateChange = (val: string) => {
    setWarrantyStartDate(val);
    const newEnd = new Date(val);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    setWarrantyEndDate(newEnd.toISOString().split("T")[0]);
  };

  const handleRegisterWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = completedProjects.find((p) => p.id === selectedProjectId);
    if (!proj) {
      toast.error("Please select a completed project");
      return;
    }
    if (!warrantyProduct.trim()) {
      toast.error("Product name/description is required");
      return;
    }

    setIsSaving(true);
    try {
      const wData = {
        clientRef: typeof proj.clientRef === "object" ? proj.clientRef.id : proj.clientRef,
        projectRef: proj.id,
        product: warrantyProduct.trim(),
        startDate: new Date(warrantyStartDate).toISOString(),
        endDate: new Date(warrantyEndDate).toISOString(),
        status: "Active" as const,
        remarks: warrantyRemarks.trim() || undefined
      };

      const res = await createWarrantyApi(wData);
      if (res.success) {
        toast.success("Warranty registered successfully");
        setIsOpen(false);
        fetchWarranties();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to register warranty");
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<Warranty>[] = [
    {
      header: "Warranty No",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.warrantyNo} secondary={row.product} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Client",
      accessor: (row) => {
        const clientName =
          typeof row.clientRef === "object" && row.clientRef
            ? row.clientRef.companyName
            : "Unknown Client";
        const projNo =
          typeof row.projectRef === "object" && row.projectRef
            ? row.projectRef.projectNo
            : "";
        return <TableClientCell name={clientName} subtitle={projNo || undefined} />;
      },
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
      accessor: (row) => {
        const clientObj = typeof row.clientRef === "object" ? row.clientRef : null;
        const clientId = clientObj?.id || clientObj?._id;
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50"
              onClick={() => {
                navigate(`/warranty-management/${row.id}`);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
            {row.status !== "Claimed" && clientId && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  setSelectedClientForAmc(clientId);
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Convert
              </Button>
            )}
          </div>
        );
      },
      className: tableCellClass.narrow,
    },
  ];

  const selectedProjectObj = completedProjects.find((p) => p.id === selectedProjectId);
  const selectedClientName =
    selectedProjectObj && typeof selectedProjectObj.clientRef === "object"
      ? selectedProjectObj.clientRef.companyName
      : "";

  return (
    <>
      <ManagementListPage
        title="Warranty Management"
        subtitle="Product warranties and claim tracking"
        headerAction={
          <Button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Register Warranty
          </Button>
        }
        searchPlaceholder="Search warranties..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { value: "all", label: "All", count: total, tone: "primary" },
          {
            value: "Active",
            label: "Active",
            count: warranties.filter((w) => w.status === "Active").length,
            tone: "green",
          },
          {
            value: "Expiring Soon",
            label: "Expiring Soon",
            count: warranties.filter((w) => w.status === "Expiring Soon").length,
            tone: "amber",
          },
          {
            value: "Expired",
            label: "Expired",
            count: warranties.filter((w) => w.status === "Expired").length,
            tone: "red",
          },
          {
            value: "Claimed",
            label: "Claimed",
            count: warranties.filter((w) => w.status === "Claimed").length,
            tone: "blue",
          },
        ]}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        columns={columns}
        data={warranties}
        isLoading={isLoading}
        emptyMessage="No warranty records yet."
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="warranties"
        onRowClick={(row) => navigate(`/warranty-management/${row.id}`)}
      />

      {/* REGISTER WARRANTY DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Register Warranty
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Select a completed project to initialize its warranty coverage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegisterWarranty} className="space-y-4 mt-3">
            <div>
              <Label>Select Completed Project *</Label>
              {isLoadingProjects ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading projects...
                </div>
              ) : completedProjects.length === 0 ? (
                <div className="text-xs text-muted-foreground mt-1.5 italic bg-slate-50 dark:bg-slate-900 border border-border p-2.5 rounded-md">
                  No completed projects without warranties available.
                </div>
              ) : (
                <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
                  <SelectTrigger className="mt-1 h-9 text-sm text-foreground">
                    <SelectValue placeholder="Select completed project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {completedProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.projectNo} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedProjectId && (
              <>
                <div>
                  <Label>Client Name</Label>
                  <Input
                    value={selectedClientName}
                    disabled
                    className="mt-1 text-sm h-9 bg-muted text-muted-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="productInput">Product / Scope of Warranty *</Label>
                  <Input
                    id="productInput"
                    value={warrantyProduct}
                    onChange={(e) => setWarrantyProduct(e.target.value)}
                    placeholder="Product/System Name..."
                    className="mt-1 text-sm h-9 text-foreground"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="startDateInput">Start Date *</Label>
                    <Input
                      id="startDateInput"
                      type="date"
                      value={warrantyStartDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="mt-1 text-sm h-9 text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDateInput">End Date *</Label>
                    <Input
                      id="endDateInput"
                      type="date"
                      value={warrantyEndDate}
                      onChange={(e) => setWarrantyEndDate(e.target.value)}
                      className="mt-1 text-sm h-9 text-foreground"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="remarksInput">Description / Warranty Conditions</Label>
                  <Textarea
                    id="remarksInput"
                    value={warrantyRemarks}
                    onChange={(e) => setWarrantyRemarks(e.target.value)}
                    placeholder="Specify warranty terms, parts covered, inclusions/exclusions..."
                    className="mt-1 text-sm text-foreground bg-card"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSaving}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !selectedProjectId}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 text-xs flex items-center gap-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Warranty"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONVERT TO AMC MODAL */}
      <AmcFormModal
        isOpen={!!selectedClientForAmc}
        onClose={() => setSelectedClientForAmc(null)}
        onSuccess={() => {
          setSelectedClientForAmc(null);
          toast.success("Successfully converted warranty to AMC contract!");
          navigate("/amc");
        }}
        contract={null}
        initialClientId={selectedClientForAmc || undefined}
      />
    </>
  );
}

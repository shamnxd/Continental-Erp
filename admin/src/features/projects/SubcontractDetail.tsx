import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Building,
  IndianRupee,
  Handshake,
  Loader2,
  Upload,
  Link as LinkIcon,
  Edit2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { RemarksChat } from "../../components/RemarksChat";
import { ScrollArea } from "../../components/ui/scroll-area";
import { toast } from "sonner";

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

// APIs
import { getSubcontractsApi, uploadSubcontractReportApi, updateSubcontractApi } from "../../api/subcontract.api";
import { getProjectByIdApi } from "../../api/project.api";

// Interfaces
import { Subcontract } from "../../interfaces/subcontract.interface";
import { Project } from "../../interfaces/project.interface";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export function SubcontractDetail() {
  const { projectId, subcontractId } = useParams<{ projectId: string; subcontractId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [subcontract, setSubcontract] = useState<Subcontract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingReport, setIsUploadingReport] = useState(false);

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [contractorName, setContractorName] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [value, setValue] = useState(0);
  const [status, setStatus] = useState<"Pending" | "Active" | "Completed">("Pending");
  const [isSaving, setIsSaving] = useState(false);

  const openEditDialog = () => {
    if (!subcontract) return;
    setContractorName(subcontract.contractorName);
    setScopeOfWork(subcontract.scopeOfWork);
    setValue(subcontract.value);
    setStatus(subcontract.status);
    setIsEditDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !subcontractId) return;
    if (!contractorName.trim()) {
      toast.error("Contractor name is required");
      return;
    }
    if (!scopeOfWork.trim()) {
      toast.error("Scope of work is required");
      return;
    }
    if (value <= 0) {
      toast.error("Contract value must be greater than 0");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateSubcontractApi(projectId, subcontractId, {
        contractorName: contractorName.trim(),
        scopeOfWork: scopeOfWork.trim(),
        value,
        status,
      });

      if (res.success) {
        toast.success("Subcontract updated successfully");
        setSubcontract(res.data);
        setIsEditDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update subcontract");
    } finally {
      setIsSaving(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!projectId || !subcontractId) return;
    setIsLoading(true);
    try {
      const [projRes, subRes] = await Promise.all([
        getProjectByIdApi(projectId),
        getSubcontractsApi(projectId),
      ]);

      if (projRes.success) {
        setProject(projRes.data);
      }

      if (subRes.success) {
        const found = subRes.data.find(
          (s) => s.id === subcontractId || (s as any)._id === subcontractId
        );
        setSubcontract(found || null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subcontract details");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, subcontractId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUploadReport = async (file: File) => {
    if (!projectId || !subcontractId) return;
    setIsUploadingReport(true);
    try {
      const res = await uploadSubcontractReportApi(projectId, subcontractId, file);
      if (res.success) {
        toast.success("Subcontractor completion report uploaded successfully");
        setSubcontract(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload completion report");
    } finally {
      setIsUploadingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    );
  }

  if (!subcontract) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Subcontractor allocation record not found.
        <Button onClick={() => navigate(-1)} className="mt-4 block mx-auto bg-pink-700 text-white font-semibold">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Project: {project?.name || "Loading..."}
        </button>

        <div className="flex items-start justify-between mt-1">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Handshake className="h-6 w-6 text-pink-700 shrink-0" />
              Subcontractor Allocation
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review duties, download reports, and post logs or remarks for this subcontract.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={openEditDialog}
            className="border-pink-200 text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/20 font-semibold h-9 gap-1.5 shrink-0"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Subcontract
          </Button>
        </div>
      </div>

      {/* 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel: Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border shadow-sm rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
              Contract Details
            </h2>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="font-bold uppercase text-[9px] text-muted-foreground block mb-0.5">Contractor Name</span>
                <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                  {subcontract.contractorName}
                </span>
              </div>

              <div>
                <span className="font-bold uppercase text-[9px] text-muted-foreground block mb-0.5">Scope of Work</span>
                <span className="font-medium text-foreground text-xs bg-muted/40 p-3 rounded-lg block whitespace-pre-wrap leading-relaxed border border-border/30">
                  {subcontract.scopeOfWork}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="font-bold uppercase text-[9px] text-muted-foreground block mb-0.5">Contract Value</span>
                  <span className="font-bold text-sm text-pink-705 dark:text-pink-400 flex items-center gap-0.5">
                    <IndianRupee className="h-3.5 w-3.5 shrink-0" />
                    {fmtCurrency(subcontract.value).replace("₹", "")}
                  </span>
                </div>
                <div>
                  <span className="font-bold uppercase text-[9px] text-muted-foreground block mb-0.5">Allocation Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[8px] mt-0.5 ${
                    subcontract.status === "Completed" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/15" :
                    subcontract.status === "Active" ? "bg-blue-500/10 text-blue-600 border border-blue-500/15" :
                    "bg-amber-500/10 text-amber-600 border border-amber-500/15"
                  }`}>
                    {subcontract.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Report Section */}
          <div className="bg-card border border-border shadow-sm rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/60">
              Completion Report
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer bg-pink-700 hover:bg-pink-800 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 transition-all shrink-0">
                  {isUploadingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload Report
                  <input
                    id="subcontractViewUploadField"
                    type="file"
                    accept=".pdf,image/*"
                    disabled={isUploadingReport}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadReport(file);
                    }}
                  />
                </label>
                <span className="text-xs text-muted-foreground truncate">
                  {subcontract.completionReportUrl ? "Report attached" : "No report uploaded"}
                </span>
              </div>

              {subcontract.completionReportUrl && (
                <div className="flex items-center gap-1.5 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
                  <a
                    href={subcontract.completionReportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
                  >
                    <LinkIcon className="h-3.5 w-3.5" /> View Completion Report
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Remarks Chat */}
        <div className="lg:col-span-3 lg:sticky lg:top-6 lg:self-start">
          <RemarksChat
            entityType="subcontract"
            entityId={subcontractId!}
            layout="stacked"
          />
        </div>
      </div>

      {/* EDIT SUBCONTRACT DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Edit Subcontractor Allocation
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 mt-3">
            <div>
              <Label htmlFor="editContractorName">Contractor Name *</Label>
              <Input
                id="editContractorName"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                placeholder="Company or Contractor Name..."
                className="mt-1 text-sm h-9"
                required
              />
            </div>

            <div>
              <Label htmlFor="editScopeOfWork">Scope of Work *</Label>
              <Textarea
                id="editScopeOfWork"
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                placeholder="Describe scope, duties, or deliverables..."
                className="mt-1 text-sm"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editSubcontractValue">Contract Value (INR) *</Label>
                <Input
                  id="editSubcontractValue"
                  type="number"
                  value={value || ""}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="mt-1 text-sm h-9"
                  required
                />
              </div>

              <div>
                <Label>Status *</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-pink-700 hover:bg-pink-805 text-white font-semibold h-9 text-xs"
              >
                {isSaving ? "Saving..." : "Update Allocation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

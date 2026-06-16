import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, Building, ShieldCheck, FolderKanban, Loader2, Edit2, RefreshCw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { RemarksChat } from "../../components/RemarksChat";
import { TableStatusBadge } from "../../components/tableCells";
import { getWarrantyByIdApi, updateWarrantyApi } from "../../api/warranty.api";
import { Warranty } from "../../interfaces/warranty.interface";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { AmcFormModal } from "../../components/AmcFormModal";

const statusTone = (s: Warranty["status"]) => {
  if (s === "Active") return "green" as const;
  if (s === "Expiring Soon") return "amber" as const;
  if (s === "Expired") return "red" as const;
  return "blue" as const;
};

export function WarrantyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [warranty, setWarranty] = useState<Warranty | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Warranty States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStatus, setEditStatus] = useState<Warranty["status"]>("Active");
  const [editRemarks, setEditRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // AMC Conversion State
  const [isAmcModalOpen, setIsAmcModalOpen] = useState(false);

  useEffect(() => {
    async function fetchWarranty() {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await getWarrantyByIdApi(id);
        if (res.success) {
          setWarranty(res.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load warranty details");
      } finally {
        setIsLoading(false);
      }
    }
    fetchWarranty();
  }, [id]);

  const openEditDialog = () => {
    if (!warranty) return;
    setEditProduct(warranty.product);
    setEditStartDate(warranty.startDate ? new Date(warranty.startDate).toISOString().split("T")[0] : "");
    setEditEndDate(warranty.endDate ? new Date(warranty.endDate).toISOString().split("T")[0] : "");
    setEditStatus(warranty.status);
    setEditRemarks(warranty.remarks || "");
    setIsEditDialogOpen(true);
  };

  const handleStartDateChange = (val: string) => {
    setEditStartDate(val);
    const newEnd = new Date(val);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    setEditEndDate(newEnd.toISOString().split("T")[0]);
  };

  const handleUpdateWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !warranty) return;
    if (!editProduct.trim()) {
      toast.error("Product name/description is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Warranty> = {
        product: editProduct.trim(),
        startDate: new Date(editStartDate).toISOString(),
        endDate: new Date(editEndDate).toISOString(),
        status: editStatus,
        remarks: editRemarks.trim() || "",
      };
      
      const res = await updateWarrantyApi(id, payload);
      if (res.success) {
        toast.success("Warranty updated successfully");
        setWarranty(res.data);
        setIsEditDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update warranty");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    );
  }

  if (!warranty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
        <span className="text-sm">Warranty record not found</span>
        <Button variant="outline" onClick={() => navigate("/warranty-management")}>
          Back to Warranty Management
        </Button>
      </div>
    );
  }

  const client = typeof warranty.clientRef === "object" ? warranty.clientRef : null;
  const project = typeof warranty.projectRef === "object" ? warranty.projectRef : null;

  const clientName = client ? client.companyName : "Unknown Client";
  const contactPerson = client ? client.contactPerson : "—";
  const clientPhone = client ? client.phone : "";
  const clientEmail = client ? client.email : "";
  const clientLocation = client ? `${client.address || ""}, ${client.city}` : "—";

  return (
    <div className="h-full bg-background">
      <ScrollArea className="h-full">
        <div className="p-2 lg:p-4">
          <div className="mx-auto space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              {/* Header Card */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/warranty-management")}
                      className="gap-2 h-9 px-3 hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="font-medium">Back</span>
                    </Button>
                    <div className="h-8 w-px bg-border hidden md:block" />
                    <div>
                      <h1 className="text-xl font-bold text-foreground tracking-tight">{warranty.warrantyNo}</h1>
                      <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                        {clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    {warranty.status !== "Claimed" && (
                      <Button
                        size="sm"
                        onClick={() => setIsAmcModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 gap-1.5"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Convert to AMC
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openEditDialog}
                      className="border-pink-200 text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/20 font-semibold h-9 gap-1.5"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Warranty
                    </Button>
                    <TableStatusBadge label={warranty.status} tone={statusTone(warranty.status)} />
                  </div>
                </div>

                {/* Tabs Selector */}
                <div className="px-4 lg:px-5">
                  <TabsList className="w-fit h-12 bg-transparent p-0 rounded inline-flex flex-nowrap justify-start gap-6 lg:gap-8">
                    <TabsTrigger
                      value="overview"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="remarks"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Remarks
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* OVERVIEW CONTENT */}
              <TabsContent value="overview" className="m-0 space-y-4">
                {(warranty.status === "Expired" || warranty.status === "Expiring Soon") && (
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                    warranty.status === "Expired" 
                      ? "bg-red-500/10 border-red-200 text-red-900 dark:text-red-200" 
                      : "bg-amber-500/10 border-amber-200 text-amber-900 dark:text-amber-200"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        warranty.status === "Expired" ? "bg-red-100 dark:bg-red-950/40 text-red-600" : "bg-amber-100 dark:bg-amber-950/40 text-amber-600"
                      }`}>
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">
                          {warranty.status === "Expired" 
                            ? `This warranty expired on ${new Date(warranty.endDate).toLocaleDateString()}` 
                            : `This warranty is expiring soon (on ${new Date(warranty.endDate).toLocaleDateString()})`
                          }
                        </h4>
                        <p className="text-xs opacity-90 mt-0.5">
                          Contact the client to renew their coverage and convert this warranty to an AMC contract.
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsAmcModalOpen(true)}
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8.5 gap-1.5 self-start sm:self-auto"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Convert to AMC
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left Main Panels */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Warranty Details */}
                    <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                        <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-4.5 w-4.5 text-pink-700" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Warranty Coverage</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="sm:col-span-2">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Product / Asset Description</span>
                          <p className="mt-1 text-foreground font-semibold text-base leading-snug">{warranty.product}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Warranty Number</span>
                          <span className="font-semibold text-foreground">{warranty.warrantyNo}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Status</span>
                          <div className="mt-1">
                            <TableStatusBadge label={warranty.status} tone={statusTone(warranty.status)} />
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Start Date</span>
                          <div className="mt-1 flex items-center gap-1.5 text-foreground font-semibold">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(warranty.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">End Date</span>
                          <div className="mt-1 flex items-center gap-1.5 text-foreground font-semibold">
                            <Calendar className="h-4 w-4 text-pink-600" />
                            <span>{new Date(warranty.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {warranty.remarks && (
                        <div className="pt-4 border-t border-border/50">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Conditions / Warranty Notes</span>
                          <p className="mt-1.5 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{warranty.remarks}</p>
                        </div>
                      )}
                    </div>

                    {/* Linked Project Ref */}
                    {project && (
                      <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                          <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                            <FolderKanban className="h-4.5 w-4.5 text-pink-700" />
                          </div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Project Reference</h3>
                        </div>
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Project Number</p>
                            <p className="font-semibold text-sm text-foreground mt-0.5">
                              {project.projectNo} – {project.name}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="gap-1.5 h-8 text-xs font-semibold"
                          >
                            View Project Details
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Client Details */}
                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4 h-fit">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Building className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Client Details</h3>
                    </div>
                    
                    <div className="text-sm space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Company / Client</span>
                        <span className="font-semibold text-foreground text-base">{clientName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Person</span>
                        <span className="font-semibold text-foreground">{contactPerson}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Phone</span>
                        <span className="font-semibold text-foreground">{clientPhone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Email</span>
                        <span className="font-semibold text-foreground">{clientEmail || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Location</span>
                        <span className="font-semibold text-foreground text-xs">{clientLocation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* REMARKS CONTENT */}
              <TabsContent value="remarks" className="m-0">
                <RemarksChat
                  entityType="warranty"
                  entityId={warranty.id!}
                  disabled={warranty.status === "Expired"}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      {/* EDIT WARRANTY DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-5 w-5 text-pink-700" />
              Edit Warranty Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Modify coverage parameters, status, and conditions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateWarranty} className="space-y-4 mt-3">
            <div>
              <Label htmlFor="editProductInput">Product / Scope of Warranty *</Label>
              <Input
                id="editProductInput"
                value={editProduct}
                onChange={(e) => setEditProduct(e.target.value)}
                placeholder="Product name/system name..."
                className="mt-1 text-sm h-9 text-foreground"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editStartDateInput">Start Date *</Label>
                <Input
                  id="editStartDateInput"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="mt-1 text-sm h-9 text-foreground"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editEndDateInput">End Date *</Label>
                <Input
                  id="editEndDateInput"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="mt-1 text-sm h-9 text-foreground"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editStatusInput">Warranty Status *</Label>
              <Select value={editStatus} onValueChange={(val: any) => setEditStatus(val)}>
                <SelectTrigger id="editStatusInput" className="mt-1 h-9 text-sm text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Claimed">Claimed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="editRemarksInput">Description / Warranty Conditions</Label>
              <Textarea
                id="editRemarksInput"
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Specify warranty terms, parts covered..."
                className="mt-1 text-sm text-foreground bg-card"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving} className="h-9 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-pink-700 hover:bg-pink-800 text-white font-semibold h-9 text-xs flex items-center gap-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* CONVERT TO AMC MODAL */}
      {client && (
        <AmcFormModal
          isOpen={isAmcModalOpen}
          onClose={() => setIsAmcModalOpen(false)}
          onSuccess={() => {
            setIsAmcModalOpen(false);
            toast.success("Successfully converted warranty to AMC contract!");
            navigate("/amc");
          }}
          contract={null}
          initialClientId={client.id || client._id}
        />
      )}
      </ScrollArea>
    </div>
  );
}

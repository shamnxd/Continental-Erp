import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { AppRoute } from "../../constants/routes.enum";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building,
  Calendar,
  CalendarDays,
  ChevronDown,
  Clock,
  User,
  FileText,
  Download,
  Upload,
  AlertCircle,
  Loader2,
  UserPlus,
  MessageSquare,
  RefreshCw,
  Pencil,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cn } from "../../lib/utils";
import { Schedules } from "../../components/Schedules";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  getEnquiryByIdApi,
  updateEnquiryApi,
  addEnquiryRemarkApi,
  updateEnquiryRemarkApi,
  uploadEnquiryDrawingApi,
} from "../../api/enquiry.api";
import { getClientsApi } from "../../api/client.api";
import { Enquiry, EnquiryActivity, EnquiryActivityType, EnquiryStatus } from "../../interfaces/enquiry.interface";
import { Client } from "../../interfaces/client.interface";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import { EnquiryFormModal } from "../../components/EnquiryFormModal";
import { RemarksPanel } from "../../components/RemarksPanel";
import { CostingTab } from "./costing/CostingTab";
import { toast } from "sonner";

const ENQUIRY_STATUSES: EnquiryStatus[] = [
  "Site Visit Scheduled",
  "Quotation Prepared",
  "Follow-up Required",
  "Converted to Project",
  "Closed",
];

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    "Site Visit Scheduled": "bg-blue-500/10 text-blue-500",
    "Quotation Prepared": "bg-green-500/10 text-green-500",
    "Follow-up Required": "bg-amber-500/10 text-amber-500",
    "Converted to Project": "bg-purple-500/10 text-purple-500",
    "Converted to Quotation": "bg-purple-500/10 text-purple-500",
    Closed: "bg-slate-500/10 text-slate-600",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
};

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    High: "bg-red-500/10 text-red-500",
    Medium: "bg-amber-500/10 text-amber-500",
    Low: "bg-blue-500/10 text-blue-500",
  };
  return colors[priority] ?? "bg-muted text-muted-foreground";
};

const activityIconClass: Record<EnquiryActivityType, string> = {
  created: "bg-pink-100 text-pink-700",
  assigned: "bg-blue-100 text-blue-700",
  reassigned: "bg-indigo-100 text-indigo-700",
  status_changed: "bg-amber-100 text-amber-700",
  priority_changed: "bg-orange-100 text-orange-700",
  updated: "bg-slate-100 text-slate-700",
  remark_added: "bg-green-100 text-green-700",
  file_uploaded: "bg-purple-100 text-purple-700",
};

function ActivityIcon({ type }: { type: EnquiryActivityType }) {
  const cls = activityIconClass[type] ?? "bg-muted text-muted-foreground";
  if (type === "reassigned" || type === "assigned") {
    return (
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
        <UserPlus className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (type === "remark_added") {
    return (
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
        <MessageSquare className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (type === "status_changed" || type === "priority_changed") {
    return (
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
        <RefreshCw className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (type === "updated" || type === "file_uploaded") {
    return (
      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
        {type === "file_uploaded" ? (
          <Upload className="h-3.5 w-3.5" />
        ) : (
          <Pencil className="h-3.5 w-3.5" />
        )}
      </div>
    );
  }
  return (
    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
      <Calendar className="h-3.5 w-3.5" />
    </div>
  );
}

export function EnquiryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newRemark, setNewRemark] = useState("");
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isSavingReassign, setIsSavingReassign] = useState(false);
  const [isAddingRemark, setIsAddingRemark] = useState(false);
  const [isEditingRemark, setIsEditingRemark] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isClosed = enquiry?.status === "Closed";

  const loadEnquiry = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await getEnquiryByIdApi(id);
      if (res.success) setEnquiry(res.data);
    } catch (err) {
      console.error("Failed to load enquiry", err);
      toast.error("Failed to load enquiry");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEnquiry();
  }, [loadEnquiry]);

  useEffect(() => {
    getClientsApi({ limit: 500 })
      .then((res) => {
        if (res.success) setClients(res.data);
      })
      .catch(() => {});
  }, []);



  const timelineItems = useMemo(() => {
    if (!enquiry) return [];
    const log = enquiry.activityLog ?? [];
    if (log.length > 0) {
      return [...log].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    const fallback: EnquiryActivity[] = [
      {
        type: "created",
        message: "Enquiry created",
        user: "System",
        date: enquiry.createdAt ?? enquiry.date,
      },
    ];
    if (enquiry.assignedTo) {
      fallback.push({
        type: "assigned",
        message: `Assigned to ${enquiry.assignedTo}`,
        user: "System",
        date: enquiry.date,
      });
    }
    return fallback;
  }, [enquiry]);

  const remarks = enquiry?.remarks ?? [];

  const openReassign = () => {
    if (!enquiry) return;
    setSelectedStaffIds(enquiry.assignedStaffId ? [enquiry.assignedStaffId] : []);
    setIsReassignOpen(true);
  };

  const handleSaveReassign = async () => {
    if (!enquiry?.id) return;
    setIsSavingReassign(true);
    try {
      const res = await updateEnquiryApi(enquiry.id, {
        assignedStaffId: selectedStaffIds[0] || "",
      });
      if (res.success) {
        setEnquiry(res.data);
        setIsReassignOpen(false);
        toast.success("Staff reassigned successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reassign staff");
    } finally {
      setIsSavingReassign(false);
    }
  };

  const handleStatusChange = async (newStatus: EnquiryStatus) => {
    if (!enquiry?.id || newStatus === enquiry.status) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateEnquiryApi(enquiry.id, { status: newStatus });
      if (res.success) {
        setEnquiry(res.data);
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCloseEnquiry = async () => {
    if (!enquiry?.id) return;
    setIsClosing(true);
    try {
      const res = await updateEnquiryApi(enquiry.id, { status: "Closed" });
      if (res.success) {
        setEnquiry(res.data);
        setIsCloseConfirmOpen(false);
        toast.success("Enquiry closed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to close enquiry");
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopenEnquiry = async () => {
    if (!enquiry?.id) return;
    setIsUpdatingStatus(true);
    try {
      const res = await updateEnquiryApi(enquiry.id, { status: "Follow-up Required" });
      if (res.success) {
        setEnquiry(res.data);
        toast.success("Enquiry reopened");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reopen enquiry");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !enquiry?.id) return;

    setIsUploading(true);
    try {
      const res = await uploadEnquiryDrawingApi(enquiry.id, file);
      if (res.success) {
        setEnquiry(res.data);
        toast.success("File uploaded successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (drawing: Enquiry["drawings"][0]) => {
    if (drawing.url) {
      window.open(drawing.url, "_blank", "noopener,noreferrer");
      return;
    }
    toast.error("Download link not available for this file");
  };

  const handleAddRemark = async () => {
    if (!enquiry?.id || !newRemark.trim()) return;
    setIsAddingRemark(true);
    try {
      const res = await addEnquiryRemarkApi(enquiry.id, newRemark.trim());
      if (res.success) {
        setEnquiry(res.data);
        setNewRemark("");
        toast.success("Remark added");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add remark");
    } finally {
      setIsAddingRemark(false);
    }
  };

  const handleEditRemark = async (remarkKey: string, text: string) => {
    if (!enquiry?.id) return;
    setIsEditingRemark(true);
    try {
      const res = await updateEnquiryRemarkApi(enquiry.id, remarkKey, text);
      if (res.success) {
        setEnquiry(res.data);
        toast.success("Remark updated");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update remark");
    } finally {
      setIsEditingRemark(false);
    }
  };

  if (isLoading || !enquiry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm">{isLoading ? "Loading enquiry..." : "Enquiry not found"}</span>
        {!isLoading && (
          <Button variant="outline" onClick={() => navigate("/enquiries")}>
            Back to Enquiries
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <ScrollArea className="h-full">
        <div className="p-2 lg:p-0">
          <div className="mx-auto space-y-4">
            <Tabs defaultValue="details" className="space-y-4">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/enquiries")}
                      className="gap-2 h-9 px-3 hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="font-medium">Back</span>
                    </Button>
                    <div className="h-8 w-px bg-border hidden md:block" />
                    <div>
                      <h1 className="text-xl font-bold text-foreground tracking-tight">{enquiry.enquiryNo}</h1>
                      <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                        {enquiry.clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-full ${getPriorityColor(enquiry.priority)}`}
                    >
                      {enquiry.priority} Priority
                    </span>
                    <Select
                      value={enquiry.status}
                      onValueChange={(v) => handleStatusChange(v as EnquiryStatus)}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger
                        className={`h-9 w-[200px] text-xs font-bold uppercase border-0 shadow-none ${getStatusColor(enquiry.status)}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENQUIRY_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-sm">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!isClosed ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-pink-700 hover:bg-pink-800 h-9 px-4 font-semibold"
                          onClick={() =>
                            enquiry?.id &&
                            navigate(AppRoute.QUOTATION_CREATE, {
                              state: {
                                prefillFromEnquiry: {
                                  enquiryId: enquiry.id,
                                  enquiryNo: enquiry.enquiryNo,
                                  clientId: enquiry.clientId,
                                  clientName: enquiry.clientName,
                                },
                              },
                            })
                          }
                        >
                          Create Quotation
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 px-4 font-semibold gap-1.5"
                            >
                              Actions
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer gap-2">
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                              <span>Edit Enquiry</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={openReassign} className="cursor-pointer gap-2">
                              <UserPlus className="h-4 w-4 text-muted-foreground" />
                              <span>Reassign Staff</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setIsCloseConfirmOpen(true)}
                              className="cursor-pointer gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Close Enquiry</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleReopenEnquiry}
                        disabled={isUpdatingStatus}
                        className="h-9 px-4 font-semibold gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Reopen Enquiry
                      </Button>
                    )}
                  </div>
                </div>
                <div className="px-4 lg:px-5">
                  <TabsList className="w-fit h-12 bg-transparent p-0 rounded inline-flex flex-nowrap justify-start gap-6 lg:gap-8">
                    <TabsTrigger
                      value="details"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Enquiry Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="remarks"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Remarks ({remarks.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="costing"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Costing Sheet
                    </TabsTrigger>
                    <TabsTrigger
                      value="schedules"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Schedules
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="details" className="m-0">
                <div className="space-y-4">
                  {isClosed && (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-slate-600" />
                      <span>
                        This enquiry is <strong>closed</strong>. Use <strong>Reopen Enquiry</strong> to work on it again,
                        or change status from the dropdown above.
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                        <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-pink-600" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Enquiry Information</h3>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-y-3 gap-x-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Enquiry Number</label>
                          <p className="mt-1 text-gray-900 font-semibold">{enquiry.enquiryNo}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Enquiry Date</label>
                          <div className="mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-900">{new Date(enquiry.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Assigned To
                          </label>
                          <p className="mt-0.5 text-sm text-gray-900 font-medium">
                            {enquiry.assignedTo?.trim() || "Unassigned"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase">Follow-up Date</label>
                          <div className="mt-1 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <p className="text-foreground font-medium">
                              {enquiry.followUpDate
                                ? new Date(enquiry.followUpDate).toLocaleDateString()
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Building className="h-4 w-4 text-blue-500" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Client Information</h3>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-y-3 gap-x-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Client Name</label>
                          <p className="mt-1 text-gray-900 font-semibold">{enquiry.clientName}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Contact Person
                          </label>
                          <p className="mt-0.5 text-sm text-gray-900 font-medium">{enquiry.contactPerson}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Phone</label>
                          <div className="mt-1 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-900">{enquiry.phone}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                          <div className="mt-1 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-900">{enquiry.email || "—"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-green-500" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Requirement</h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Service Required
                          </label>
                          <p className="mt-0.5 text-gray-900 font-semibold text-base">{enquiry.requirement}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Description
                          </label>
                          <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{enquiry.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-purple-500" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Drawings & Documents</h3>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.dwg"
                        onChange={handleFileChange}
                      />
                      <Button
                        size="sm"
                        className="gap-2 h-8"
                        onClick={handleUploadClick}
                        disabled={isUploading || isClosed}
                      >
                        {isUploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>

                    {enquiry.drawings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {enquiry.drawings.map((drawing, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-blue-700" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate">{drawing.name}</p>
                                <p className="text-xs text-gray-500">
                                  {drawing.uploadedBy} • {new Date(drawing.uploadDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-2 flex-shrink-0"
                              onClick={() => handleDownload(drawing)}
                              disabled={!drawing.url}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium mb-1">No drawings uploaded yet</p>
                        <p className="text-sm text-muted-foreground">
                          Upload site drawings, floor plans, or technical documents
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <h3 className="text-base font-semibold text-foreground mb-4">Activity Timeline</h3>
                    {timelineItems.length > 0 ? (
                      <div className="space-y-0">
                        {timelineItems.map((item, idx) => (
                          <div key={`${item.type}-${item.date}-${idx}`} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <ActivityIcon type={item.type} />
                              {idx < timelineItems.length - 1 && (
                                <div className="w-px flex-1 bg-border mt-2 min-h-[16px]" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm font-medium text-gray-900">{item.message}</p>
                              <p className="text-[11px] text-gray-500">
                                {new Date(item.date).toLocaleString()} • {item.user}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic text-center py-6">No activity recorded yet.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="remarks" className="m-0">
                <RemarksPanel
                  remarks={remarks}
                  newRemark={newRemark}
                  onNewRemarkChange={setNewRemark}
                  onAddRemark={handleAddRemark}
                  onEditRemark={handleEditRemark}
                  isSubmitting={isAddingRemark}
                  isEditingRemark={isEditingRemark}
                  disabled={isClosed}
                  emptyMessage="No remarks recorded yet."
                  placeholder="Add follow-up notes or site visit observations..."
                />
              </TabsContent>

              <TabsContent value="costing" className="m-0">
                <CostingTab enquiry={enquiry} />
              </TabsContent>

              <TabsContent value="schedules" className="m-0">
                <Schedules
                  entityId={enquiry.id ?? ""}
                  entityType="enquiry"
                  entityNo={enquiry.enquiryNo}
                  clientName={enquiry.clientName}
                  title={enquiry.requirement}
                  onSuccess={loadEnquiry}
                  isClosed={isClosed}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>

      <EnquiryFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          setIsEditOpen(false);
          loadEnquiry();
        }}
        enquiry={enquiry}
        clients={clients}
        onClientsRefresh={() => {
          getClientsApi({ limit: 500 }).then((res) => {
            if (res.success) setClients(res.data);
          });
        }}
      />

      <AlertDialog open={isCloseConfirmOpen} onOpenChange={setIsCloseConfirmOpen}>
        <AlertDialogContent className="bg-card border border-border shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Close this enquiry?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Closing marks enquiry {enquiry.enquiryNo} as finished. You can reopen it later if needed. This will be
              recorded in the activity timeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-semibold" disabled={isClosing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseEnquiry}
              disabled={isClosing}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isClosing ? "Closing..." : "Close Enquiry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Reassign Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <StaffSelectDropdown
              selected={selectedStaffIds}
              onChange={(ids) => setSelectedStaffIds(ids.slice(-1))}
              label="Assign To"
              placement="top"
              nameById={
                enquiry.assignedStaffId && enquiry.assignedTo
                  ? { [enquiry.assignedStaffId]: enquiry.assignedTo }
                  : undefined
              }
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={() => setIsReassignOpen(false)} className="font-bold">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReassign}
                disabled={isSavingReassign}
                className="bg-pink-700 hover:bg-pink-800 text-white font-bold"
              >
                {isSavingReassign ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

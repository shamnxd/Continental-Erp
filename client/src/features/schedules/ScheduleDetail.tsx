import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Clock,
  Loader2,
  Check,
  Edit,
  Trash2,
  CalendarDays,
  Link as LinkIcon,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import { RemarksChat } from "../../components/RemarksChat";
import {
  getScheduleByIdApi,
  updateScheduleApi,
  deleteScheduleApi,
  completeScheduleApi,
} from "../../api/schedule.api";
import { getStaffApi } from "../../api/staff.api";
import { Schedule } from "../../interfaces/schedule.interface";
import { AppRoute } from "../../constants/routes.enum";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────

const typeColorMap: Record<string, string> = {
  "Follow-up": "bg-amber-500/10 text-amber-700 border-amber-300/50",
  "AMC Visit": "bg-purple-500/10 text-purple-700 border-purple-300/50",
  "Schedule Visit": "bg-blue-500/10 text-blue-700 border-blue-300/50",
  "Enquiry Visit": "bg-blue-500/10 text-blue-700 border-blue-300/50",
  "Complaint Resolution": "bg-red-500/10 text-red-700 border-red-300/50",
  "Project Installation": "bg-green-500/10 text-green-700 border-green-300/50",
  "Minor Job": "bg-teal-500/10 text-teal-700 border-teal-300/50",
};

const statusColorMap: Record<string, string> = {
  Scheduled: "bg-pink-500/10 text-pink-700 border-pink-300/50",
  Pending: "bg-amber-500/10 text-amber-700 border-amber-300/50",
  "In Progress": "bg-blue-500/10 text-blue-700 border-blue-300/50",
  Completed: "bg-green-500/10 text-green-700 border-green-300/50",
  Cancelled: "bg-slate-500/10 text-slate-600 border-slate-300/50",
};

function fmtLongDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function entityLabel(entityType: string): string {
  const map: Record<string, string> = {
    enquiry: "Enquiry",
    complaint: "Complaint",
    amc: "AMC Contract",
    project: "Project",
    minorjob: "Minor Job",
  };
  return map[entityType] ?? entityType;
}

function entityRoute(schedule: Schedule): string | null {
  switch (schedule.entityType) {
    case "enquiry": return `/enquiries/${schedule.entityId}`;
    case "complaint": return `/complaints/${schedule.entityId}`;
    case "amc": return `/amc/${schedule.entityId}`;
    case "project": return `/projects/${schedule.entityId}`;
    case "minorjob": return `/minor-jobs/${schedule.entityId}`;
    default: return null;
  }
}

function smrCreateRoute(schedule: Schedule): string | null {
  if (schedule.entityType === "amc" && schedule.scheduleType === "AMC Visit" && schedule.id) {
    return `/amc/${schedule.entityId}/visits/${schedule.id}/smr/create`;
  }
  if (schedule.entityType === "complaint" && schedule.entityId) {
    return `/complaints/${schedule.entityId}/smr/create`;
  }
  return null;
}

const tabTriggerClass =
  "flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/30 data-[state=active]:shadow-none data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400 px-4 text-sm font-bold transition-all gap-2";

// ─── Component ───────────────────────────────────────────────────────────────

export function ScheduleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Complete dialog
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState("");
  const [completionTime, setCompletionTime] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  // Edit complete dialog
  const [isEditCompleteOpen, setIsEditCompleteOpen] = useState(false);
  const [editCompletionDate, setEditCompletionDate] = useState("");
  const [editCompletionTime, setEditCompletionTime] = useState("");
  const [editCompletionNotes, setEditCompletionNotes] = useState("");
  const [editCompletionFiles, setEditCompletionFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<Schedule["status"]>("Scheduled");
  const [editNotes, setEditNotes] = useState("");
  const [editStaffIds, setEditStaffIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSchedule = async (showSpinner = true) => {
    if (!id) return;
    if (showSpinner) setIsLoading(true);
    try {
      const res = await getScheduleByIdApi(id);
      if (res.success) setSchedule(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load schedule details");
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
    getStaffApi({ limit: 200, activeOnly: true })
      .then((res) => { if (res.success) setStaffList(res.data); })
      .catch(console.error);
  }, [id]);

  const openComplete = () => {
    const now = new Date();
    setCompletionDate(now.toISOString().split("T")[0]);
    setCompletionTime(now.toTimeString().slice(0, 5));
    setCompletionNotes("");
    setCompletionFiles([]);
    setIsCompleteOpen(true);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !schedule) return;
    if (!completionDate) { toast.error("Please select a completion date"); return; }
    setIsCompleting(true);
    try {
      const completedAt = new Date(`${completionDate}T${completionTime || "00:00"}`).toISOString();

      const res = await completeScheduleApi(id, {
        completedAt,
        completionNotes: completionNotes.trim(),
        files: completionFiles,
      });

      if (res.success) {
        setSchedule(res.data);
        setIsCompleteOpen(false);
        toast.success("Schedule marked as completed");
        const smrRoute = smrCreateRoute(res.data);
        if (smrRoute) {
          toast("Would you like to create an SMR report?", {
            action: { label: "Create SMR", onClick: () => navigate(smrRoute) },
            duration: 8000,
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete schedule");
    } finally {
      setIsCompleting(false);
    }
  };

  const openEditComplete = () => {
    if (!schedule) return;
    const d = schedule.completedAt ? new Date(schedule.completedAt) : new Date();
    setEditCompletionDate(d.toISOString().split("T")[0]);
    setEditCompletionTime(d.toTimeString().slice(0, 5));
    setEditCompletionNotes(schedule.completionNotes || "");
    setExistingAttachments(schedule.completionAttachments || []);
    setEditCompletionFiles([]);
    setIsEditCompleteOpen(true);
  };

  const handleEditComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !schedule) return;
    if (!editCompletionDate) { toast.error("Please select a completion date"); return; }
    setIsCompleting(true);
    try {
      const completedAt = new Date(`${editCompletionDate}T${editCompletionTime || "00:00"}`).toISOString();

      const res = await completeScheduleApi(id, {
        completedAt,
        completionNotes: editCompletionNotes.trim(),
        files: editCompletionFiles,
        existingAttachments,
      });

      if (res.success) {
        setSchedule(res.data);
        setIsEditCompleteOpen(false);
        toast.success("Completion record updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update completion record");
    } finally {
      setIsCompleting(false);
    }
  };

  const openEdit = () => {
    if (!schedule) return;
    setEditDate(schedule.scheduledDate ? new Date(schedule.scheduledDate).toISOString().split("T")[0] : "");
    setEditStatus(schedule.status);
    setEditNotes(schedule.notes || "");
    setEditStaffIds(schedule.assignedStaffIds || []);
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSaving(true);
    try {
      const selectedStaffNames = editStaffIds
        .map((sid) => staffList.find((s) => (s.id || s._id) === sid)?.fullName)
        .filter(Boolean);
      const res = await updateScheduleApi(id, {
        scheduledDate: new Date(editDate).toISOString(),
        status: editStatus,
        notes: editNotes,
        assignedStaffIds: editStaffIds,
        assignedTo: selectedStaffNames,
      });
      if (res.success) {
        setSchedule(res.data);
        setIsEditOpen(false);
        toast.success("Schedule updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const res = await deleteScheduleApi(id);
      if (res.success) {
        toast.success("Schedule deleted successfully");
        navigate(AppRoute.SCHEDULES);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete schedule");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const staffNameById = staffList.reduce((acc, curr) => {
    const sid = curr.id || curr._id;
    if (sid) acc[sid] = curr.fullName;
    return acc;
  }, {} as Record<string, string>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
        <span className="text-sm">Schedule not found</span>
        <Button variant="outline" onClick={() => navigate(AppRoute.SCHEDULES)}>Back to Schedules</Button>
      </div>
    );
  }

  const linkedRoute = entityRoute(schedule);
  const smrRoute = smrCreateRoute(schedule);
  const isClosed = schedule.status === "Completed" || schedule.status === "Cancelled";

  return (
    <div className="h-full bg-background">
      <ScrollArea className="h-full">
        <div className="p-2 lg:p-0">
          <div className="mx-auto space-y-4">

            {/* Header */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={() => navigate(AppRoute.SCHEDULES)} className="gap-2 h-9 px-3 hover:bg-muted">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="font-medium">Back</span>
                  </Button>
                  <div className="h-8 w-px bg-border hidden md:block" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold text-foreground tracking-tight">{schedule.entityNo}</h1>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${typeColorMap[schedule.scheduleType] ?? "bg-muted text-muted-foreground border-border"}`}>
                        {schedule.scheduleType}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{schedule.clientName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                  {!isClosed && (
                    <Button size="sm" onClick={openComplete} className="h-9 gap-1.5 bg-pink-700 hover:bg-pink-800 text-white font-semibold text-xs">
                      <Check className="h-4 w-4" />Mark Complete
                    </Button>
                  )}
                  {smrRoute && (
                    <Button size="sm" onClick={() => navigate(smrRoute)} className="h-9 gap-1.5 bg-pink-700 hover:bg-pink-800 text-white font-semibold text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {schedule.smrId ? "View SMR" : "Create SMR"}
                    </Button>
                  )}
                  {!isClosed && (
                    <Button variant="outline" size="sm" onClick={openEdit} className="h-9 gap-1.5 font-semibold text-xs">
                      <Edit className="h-3.5 w-3.5 text-blue-600" />Edit
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(true)} className="h-9 gap-1.5 text-red-600 border-red-200 hover:bg-red-50 font-semibold text-xs">
                    <Trash2 className="h-3.5 w-3.5" />Delete
                  </Button>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${statusColorMap[schedule.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                    {schedule.status}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 lg:px-5">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-fit h-12 bg-transparent p-0 rounded inline-flex flex-nowrap justify-start gap-6 lg:gap-8">
                    <TabsTrigger value="overview" className={tabTriggerClass}>
                      <FileText className="h-4 w-4" />Overview
                    </TabsTrigger>
                    <TabsTrigger value="remarks" className={tabTriggerClass}>
                      <MessageSquare className="h-4 w-4" />Remarks
                    </TabsTrigger>
                  </TabsList>

                  {/* OVERVIEW */}
                  <TabsContent value="overview" className="m-0 pt-4 pb-5">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-muted/30 rounded-xl border border-border p-5 space-y-5">
                          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                            <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                              <Calendar className="h-4 w-4 text-pink-700" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Schedule Details</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Scheduled Date</span>
                              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                                <Calendar className="h-4 w-4 text-pink-600" />
                                {fmtLongDate(schedule.scheduledDate)}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Schedule Type</span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${typeColorMap[schedule.scheduleType] ?? "bg-muted text-muted-foreground border-border"}`}>
                                {schedule.scheduleType}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Title / Subject</span>
                              <span className="font-semibold text-foreground">{schedule.title}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Status</span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusColorMap[schedule.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                                {schedule.status}
                              </span>
                            </div>
                            {schedule.notes && (
                              <div className="sm:col-span-2 pt-3 border-t border-border/40">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Notes</span>
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{schedule.notes}</p>
                              </div>
                            )}
                            {schedule.status === "Completed" && schedule.completedAt && (
                              <div className="sm:col-span-2 pt-3 border-t border-border/40 space-y-3">
                                <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-green-50 rounded-lg border border-green-200/60 dark:bg-green-950/20 dark:border-green-800/40">
                                  <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-green-700 dark:text-green-400 block">Completed On</span>
                                      <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                                        {new Date(schedule.completedAt).toLocaleString("en-IN", {
                                          weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={openEditComplete}
                                    className="h-8 px-2 text-green-700 hover:bg-green-100 hover:text-green-800 font-semibold gap-1 text-xs shrink-0 bg-transparent shadow-none"
                                  >
                                    <Edit className="h-3.5 w-3.5" /> Edit Completion
                                  </Button>
                                </div>

                                {schedule.completionNotes && (
                                  <div className="bg-card rounded-lg border border-border p-3">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Completion Notes</span>
                                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{schedule.completionNotes}</p>
                                  </div>
                                )}

                                {schedule.completionAttachments && schedule.completionAttachments.length > 0 && (
                                  <div className="bg-card rounded-lg border border-border p-3">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">Completion Attachments</span>
                                    <div className="grid grid-cols-1 gap-2">
                                      {schedule.completionAttachments.map((att, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-lg border border-border/40">
                                          <div className="flex items-center gap-3 overflow-hidden">
                                            {att.mimeType.startsWith("image/") ? (
                                              <div className="h-16 w-16 rounded bg-muted border border-border/60 overflow-hidden flex items-center justify-center shrink-0">
                                                <img
                                                  src={att.url}
                                                  alt={att.name}
                                                  className="h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                                  onClick={() => window.open(att.url, "_blank")}
                                                />
                                              </div>
                                            ) : (
                                              <div className="h-16 w-16 rounded bg-muted border border-border/60 flex items-center justify-center shrink-0">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                              </div>
                                            )}
                                            <div className="overflow-hidden">
                                              <p className="text-xs font-semibold text-foreground truncate">{att.name}</p>
                                              <p className="text-[10px] text-muted-foreground">{(att.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(att.url, "_blank")}
                                            className="h-8 text-xs shrink-0 font-semibold"
                                          >
                                            View File
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Assigned Staff */}
                        <div className="bg-muted/30 rounded-xl border border-border p-5">
                          <div className="flex items-center gap-2 pb-3 border-b border-border/50 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Assigned Staff</h3>
                          </div>
                          {schedule.assignedTo && schedule.assignedTo.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {schedule.assignedTo.map((name, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-sm font-semibold text-foreground">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />{name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No staff assigned</p>
                          )}
                        </div>
                      </div>

                      {/* Right sidebar */}
                      <div className="space-y-4">
                        <div className="bg-muted/30 rounded-xl border border-border p-5">
                          <div className="flex items-center gap-2 pb-3 border-b border-border/50 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                              <LinkIcon className="h-4 w-4 text-amber-600" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Linked Entity</h3>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Type</span>
                              <span className="font-semibold text-foreground">{entityLabel(schedule.entityType)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Reference</span>
                              <span className="font-semibold text-foreground">{schedule.entityNo}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Client</span>
                              <span className="font-semibold text-foreground">{schedule.clientName}</span>
                            </div>
                            {linkedRoute && (
                              <div className="pt-3 border-t border-border/40">
                                <Button variant="outline" size="sm" onClick={() => navigate(linkedRoute)} className="w-full h-9 text-xs font-semibold gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50">
                                  <LinkIcon className="h-3.5 w-3.5" />View {entityLabel(schedule.entityType)}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {smrRoute && (
                          <div className="bg-muted/30 rounded-xl border border-border p-5">
                            <div className="flex items-center gap-2 pb-3 border-b border-border/50 mb-4">
                              <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-pink-700" />
                              </div>
                              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">SMR Report</h3>
                            </div>
                            {schedule.smrId ? (
                              <Button variant="outline" size="sm" onClick={() => navigate(smrRoute)} className="w-full h-9 text-xs font-semibold gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-pink-700" />View SMR Report
                              </Button>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">No SMR report created yet.</p>
                                {schedule.status === "Completed" && (
                                  <Button size="sm" onClick={() => navigate(smrRoute)} className="w-full h-9 text-xs font-semibold gap-1.5 bg-pink-700 hover:bg-pink-800 text-white">
                                    <CheckCircle2 className="h-3.5 w-3.5" />Create SMR Report
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="bg-muted/30 rounded-xl border border-border p-5">
                          <div className="flex items-center gap-2 pb-3 border-b border-border/50 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Timeline</h3>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Created</span>
                              <span className="text-foreground font-medium">
                                {schedule.createdAt ? new Date(schedule.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Last Updated</span>
                              <span className="text-foreground font-medium">
                                {schedule.updatedAt ? new Date(schedule.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isClosed && (
                          <div className="bg-card rounded-xl border border-border p-4 text-center flex flex-col items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
                            <p className="text-xs text-muted-foreground italic">This schedule is {schedule.status.toLowerCase()} and cannot be edited.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* REMARKS */}
                  <TabsContent value="remarks" className="m-0 pt-4 pb-5">
                    {schedule.id && (
                      <RemarksChat
                        entityType="schedule"
                        entityId={schedule.id}
                        disabled={isClosed}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Mark Complete Dialog */}
      <Dialog open={isCompleteOpen} onOpenChange={(open) => !open && setIsCompleteOpen(false)}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />Mark Schedule as Completed
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleComplete} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="completionDate" className="text-xs font-semibold">Completion Date *</Label>
                <Input id="completionDate" type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="completionTime" className="text-xs font-semibold">Time</Label>
                <Input id="completionTime" type="time" value={completionTime} onChange={(e) => setCompletionTime(e.target.value)} className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="completionNotes" className="text-xs font-semibold">Completion Notes (Optional)</Label>
              <Textarea id="completionNotes" placeholder="Work done, outcomes, observations..." value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} className="text-xs min-h-[80px]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="completionFiles" className="text-xs font-semibold">Completion Images / Attachments (Optional)</Label>
              <Input
                id="completionFiles"
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    setCompletionFiles(Array.from(files));
                  } else {
                    setCompletionFiles([]);
                  }
                }}
                className="border-0 bg-transparent shadow-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 file:bg-pink-50 file:text-pink-700 file:border-0 file:rounded-md file:px-3 file:py-1.5 file:mr-3 hover:file:bg-pink-100 dark:file:bg-pink-950/40 dark:file:text-pink-400 cursor-pointer"
              />
              {completionFiles.length > 0 && (
                <div className="text-[10px] text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border/40 mt-1.5 space-y-1">
                  <p className="font-semibold uppercase tracking-wider text-[9px]">Selected Files ({completionFiles.length}):</p>
                  <div className="max-h-[80px] overflow-y-auto space-y-1 pr-1">
                    {completionFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 bg-card px-2 py-1 rounded border border-border/30">
                        <span className="truncate max-w-[200px] font-medium text-foreground">{file.name}</span>
                        <span className="shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {smrRoute && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200/60 text-xs text-pink-700 dark:text-pink-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>After marking complete, you'll be prompted to create an SMR report.</span>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCompleteOpen(false)} className="h-8 text-xs">Cancel</Button>
              <Button type="submit" size="sm" disabled={isCompleting} className="bg-pink-700 hover:bg-pink-800 text-white h-8 text-xs font-semibold">
                {isCompleting ? "Saving..." : "Mark as Completed"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Completion Dialog */}
      <Dialog open={isEditCompleteOpen} onOpenChange={(open) => !open && setIsEditCompleteOpen(false)}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Edit className="h-4 w-4 text-pink-700" />Edit Completion Record
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditComplete} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editCompletionDate" className="text-xs font-semibold">Completion Date *</Label>
                <Input id="editCompletionDate" type="date" value={editCompletionDate} onChange={(e) => setEditCompletionDate(e.target.value)} className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="editCompletionTime" className="text-xs font-semibold">Time</Label>
                <Input id="editCompletionTime" type="time" value={editCompletionTime} onChange={(e) => setEditCompletionTime(e.target.value)} className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editCompletionNotes" className="text-xs font-semibold">Completion Notes (Optional)</Label>
              <Textarea id="editCompletionNotes" placeholder="Work done, outcomes, observations..." value={editCompletionNotes} onChange={(e) => setEditCompletionNotes(e.target.value)} className="text-xs min-h-[80px]" />
            </div>

            {existingAttachments.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Current Attachments</Label>
                <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1">
                  {existingAttachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-muted/30 px-2 py-1.5 rounded border border-border/40 text-xs">
                      <span className="truncate max-w-[220px] font-medium text-foreground">{att.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent shadow-none"
                        onClick={() => {
                          setExistingAttachments(existingAttachments.filter((_, i) => i !== idx));
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="editCompletionFiles" className="text-xs font-semibold">Add New Images / Attachments (Optional)</Label>
              <Input
                id="editCompletionFiles"
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    setEditCompletionFiles(Array.from(files));
                  } else {
                    setEditCompletionFiles([]);
                  }
                }}
                className="border-0 bg-transparent shadow-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 file:bg-pink-50 file:text-pink-700 file:border-0 file:rounded-md file:px-3 file:py-1.5 file:mr-3 hover:file:bg-pink-100 dark:file:bg-pink-950/40 dark:file:text-pink-400 cursor-pointer"
              />
              {editCompletionFiles.length > 0 && (
                <div className="text-[10px] text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border/40 mt-1.5 space-y-1">
                  <p className="font-semibold uppercase tracking-wider text-[9px]">New Files ({editCompletionFiles.length}):</p>
                  <div className="max-h-[80px] overflow-y-auto space-y-1 pr-1">
                    {editCompletionFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 bg-card px-2 py-1 rounded border border-border/30">
                        <span className="truncate max-w-[200px] font-medium text-foreground">{file.name}</span>
                        <span className="shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditCompleteOpen(false)} className="h-8 text-xs">Cancel</Button>
              <Button type="submit" size="sm" disabled={isCompleting} className="bg-pink-700 hover:bg-pink-800 text-white h-8 text-xs font-semibold">
                {isCompleting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => !open && setIsEditOpen(false)}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">Edit Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="editDate" className="text-xs font-semibold">Scheduled Date *</Label>
              <Input id="editDate" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Schedule["status"])}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <StaffSelectDropdown selected={editStaffIds} onChange={setEditStaffIds} label="Assign To" placement="bottom" nameById={staffNameById} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="editNotes" className="text-xs font-semibold">Notes</Label>
              <Textarea id="editNotes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Additional instructions or notes..." className="text-xs min-h-[70px]" />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)} className="h-8 text-xs">Cancel</Button>
              <Button type="submit" size="sm" disabled={isSaving} className="bg-pink-700 hover:bg-pink-800 text-white h-8 text-xs font-semibold">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={isDeleteOpen} onOpenChange={(open) => !open && setIsDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this schedule? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

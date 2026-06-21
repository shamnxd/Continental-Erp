import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Clock,
  User,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  FileText,
  Check,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { StaffSelectDropdown } from "./StaffSelectDropdown";
import {
  getSchedulesApi,
  createScheduleApi,
  updateScheduleApi,
  deleteScheduleApi,
  completeScheduleApi,
} from "../api/schedule.api";
import { Schedule } from "../interfaces/schedule.interface";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

function smrCreateRoute(schedule: Schedule): string | null {
  if (schedule.entityType === "amc" && schedule.scheduleType === "AMC Visit" && schedule.id) {
    return `/amc/${schedule.entityId}/visits/${schedule.id}/smr/create`;
  }
  if (schedule.entityType === "complaint" && schedule.entityId) {
    return `/complaints/${schedule.entityId}/smr/create`;
  }
  return null;
}

interface SchedulesProps {
  entityId: string;
  entityType: "enquiry" | "complaint" | "amc" | "project" | "minorjob";
  entityNo: string;
  clientName: string;
  clientRef?: string | null;
  title: string;
  onSuccess?: () => void;
  isClosed?: boolean;
}

export function Schedules({
  entityId,
  entityType,
  entityNo,
  clientName,
  clientRef = null,
  title,
  onSuccess,
  isClosed = false,
}: SchedulesProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form / Edit states
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const navigate = useNavigate();

  // Completion states
  const [completeScheduleId, setCompleteScheduleId] = useState<string | null>(null);
  const [completionDateInput, setCompletionDateInput] = useState("");
  const [completionTimeInput, setCompletionTimeInput] = useState("");
  const [completionNotesInput, setCompletionNotesInput] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  // Form fields
  const [dateInput, setDateInput] = useState("");
  const [scheduleType, setScheduleType] = useState<Schedule["scheduleType"]>("Follow-up");
  const [statusInput, setStatusInput] = useState<Schedule["status"]>("Scheduled");
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [notesInput, setNotesInput] = useState("");

  const loadSchedules = useCallback(async () => {
    if (!entityId) return;
    setIsLoading(true);
    try {
      const res = await getSchedulesApi({ entityType, entityId, limit: 100 });
      if (res.success) {
        setSchedules(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load schedules");
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const getRelevantScheduleTypes = useCallback((): Schedule["scheduleType"][] => {
    switch (entityType) {
      case "enquiry":
        return ["Follow-up", "Schedule Visit", "Enquiry Visit"];
      case "complaint":
        return ["Follow-up", "Complaint Resolution"];
      case "amc":
        return ["AMC Visit", "Follow-up"];
      case "project":
        return ["Project Installation", "Follow-up"];
      case "minorjob":
        return ["Minor Job", "Follow-up"];
      default:
        return ["Follow-up"];
    }
  }, [entityType]);

  // Set default schedule type on load / type list update
  useEffect(() => {
    const types = getRelevantScheduleTypes();
    if (!editingSchedule) {
      setScheduleType(types[0]);
    }
  }, [getRelevantScheduleTypes, editingSchedule]);

  const handleOpenAdd = () => {
    const types = getRelevantScheduleTypes();
    setEditingSchedule(null);
    setDateInput(new Date().toISOString().split("T")[0]);
    setScheduleType(types[0]);
    setStatusInput("Scheduled");
    setStaffIds([]);
    setNotesInput("");
  };

  const handleOpenEdit = (sch: Schedule) => {
    setEditingSchedule(sch);
    setDateInput(sch.scheduledDate ? sch.scheduledDate.split("T")[0] : "");
    setScheduleType(sch.scheduleType);
    setStatusInput(sch.status);
    setStaffIds(sch.assignedStaffIds || []);
    setNotesInput(sch.notes || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateInput) {
      toast.error("Date is required");
      return;
    }

    setIsSaving(true);
    const payload: Partial<Schedule> = {
      entityType,
      entityId,
      entityNo,
      clientName,
      clientRef,
      title,
      scheduleType,
      scheduledDate: new Date(dateInput).toISOString(),
      status: statusInput,
      assignedStaffIds: staffIds,
      notes: notesInput,
    };

    try {
      if (editingSchedule?.id) {
        const res = await updateScheduleApi(editingSchedule.id, payload);
        if (res.success) {
          toast.success("Schedule updated successfully");
          handleOpenAdd();
          loadSchedules();
          onSuccess?.();
        }
      } else {
        const res = await createScheduleApi(payload);
        if (res.success) {
          toast.success("Schedule created successfully");
          handleOpenAdd();
          loadSchedules();
          onSuccess?.();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      const res = await deleteScheduleApi(id);
      if (res.success) {
        toast.success("Schedule deleted successfully");
        loadSchedules();
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete schedule");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeScheduleId) return;
    if (!completionDateInput) {
      toast.error("Please select a completion date");
      return;
    }

    setIsCompleting(true);
    try {
      const completedAt = new Date(`${completionDateInput}T${completionTimeInput || "00:00"}`).toISOString();

      const res = await completeScheduleApi(completeScheduleId, {
        completedAt,
        completionNotes: completionNotesInput.trim(),
        files: completionFiles,
      });

      if (res.success) {
        toast.success("Schedule marked as completed successfully");
        setCompleteScheduleId(null);
        loadSchedules();
        onSuccess?.();

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

  const getStatusColorClass = (status: string) => {
    const enquiryColors: Record<string, string> = {
      "Site Visit Scheduled": "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "Follow-up Required": "bg-amber-500/10 text-amber-500 border-amber-500/20",
      Scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };

    const generalColors: Record<string, string> = {
      Scheduled: "bg-pink-500/10 text-pink-600 border-pink-500/20",
      Pending: "bg-amber-500/10 text-amber-550 border-amber-500/20",
      "In Progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
      Completed: "bg-green-500/10 text-green-600 border-green-500/20",
      Cancelled: "bg-slate-500/10 text-slate-500 border-slate-500/20",
      Resolved: "bg-green-500/10 text-green-600 border-green-500/20",
    };

    if (entityType === "enquiry") {
      return enquiryColors[status] ?? generalColors[status] ?? "bg-muted text-muted-foreground";
    }
    return generalColors[status] ?? "bg-muted text-muted-foreground";
  };

  const isFollowUpType = scheduleType === "Follow-up";

  const staffNameByIds = editingSchedule
    ? (editingSchedule.assignedStaffIds || []).reduce((acc, id, idx) => {
        acc[id] = editingSchedule.assignedTo?.[idx] || "";
        return acc;
      }, {} as Record<string, string>)
    : undefined;

  const targetScheduleForComplete = completeScheduleId
    ? schedules.find((s) => s.id === completeScheduleId)
    : null;
  const smrRouteForComplete = targetScheduleForComplete ? smrCreateRoute(targetScheduleForComplete) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Part: Current Schedule View (Col Span 2) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                <CalendarDays className="h-4 w-4 text-pink-600" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Current Schedule</h3>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-pink-700" />
              <span className="text-xs">Loading schedules...</span>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-10 bg-muted/20 rounded-lg border border-dashed border-border p-4">
              <CalendarDays className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <h4 className="font-medium text-foreground text-sm mb-1">No upcoming schedules found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                There are no active visits or follow-ups scheduled for this {entityType}. Use the form to assign a date and status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((sch) => {
                const dateStr = new Date(sch.scheduledDate).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });

                return (
                  <div
                    key={sch.id}
                    className="flex items-center justify-between py-2.5 px-3.5 bg-muted/30 rounded-lg border border-border/60 hover:border-pink-600/30 transition-all gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-full bg-pink-50 flex items-center justify-center shrink-0 border border-pink-100 mt-0.5 animate-pulse">
                        <Clock className="h-4 w-4 text-pink-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-foreground text-[13px]">
                          {sch.scheduleType}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {dateStr}
                        </p>
                        {sch.notes && (
                          <p className="text-[11px] text-muted-foreground mt-1 italic bg-card px-2 py-0.5 rounded border border-border/50 w-fit">
                            Notes: {sch.notes}
                          </p>
                        )}
                        {sch.assignedTo && sch.assignedTo.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground bg-background px-2 py-0.5 rounded-md border w-fit shadow-xs">
                            <User className="h-3 w-3 text-pink-600" />
                            <span>Assigned to: <strong>{sch.assignedTo.join(", ")}</strong></span>
                          </div>
                        )}
                        {sch.status === "Completed" && sch.completedAt && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200/50 w-fit">
                            <Check className="h-3 w-3 text-green-600" />
                            <span>Completed on: <strong>{new Date(sch.completedAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}</strong></span>
                          </div>
                        )}
                        {entityType === "amc" ? (
                          <div className="mt-1">
                            <Link
                              to={`/amc/${entityId}/visits/${sch.id}`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 hover:underline"
                            >
                              <FileText className="h-3 w-3" />
                              {sch.smrId ? "View Linked SMR Report" : "Manage Visit & SMR"}
                            </Link>
                          </div>
                        ) : (
                          sch.smrId && (
                            <div className="mt-1">
                              <Link
                                to={`/complaints/${entityId}`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 hover:underline"
                              >
                                <FileText className="h-3 w-3" />
                                View Linked SMR Report
                              </Link>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0 self-start sm:self-center">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${getStatusColorClass(
                          sch.status
                        )}`}
                      >
                        {sch.status}
                      </span>

                      <div className="flex items-center gap-1">
                        {sch.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-pink-700 hover:bg-pink-50"
                            asChild
                            title="View Details"
                          >
                            <Link to={`/schedules/${sch.id}`}>
                              <Eye className="h-3.5 w-3.5 text-pink-700" />
                            </Link>
                          </Button>
                        )}
                        {!isClosed && !sch.smrId && (
                          <>
                            {sch.status !== "Completed" && sch.status !== "Cancelled" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-bold text-green-700 border-green-200 hover:bg-green-50/70 hover:border-green-300 transition-all gap-1 shadow-2xs"
                                onClick={() => {
                                  if (sch.id) {
                                    setCompleteScheduleId(sch.id);
                                    const now = new Date();
                                    setCompletionDateInput(now.toISOString().split("T")[0]);
                                    setCompletionTimeInput(now.toTimeString().slice(0, 5));
                                    setCompletionNotesInput("");
                                    setCompletionFiles([]);
                                  }
                                }}
                              >
                                <Check className="h-3 w-3 text-green-600" />
                                Complete
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => handleOpenEdit(sch)}
                            >
                              <Edit className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50"
                              onClick={() => sch.id && setConfirmDeleteId(sch.id)}
                              disabled={isDeletingId === sch.id}
                            >
                              {isDeletingId === sch.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-xs text-muted-foreground leading-relaxed bg-amber-500/5 p-3.5 rounded-lg border border-amber-500/10 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              {entityType === "enquiry"
                ? "This event is linked to the active enquiry. Setting a follow-up/site-visit date ensures this enquiry appears on the schedules calendar dashboard."
                : entityType === "complaint"
                ? "This event tracks the target resolution timeline. Keeping it updated prevents breach of client SLA limits."
                : `This event tracks scheduled activities for this ${entityType}.`}
            </span>
          </div>
        </div>
      </div>

      {/* Right Part: Quick Action Form Card (Col Span 1) */}
      <div className="space-y-4">
        {!isClosed ? (
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <CalendarDays className="h-4 w-4 text-blue-500" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {entityType === "enquiry"
                  ? "Schedule a Visit / Follow-up"
                  : entityType === "complaint"
                  ? "Schedule Case Resolution"
                  : `Schedule ${entityType}`}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="schDate" className="text-xs font-semibold text-foreground">
                  {entityType === "enquiry"
                    ? "Schedule Date"
                    : entityType === "complaint"
                    ? "Expected Resolution Date"
                    : "Date"} *
                </Label>
                <Input
                  id="schDate"
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Schedule Type</Label>
                <Select
                  value={scheduleType}
                  onValueChange={(val) => setScheduleType(val as Schedule["scheduleType"])}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getRelevantScheduleTypes().map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Status</Label>
                <Select
                  value={statusInput}
                  onValueChange={(val) => setStatusInput(val as Schedule["status"])}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled" className="text-xs">
                      Scheduled
                    </SelectItem>
                    <SelectItem value="In Progress" className="text-xs">
                      In Progress
                    </SelectItem>
                    <SelectItem value="Completed" className="text-xs">
                      Completed
                    </SelectItem>
                    <SelectItem value="Cancelled" className="text-xs">
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <StaffSelectDropdown
                  selected={staffIds}
                  onChange={(ids) => setStaffIds(isFollowUpType ? ids.slice(-1) : ids)}
                  label="Assign To"
                  placement="bottom"
                  nameById={staffNameByIds}
                />
                {isFollowUpType && staffIds.length > 0 && (
                  <p className="text-[10px] text-muted-foreground italic mt-0.5">
                    Follow-ups are restricted to 1 assigned staff member.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="schNotes" className="text-xs font-semibold text-foreground">
                  Description / Notes
                </Label>
                <Textarea
                  id="schNotes"
                  placeholder="Additional instructions or notes..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="w-full bg-pink-700 hover:bg-pink-800 text-white h-9 text-xs font-semibold gap-1.5 transition-all shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Save Schedule"
                  )}
                </Button>
                {editingSchedule && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAdd}
                    className="w-full h-9 text-xs font-medium"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-5 text-center text-muted-foreground flex flex-col items-center justify-center py-10 gap-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs italic">This {entityType} is closed. Reopen to edit/schedule events.</p>
          </div>
        )}
      </div>

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) {
                  handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={completeScheduleId !== null} onOpenChange={(open) => !open && setCompleteScheduleId(null)}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />Mark Schedule as Completed
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCompleteSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="completionDate" className="text-xs font-semibold text-foreground">
                  Completion Date *
                </Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={completionDateInput}
                  onChange={(e) => setCompletionDateInput(e.target.value)}
                  className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="completionTime" className="text-xs font-semibold text-foreground">
                  Time
                </Label>
                <Input
                  id="completionTime"
                  type="time"
                  value={completionTimeInput}
                  onChange={(e) => setCompletionTimeInput(e.target.value)}
                  className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="completionNotes" className="text-xs font-semibold text-foreground">
                Completion Notes (Optional)
              </Label>
              <Textarea
                id="completionNotes"
                placeholder="Work done, outcomes, observations..."
                value={completionNotesInput}
                onChange={(e) => setCompletionNotesInput(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="completionFiles" className="text-xs font-semibold text-foreground">
                Completion Images / Attachments (Optional)
              </Label>
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

            {smrRouteForComplete && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200/60 text-xs text-pink-700 dark:text-pink-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>After marking complete, you'll be prompted to create an SMR report.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCompleteScheduleId(null)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCompleting}
                className="bg-pink-700 hover:bg-pink-800 text-white h-8 text-xs font-semibold"
              >
                {isCompleting ? "Saving..." : "Mark as Completed"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

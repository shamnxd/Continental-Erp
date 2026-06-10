import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Clock,
  User,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { StaffSelectDropdown } from "./StaffSelectDropdown";
import {
  getSchedulesApi,
  createScheduleApi,
  updateScheduleApi,
  deleteScheduleApi,
} from "../api/schedule.api";
import { Schedule } from "../interfaces/schedule.interface";
import { toast } from "sonner";
import { Link } from "react-router";

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

  // Form / Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

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

  const getRelevantScheduleTypes = (): Schedule["scheduleType"][] => {
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
  };

  const handleOpenAdd = () => {
    const types = getRelevantScheduleTypes();
    setEditingSchedule(null);
    setDateInput(new Date().toISOString().split("T")[0]);
    setScheduleType(types[0]);
    setStatusInput("Scheduled");
    setStaffIds([]);
    setNotesInput("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sch: Schedule) => {
    setEditingSchedule(sch);
    setDateInput(sch.scheduledDate ? sch.scheduledDate.split("T")[0] : "");
    setScheduleType(sch.scheduleType);
    setStatusInput(sch.status);
    setStaffIds(sch.assignedStaffIds || []);
    setNotesInput(sch.notes || "");
    setIsFormOpen(true);
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
          setIsFormOpen(false);
          loadSchedules();
          onSuccess?.();
        }
      } else {
        const res = await createScheduleApi(payload);
        if (res.success) {
          toast.success("Schedule created successfully");
          setIsFormOpen(false);
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

  const getStatusBadgeTone = (status: Schedule["status"]): string => {
    switch (status) {
      case "Completed":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "Cancelled":
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
      case "In Progress":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Pending":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
    }
  };

  // Determine whether to limit staff selection to single staff member
  const isFollowUpType = scheduleType === "Follow-up";

  const staffNameByIds = editingSchedule
    ? (editingSchedule.assignedStaffIds || []).reduce((acc, id, idx) => {
        acc[id] = editingSchedule.assignedTo?.[idx] || "";
        return acc;
      }, {} as Record<string, string>)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Header section with Action Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Schedules & Visits</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage reminders, client calls, and site visits for this record
          </p>
        </div>
        {!isClosed && (
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-pink-700 hover:bg-pink-800 text-white gap-1.5 h-8 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            Schedule Event
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-pink-700" />
          <span className="text-xs">Loading schedules...</span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border p-4">
          <CalendarDays className="h-8 w-8 text-muted-foreground/60 mx-auto mb-3" />
          <h4 className="font-medium text-foreground text-xs mb-1">No schedules found</h4>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            No active follow-ups, visits, or resolution schedules are linked to this record.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((sch) => {
            const dateStr = new Date(sch.scheduledDate).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={sch.id}
                className="bg-card rounded-xl border border-border p-4 shadow-sm hover:border-pink-600/30 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {sch.scheduleType}
                      </span>
                      <h4 className="text-xs font-semibold text-foreground">{dateStr}</h4>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${getStatusBadgeTone(
                        sch.status
                      )}`}
                    >
                      {sch.status}
                    </span>
                  </div>

                  {sch.notes && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/40 p-2 rounded-md italic border border-border/50">
                      {sch.notes}
                    </p>
                  )}

                  {sch.assignedTo && sch.assignedTo.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <User className="h-3.5 w-3.5 text-pink-600 shrink-0" />
                      <span className="text-[11px] text-muted-foreground">
                        Assigned: <strong>{sch.assignedTo.join(", ")}</strong>
                      </span>
                    </div>
                  )}

                  {sch.smrId && (
                    <div className="mt-3">
                      <Link
                        to={
                          entityType === "amc"
                            ? `/amc/${entityId}/visits/${sch.id}`
                            : `/complaints/${entityId}`
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 hover:underline"
                      >
                        <FileText className="h-3 w-3" />
                        View Linked SMR Report
                      </Link>
                    </div>
                  )}
                </div>

                {!isClosed && !sch.smrId && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
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
                      onClick={() => sch.id && handleDelete(sch.id)}
                      disabled={isDeletingId === sch.id}
                    >
                      {isDeletingId === sch.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">
              {editingSchedule ? "Edit Schedule Event" : "Create Schedule Event"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="schDate" className="text-xs font-semibold text-foreground">
                Date *
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

            <div className="space-y-1">
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

            <div className="space-y-1">
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
                  <SelectItem value="Pending" className="text-xs">
                    Pending
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

            <div className="space-y-1">
              <StaffSelectDropdown
                selected={staffIds}
                onChange={(ids) => setStaffIds(isFollowUpType ? ids.slice(-1) : ids)}
                label="Assign Staff"
                placement="top"
                nameById={staffNameByIds}
              />
              {isFollowUpType && staffIds.length > 0 && (
                <p className="text-[10px] text-muted-foreground italic mt-0.5">
                  Follow-ups are restricted to 1 assigned staff member.
                </p>
              )}
            </div>

            <div className="space-y-1">
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

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="bg-pink-700 hover:bg-pink-800 text-white h-8 text-xs font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  "Save Schedule"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

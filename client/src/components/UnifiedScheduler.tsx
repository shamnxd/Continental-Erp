import { useState, useEffect } from "react";
import { CalendarDays, Clock, User, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { StaffSelectDropdown } from "./StaffSelectDropdown";
import { updateEnquiryApi } from "../api/enquiry.api";
import { updateComplaintApi } from "../api/complaint.api";
import { toast } from "sonner";

interface UnifiedSchedulerProps {
  entityId: string;
  entityType: "enquiry" | "complaint";
  currentDate?: string | null;
  currentStatus: string;
  assignedStaffIds: string[];
  assignedName?: string | null;
  onSuccess: (updatedData: any) => void;
  isClosed?: boolean;
}

export function UnifiedScheduler({
  entityId,
  entityType,
  currentDate,
  currentStatus,
  assignedStaffIds,
  assignedName,
  onSuccess,
  isClosed = false,
}: UnifiedSchedulerProps) {
  const [dateInput, setDateInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setDateInput(currentDate ? currentDate.split("T")[0] : "");
    setStatusInput(currentStatus);
    setStaffIds(assignedStaffIds);
  }, [currentDate, currentStatus, assignedStaffIds]);

  const handleSave = async () => {
    if (!entityId) return;
    setIsUpdating(true);
    try {
      if (entityType === "enquiry") {
        const res = await updateEnquiryApi(entityId, {
          followUpDate: dateInput ? new Date(dateInput).toISOString() : null,
          status: statusInput as any,
          assignedStaffId: staffIds[0] || "",
        });
        if (res.success) {
          onSuccess(res.data);
          toast.success("Enquiry schedule updated successfully");
        }
      } else {
        const res = await updateComplaintApi(entityId, {
          expectedResolution: dateInput ? new Date(dateInput).toISOString() : null,
          status: statusInput as any,
          assignedStaffIds: staffIds,
        });
        if (res.success) {
          onSuccess(res.data);
          toast.success("Complaint schedule updated successfully");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update ${entityType} schedule`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColorClass = (status: string) => {
    const enquiryColors: Record<string, string> = {
      "Site Visit Scheduled": "bg-blue-500/10 text-blue-500",
      "Follow-up Required": "bg-amber-500/10 text-amber-500",
    };

    const complaintColors: Record<string, string> = {
      Pending: "bg-amber-500/10 text-amber-500",
      "In Progress": "bg-blue-500/10 text-blue-500",
      Resolved: "bg-green-500/10 text-green-500",
    };

    if (entityType === "enquiry") {
      return enquiryColors[status] ?? "bg-muted text-muted-foreground";
    }
    return complaintColors[status] ?? "bg-muted text-muted-foreground";
  };

  const isEnquiry = entityType === "enquiry";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left Part: Current Schedule View */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
            <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-pink-600" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Current Schedule</h3>
          </div>

          {currentDate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/60">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-pink-50 flex items-center justify-center shrink-0 border border-pink-100 mt-0.5 animate-pulse">
                    <Clock className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">
                      {isEnquiry
                        ? currentStatus === "Site Visit Scheduled"
                          ? "Site Visit Scheduled"
                          : "Follow-up Scheduled"
                        : `${currentStatus} Resolution`}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {new Date(currentDate).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {assignedName && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground bg-background px-2.5 py-1 rounded-md border w-fit shadow-xs">
                        <User className="h-3 w-3 text-pink-600" />
                        <span>Assigned to: <strong>{assignedName}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border shrink-0 self-start sm:self-center ${getStatusColorClass(
                    currentStatus
                  )}`}
                >
                  {currentStatus}
                </span>
              </div>

              <div className="text-xs text-muted-foreground leading-relaxed bg-amber-500/5 p-3.5 rounded-lg border border-amber-500/10 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  {isEnquiry
                    ? "This event is linked to the active enquiry. Setting a follow-up/site-visit date ensures this enquiry appears on the schedules calendar dashboard."
                    : "This event tracks the target resolution timeline. Keeping it updated prevents breach of client SLA limits."}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/20 rounded-lg border border-dashed border-border p-4">
              <CalendarDays className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
              <h4 className="font-medium text-foreground text-sm mb-1">No upcoming schedules found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                There are no active {isEnquiry ? "site visits or follow-ups" : "resolutions"} scheduled for this {entityType}. Use the form to assign a date and status.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Part: Quick Action Form Card */}
      <div className="space-y-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/50">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {isEnquiry ? "Schedule a Visit / Follow-up" : "Schedule Case Resolution"}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="schedDate" className="text-xs font-semibold text-foreground">
                {isEnquiry ? "Schedule Date" : "Expected Resolution Date"}
              </Label>
              <Input
                id="schedDate"
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="h-9 text-xs"
                disabled={isClosed}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Schedule Type / Status</Label>
              <Select value={statusInput} onValueChange={setStatusInput} disabled={isClosed}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isEnquiry ? (
                    <>
                      <SelectItem value="Site Visit Scheduled" className="text-xs">
                        Site Visit Scheduled
                      </SelectItem>
                      <SelectItem value="Follow-up Required" className="text-xs">
                        Follow-up Required
                      </SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Pending" className="text-xs">
                        Pending
                      </SelectItem>
                      <SelectItem value="In Progress" className="text-xs">
                        In Progress
                      </SelectItem>
                      <SelectItem value="Resolved" className="text-xs">
                        Resolved
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <StaffSelectDropdown
                selected={staffIds}
                onChange={(ids) => setStaffIds(isEnquiry ? ids.slice(-1) : ids)}
                label="Assign To"
                placement="bottom"
                nameById={
                  assignedStaffIds[0] && assignedName
                    ? { [assignedStaffIds[0]]: assignedName }
                    : undefined
                }
              />
            </div>

            <div className="pt-2">
              <Button
                className="w-full bg-pink-700 hover:bg-pink-800 active:scale-95 text-white text-xs font-semibold h-9 gap-1.5 transition-all shadow-sm"
                onClick={handleSave}
                disabled={isUpdating || isClosed}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Save Schedule</span>
                )}
              </Button>
            </div>
            {isClosed && (
              <p className="text-[11px] text-center text-muted-foreground italic">
                Reopen this {entityType} to reschedule.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

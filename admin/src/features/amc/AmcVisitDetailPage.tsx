import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import type { AmcContract, AmcVisit } from "../../interfaces/amc.interface";
import type { SMR } from "../../interfaces/smr.interface";
import { getAmcByIdApi, getAmcVisitsApi, getAmcVisitSmrApi } from "../../api/amc.api";
import { SMRReportView } from "../complaints/SMRReportView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import { updateScheduleApi } from "../../api/schedule.api";
import { toast } from "sonner";

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Scheduled: "bg-blue-500/10 text-blue-600",
    Completed: "bg-green-500/10 text-green-600",
    Cancelled: "bg-muted text-muted-foreground",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
};

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AmcVisitDetailPage() {
  const { amcId, visitId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<AmcContract | null>(null);
  const [visit, setVisit] = useState<AmcVisit | null>(null);
  const [visitSmr, setVisitSmr] = useState<SMR | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSmr, setIsLoadingSmr] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadVisitSmr = useCallback(async () => {
    if (!amcId || !visitId || !visit?.smrId) {
      setVisitSmr(null);
      return;
    }
    setIsLoadingSmr(true);
    setVisitSmr(null);
    try {
      const res = await getAmcVisitSmrApi(amcId, visitId);
      if (res.success) setVisitSmr(res.data);
      else toast.error("SMR not found");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load SMR");
    } finally {
      setIsLoadingSmr(false);
    }
  }, [amcId, visitId, visit?.smrId]);

  const fetchVisitData = useCallback(async () => {
    if (!amcId || !visitId) return;
    const [contractRes, visitsRes] = await Promise.all([
      getAmcByIdApi(amcId),
      getAmcVisitsApi(amcId),
    ]);
    if (!contractRes.success) {
      toast.error("Contract not found");
      return;
    }
    setContract(contractRes.data);

    const found = visitsRes.success && visitsRes.data.find((v) => v.id === visitId);
    if (!found) {
      toast.error("Visit not found");
      setVisit(null);
      return;
    }
    setVisit(found);
  }, [amcId, visitId]);

  const loadData = useCallback(async () => {
    if (!amcId || !visitId) return;
    setIsLoading(true);
    try {
      await fetchVisitData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to load visit");
    } finally {
      setIsLoading(false);
    }
  }, [amcId, visitId, fetchVisitData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (visit?.smrId) loadVisitSmr();
    else setVisitSmr(null);
  }, [visit?.smrId, visit?.id, loadVisitSmr]);

  const handleSaveReassign = async () => {
    if (!visitId) return;
    setIsSaving(true);
    try {
      const res = await updateScheduleApi(visitId, {
        assignedStaffIds: selectedTechs,
      });
      if (res.success) {
        toast.success("Staff reassigned successfully");
        setIsReassignOpen(false);
        await fetchVisitData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reassign staff");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm">Loading visit...</span>
      </div>
    );
  }

  if (!contract || !visit) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Visit not found</p>
        <Button variant="outline" onClick={() => navigate(amcId ? `/amc/${amcId}` : "/amc")}>
          Back to AMC
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <ScrollArea className="h-full">
        <div className="p-2 lg:p-0 max-w-4xl mx-auto space-y-4 pb-8">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
              <div className="flex items-center gap-4 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/amc/${amcId}`)}
                  className="gap-2 h-9 px-3 hover:bg-muted shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-medium">Back</span>
                </Button>
                <div className="h-8 w-px bg-border hidden sm:block shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-pink-600 shrink-0" />
                    Visit Details
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {contract.amcNo} · {contract.clientName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 self-end sm:self-auto">
                {visit.status === "Scheduled" && (
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedTechs(visit.assignedStaffIds || []);
                    setIsReassignOpen(true);
                  }}>
                    <Users className="h-4 w-4 mr-1.5" />
                    Reassign Staff
                  </Button>
                )}
                {!visit.smrId && (
                  <Button
                    size="sm"
                    className="bg-pink-700 hover:bg-pink-800 text-white"
                    onClick={() => navigate(`/amc/${amcId}/visits/${visitId}/smr/create`)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    {visit.status === "Scheduled" ? "Complete & Create SMR" : "Create SMR Report"}
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-foreground text-lg">{fmtDate(visit.scheduledDate)}</p>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getStatusColor(visit.status)}`}
                  >
                    {visit.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Assigned Staff</p>
                    <p className="mt-0.5 font-medium text-foreground">
                      {visit.assignedStaff?.length
                        ? visit.assignedStaff.map((s) => s.fullName).join(", ")
                        : "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Client</p>
                    <p className="mt-0.5 font-medium text-foreground">{contract.clientName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Location</p>
                    <p className="mt-0.5 font-medium text-foreground">{contract.location}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Contract Ref</p>
                    <p className="mt-0.5 font-medium text-foreground">{contract.amcNo}</p>
                  </div>
                </div>
                {visit.notes?.trim() && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Visit Notes</p>
                    <p className="mt-0.5 text-foreground whitespace-pre-wrap">{visit.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Service Maintenance Report
                </h2>

                {visit.smrId ? (
                  isLoadingSmr ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : visitSmr ? (
                    <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                      <SMRReportView smr={visitSmr} />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border p-8 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">Could not load SMR report.</p>
                      <Button size="sm" variant="outline" onClick={loadVisitSmr}>
                        Retry
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-4">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No SMR has been created for this visit yet.
                    </p>
                    <Button
                      className="bg-pink-700 hover:bg-pink-800 text-white"
                      onClick={() => navigate(`/amc/${amcId}/visits/${visitId}/smr/create`)}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      Create SMR Report
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground">Reassign Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <StaffSelectDropdown
              selected={selectedTechs}
              onChange={setSelectedTechs}
              label="Assigned Staff"
              placement="top"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReassignOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSaving}
                onClick={handleSaveReassign}
                className="bg-pink-700 hover:bg-pink-800 text-white h-8 text-xs font-semibold"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

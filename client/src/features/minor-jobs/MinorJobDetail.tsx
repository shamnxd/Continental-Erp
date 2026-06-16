import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Calendar, Building, User, FileText, ClipboardList, Loader2, Pencil } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Schedules } from "../../components/Schedules";
import { RemarksChat } from "../../components/RemarksChat";
import { TableStatusBadge } from "../../components/tableCells";
import { getMinorJobByIdApi, updateMinorJobApi } from "../../api/minorJob.api";
import { getStaffApi } from "../../api/staff.api";
import { MinorJob } from "../../interfaces/minorJob.interface";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import { toast } from "sonner";

const statusTone = (s: MinorJob["status"]) => {
  if (s === "Open") return "blue" as const;
  if (s === "In Progress") return "amber" as const;
  return "green" as const;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Open: "bg-blue-500/10 text-blue-500",
    "In Progress": "bg-amber-500/10 text-amber-500",
    Completed: "bg-green-500/10 text-green-500",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
};

export function MinorJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [job, setJob] = useState<MinorJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Reassign modal states
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [isSavingReassign, setIsSavingReassign] = useState(false);

  const loadJob = async (showSpinner = true) => {
    if (!id) return;
    if (showSpinner) setIsLoading(true);
    try {
      const res = await getMinorJobByIdApi(id);
      if (res.success) {
        setJob(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load minor job details");
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  useEffect(() => {
    getStaffApi({ limit: 200, activeOnly: true })
      .then((res) => {
        if (res.success) setStaffList(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
        <span className="text-sm">Minor job not found</span>
        <Button variant="outline" onClick={() => navigate("/minor-jobs")}>
          Back to Minor Jobs
        </Button>
      </div>
    );
  }

  const clientName = typeof job.clientRef === "object" ? job.clientRef.companyName : "Unknown Client";
  const clientContact = typeof job.clientRef === "object" ? job.clientRef.contactPerson : "—";
  const clientPhone = typeof job.clientRef === "object" ? job.clientRef.phone : "";
  const clientEmail = typeof job.clientRef === "object" ? job.clientRef.email : "";
  const clientLocation = typeof job.clientRef === "object"
    ? `${job.clientRef.address || ""}, ${job.clientRef.city || ""}`
    : "—";

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await updateMinorJobApi(job.id, { status: newStatus as any });
      if (res.success) {
        setJob(res.data);
        toast.success("Status updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const openReassign = () => {
    // Parse assigned IDs
    const ids = job.assignedStaffId
      ? job.assignedStaffId.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    setSelectedTechs(ids);
    setIsReassignOpen(true);
  };

  const handleSaveReassign = async () => {
    setIsSavingReassign(true);
    try {
      const selectedStaffNames = selectedTechs
        .map((techId) => staffList.find((s) => (s.id || s._id) === techId)?.fullName)
        .filter(Boolean);

      const res = await updateMinorJobApi(job.id, {
        assignedStaffId: selectedTechs.join(", "),
        assignedTo: selectedStaffNames.join(", "),
      });

      if (res.success) {
        setJob(res.data);
        setIsReassignOpen(false);
        toast.success("Technicians reassigned successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reassign technicians");
    } finally {
      setIsSavingReassign(false);
    }
  };

  return (
    <div className="h-full bg-background">
      <ScrollArea className="h-full">
        <div className="p-2 lg:p-0">
          <div className="mx-auto space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              {/* Header Card */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/minor-jobs")}
                      className="gap-2 h-9 px-3 hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="font-medium">Back</span>
                    </Button>
                    <div className="h-8 w-px bg-border hidden md:block" />
                    <div>
                      <h1 className="text-xl font-bold text-foreground tracking-tight">{job.jobNo}</h1>
                      <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                        {clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <Select
                      value={job.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className={`h-9 w-[150px] text-xs font-bold uppercase border-0 ${getStatusColor(job.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm font-semibold text-foreground bg-pink-50 text-pink-700 px-3 py-1.5 rounded-lg border border-pink-100">
                      Assigned: {job.assignedTo || "Unassigned"}
                    </span>
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
                      value="schedules"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Schedules
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
              <TabsContent value="overview" className="m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4 lg:col-span-2">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5 text-pink-700" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Job Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="sm:col-span-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Description</span>
                        <p className="mt-1 text-foreground font-semibold text-base leading-snug">{job.description}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Job Number</span>
                        <span className="font-semibold text-foreground">{job.jobNo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Scheduled Date</span>
                        <div className="mt-1 flex items-center gap-1.5 text-foreground">
                          <Calendar className="h-4 w-4 text-pink-600" />
                          <span>{new Date(job.scheduledDate).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t border-border/40">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Assigned Technician</span>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={openReassign}
                            className="h-auto p-0 text-pink-750 hover:text-pink-900 font-bold text-xs hover:no-underline"
                            disabled={job.status === "Completed"}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Reassign
                          </Button>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{job.assignedTo || "No technicians assigned"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Building className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Client Info</h3>
                    </div>
                    
                    <div className="text-sm space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Company / Client</span>
                        <span className="font-semibold text-foreground text-base">{clientName}</span>
                      </div>
                      {clientContact && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Person</span>
                          <span className="font-semibold text-foreground">{clientContact}</span>
                        </div>
                      )}
                      {clientPhone && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Phone</span>
                          <span className="font-semibold text-foreground">{clientPhone}</span>
                        </div>
                      )}
                      {clientEmail && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Email</span>
                          <span className="font-semibold text-foreground">{clientEmail}</span>
                        </div>
                      )}
                      {clientLocation && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Location</span>
                          <span className="font-semibold text-foreground text-xs">{clientLocation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SCHEDULES CONTENT */}
              <TabsContent value="schedules" className="m-0">
                <Schedules
                  entityId={job.id}
                  entityType="minorjob"
                  entityNo={job.jobNo}
                  clientName={clientName}
                  title={job.description}
                  isClosed={job.status === "Completed"}
                  onSuccess={() => loadJob(false)}
                />
              </TabsContent>

              {/* REMARKS CONTENT */}
              <TabsContent value="remarks" className="m-0">
                <RemarksChat
                  entityType="minorjob"
                  entityId={job.id}
                  disabled={job.status === "Completed"}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>

      {/* Reassign Dialog */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Reassign Technicians</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <StaffSelectDropdown
              selected={selectedTechs}
              onChange={setSelectedTechs}
              label="Assigned Staff"
              placement="top"
              nameById={staffList.reduce((acc, curr) => {
                const id = curr.id || curr._id;
                if (id) acc[id] = curr.fullName;
                return acc;
              }, {} as Record<string, string>)}
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReassignOpen(false)}
                className="font-bold"
                disabled={isSavingReassign}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReassign}
                className="bg-pink-700 hover:bg-pink-800 text-white font-bold"
                disabled={isSavingReassign}
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

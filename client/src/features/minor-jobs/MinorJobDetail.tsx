import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { ArrowLeft, Calendar, Building, User, FileText, ClipboardList } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Schedules } from "../../components/Schedules";
import { RemarksChat } from "../../components/RemarksChat";
import { TableStatusBadge } from "../../components/tableCells";

interface MinorJob {
  id: string;
  jobNo: string;
  clientName: string;
  clientContact?: string;
  description: string;
  scheduledDate: string;
  status: "Open" | "In Progress" | "Completed";
  assignedTo: string;
}

const fallbackJobs: MinorJob[] = [
  {
    id: "mj_1",
    jobNo: "MJ-2026-001",
    clientName: "Tech Hub Office",
    clientContact: "Ananth Krishnan",
    description: "Replace faulty compressor in lobby AC",
    scheduledDate: "2026-06-11T10:00:00.000Z",
    status: "In Progress",
    assignedTo: "Rahul Sharma",
  },
  {
    id: "mj_2",
    jobNo: "MJ-2026-002",
    clientName: "Hotel Green Palace",
    clientContact: "Manager",
    description: "Thermostat calibration check",
    scheduledDate: "2026-06-15T14:30:00.000Z",
    status: "Open",
    assignedTo: "Vikram Singh",
  },
];

const statusTone = (s: MinorJob["status"]) => {
  if (s === "Open") return "blue" as const;
  if (s === "In Progress") return "amber" as const;
  return "green" as const;
};

export function MinorJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Get job from location state or fallback
  const job: MinorJob | undefined =
    location.state?.job ?? fallbackJobs.find((j) => j.id === id);

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
                        {job.clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <TableStatusBadge label={job.status} tone={statusTone(job.status)} />
                    <span className="text-sm font-semibold text-foreground bg-pink-50 text-pink-700 px-3 py-1.5 rounded-lg border border-pink-100">
                      Assigned: {job.assignedTo}
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
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Assigned Technician</span>
                        <div className="mt-1 flex items-center gap-1.5 text-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{job.assignedTo}</span>
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
                        <span className="font-semibold text-foreground text-base">{job.clientName}</span>
                      </div>
                      {job.clientContact && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Person</span>
                          <span className="font-semibold text-foreground">{job.clientContact}</span>
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
                  clientName={job.clientName}
                  title={job.description}
                  isClosed={job.status === "Completed"}
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
    </div>
  );
}

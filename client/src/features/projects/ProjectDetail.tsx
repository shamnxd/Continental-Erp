import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { ArrowLeft, Calendar, Building, IndianRupee, ClipboardList, Briefcase } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Schedules } from "../../components/Schedules";
import { RemarksChat } from "../../components/RemarksChat";
import { TableStatusBadge } from "../../components/tableCells";

interface Project {
  id: string;
  projectNo: string;
  clientName: string;
  name: string;
  startDate: string;
  status: "Planning" | "Active" | "On Hold" | "Completed";
  value: number;
}

const fallbackProjects: Project[] = [
  {
    id: "proj_1",
    projectNo: "PRJ-2026-001",
    clientName: "Global Infotech Solutions",
    name: "Server Room Cooling System Installation",
    startDate: "2026-05-10T10:00:00.000Z",
    status: "Active",
    value: 450000,
  },
  {
    id: "proj_2",
    projectNo: "PRJ-2026-002",
    clientName: "Nexon Enterprises",
    name: "VRF Air Conditioning System Setup",
    startDate: "2026-06-01T09:00:00.000Z",
    status: "Planning",
    value: 820000,
  },
];

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const statusTone = (s: Project["status"]) => {
  if (s === "Active") return "green" as const;
  if (s === "Planning") return "blue" as const;
  if (s === "On Hold") return "amber" as const;
  return "muted" as const;
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Get project from location state or fallback
  const project: Project | undefined =
    location.state?.project ?? fallbackProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Briefcase className="h-8 w-8 text-muted-foreground/50" />
        <span className="text-sm">Project not found</span>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          Back to Projects
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
                      onClick={() => navigate("/projects")}
                      className="gap-2 h-9 px-3 hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="font-medium">Back</span>
                    </Button>
                    <div className="h-8 w-px bg-border hidden md:block" />
                    <div>
                      <h1 className="text-xl font-bold text-foreground tracking-tight">{project.projectNo}</h1>
                      <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                        {project.clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <TableStatusBadge label={project.status} tone={statusTone(project.status)} />
                    <span className="text-sm font-semibold text-foreground bg-pink-50 text-pink-700 px-3 py-1.5 rounded-lg border border-pink-100">
                      Value: {fmtCurrency(project.value)}
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
                        <Briefcase className="h-4.5 w-4.5 text-pink-700" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Project Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Project Name</span>
                        <span className="font-semibold text-foreground text-base">{project.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Project Number</span>
                        <span className="font-semibold text-foreground text-base">{project.projectNo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Start Date</span>
                        <div className="mt-1 flex items-center gap-1.5 text-foreground">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Project Value</span>
                        <div className="mt-1 flex items-center gap-1.5 text-pink-700 font-semibold">
                          <IndianRupee className="h-4 w-4" />
                          <span>{fmtCurrency(project.value)}</span>
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
                        <span className="font-semibold text-foreground text-base">{project.clientName}</span>
                      </div>
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Relationship Status</span>
                        <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold border border-green-100">
                          Active Client
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SCHEDULES CONTENT */}
              <TabsContent value="schedules" className="m-0">
                <Schedules
                  entityId={project.id}
                  entityType="project"
                  entityNo={project.projectNo}
                  clientName={project.clientName}
                  title={project.name}
                  isClosed={project.status === "Completed"}
                />
              </TabsContent>

              {/* REMARKS CONTENT */}
              <TabsContent value="remarks" className="m-0">
                <RemarksChat
                  entityType="project"
                  entityId={project.id}
                  disabled={project.status === "Completed"}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

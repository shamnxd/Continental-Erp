import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { ArrowLeft, Calendar, Building, ShieldCheck, FileText } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { RemarksChat } from "../../components/RemarksChat";
import { TableStatusBadge } from "../../components/tableCells";

interface WarrantyRecord {
  id: string;
  warrantyNo: string;
  clientName: string;
  product: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Expiring Soon" | "Expired" | "Claimed";
}

const fallbackWarranties: WarrantyRecord[] = [
  {
    id: "warr_1",
    warrantyNo: "WRN-2026-001",
    clientName: "Metro Mall Center",
    product: "Chiller Unit 500TR - Carrier",
    startDate: "2025-01-15T00:00:00.000Z",
    endDate: "2027-01-15T00:00:00.000Z",
    status: "Active",
  },
  {
    id: "warr_2",
    warrantyNo: "WRN-2026-002",
    clientName: "Capital Residence",
    product: "Ductable Split AC 5.0TR - Daikin",
    startDate: "2025-06-20T00:00:00.000Z",
    endDate: "2026-06-20T00:00:00.000Z",
    status: "Expiring Soon",
  },
];

const statusTone = (s: WarrantyRecord["status"]) => {
  if (s === "Active") return "green" as const;
  if (s === "Expiring Soon") return "amber" as const;
  if (s === "Expired") return "red" as const;
  return "blue" as const;
};

export function WarrantyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Get warranty from location state or fallback
  const warranty: WarrantyRecord | undefined =
    location.state?.warranty ?? fallbackWarranties.find((w) => w.id === id);

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
                        {warranty.clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
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
              <TabsContent value="overview" className="m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4 lg:col-span-2">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-4.5 w-4.5 text-pink-700" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Warranty Coverage</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="sm:col-span-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Product / Asset</span>
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
                        <div className="mt-1 flex items-center gap-1.5 text-foreground">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(warranty.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">End Date</span>
                        <div className="mt-1 flex items-center gap-1.5 text-foreground">
                          <Calendar className="h-4 w-4 text-pink-600" />
                          <span>{new Date(warranty.endDate).toLocaleDateString()}</span>
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
                        <span className="font-semibold text-foreground text-base">{warranty.clientName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* REMARKS CONTENT */}
              <TabsContent value="remarks" className="m-0">
                <RemarksChat
                  entityType="warranty"
                  entityId={warranty.id}
                  disabled={warranty.status === "Expired"}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

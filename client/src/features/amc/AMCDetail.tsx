import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Building,
  Phone,
  Mail,
  MapPin,
  Loader2,
  CalendarClock,
  CheckCircle2,
  Users,
  FileText,
  IndianRupee,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { RemarksPanel } from "../../components/RemarksPanel";
import type { AmcContract } from "../../interfaces/amc.interface";
import { getAmcByIdApi, addAmcRemarkApi, updateAmcRemarkApi } from "../../api/amc.api";
import { AmcFormModal } from "../../components/AmcFormModal";
import { Schedules } from "../../components/Schedules";
import { NextVisitCell } from "../../components/NextVisitCell";
import { calculateNextPreferredVisitDate } from "../../utils/calculateAmcVisits";
import { toast } from "sonner";

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Active: "bg-green-500/10 text-green-500",
    Expired: "bg-red-500/10 text-red-500",
    "Due for Renewal": "bg-amber-500/10 text-amber-500",
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

function fmtCurrency(amount: number): string {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AMCDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<AmcContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newRemark, setNewRemark] = useState("");
  const [isEditingRemark, setIsEditingRemark] = useState(false);

  const fetchContractData = useCallback(async () => {
    if (!id) return;
    const contractRes = await getAmcByIdApi(id);
    if (contractRes.success) setContract(contractRes.data);
    else toast.error("Contract not found");
  }, [id]);

  const loadContract = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      await fetchContractData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contract");
    } finally {
      setIsLoading(false);
    }
  }, [id, fetchContractData]);

  const refreshContractData = useCallback(async () => {
    try {
      await fetchContractData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh contract");
    }
  }, [fetchContractData]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const handleAddRemark = async () => {
    if (!id || !newRemark.trim()) return;
    try {
      const res = await addAmcRemarkApi(id, newRemark.trim());
      if (res.success) {
        setContract(res.data);
        setNewRemark("");
        toast.success("Remark added");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add remark");
    }
  };

  const handleEditRemark = async (remarkKey: string, text: string) => {
    if (!id) return;
    setIsEditingRemark(true);
    try {
      const res = await updateAmcRemarkApi(id, remarkKey, text);
      if (res.success) {
        setContract(res.data);
        toast.success("Remark updated");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update remark");
    } finally {
      setIsEditingRemark(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm">Loading contract...</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">AMC contract not found</p>
        <Button variant="outline" onClick={() => navigate("/amc")}>
          Back to AMC
        </Button>
      </div>
    );
  }

  const remarks = contract.remarks ?? [];
  const payments = contract.payments ?? [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = Math.max(0, (contract.amount || 0) - totalPaid);
  const visitProgress =
    contract.totalVisits > 0
      ? Math.round((contract.visitsCompleted / contract.totalVisits) * 100)
      : 0;

  return (
    <div className="h-full bg-background">
      <ScrollArea className="h-full">
        <div className="p-2 lg:p-0">
          <div className="mx-auto space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/amc")}
                      className="gap-2 h-9 px-3 hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="font-medium">Back</span>
                    </Button>
                    <div className="h-8 w-px bg-border hidden md:block" />
                    <div>
                      <h1 className="text-xl font-bold text-foreground tracking-tight">{contract.amcNo}</h1>
                      <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                        {contract.clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-full ${getStatusColor(contract.status)}`}
                    >
                      {contract.status}
                    </span>
                    <Button size="sm" variant="outline" className="h-9" onClick={() => setActiveTab("visits")}>
                      <CalendarClock className="h-4 w-4 mr-1.5" />
                      View/Schedule Visits
                    </Button>
                    <Button
                      size="sm"
                      className="bg-pink-700 hover:bg-pink-800 h-9 px-4 font-semibold"
                      onClick={() => setIsEditOpen(true)}
                    >
                      Edit Contract
                    </Button>
                  </div>
                </div>
                <div className="px-4 lg:px-5">
                  <TabsList className="w-fit h-12 bg-transparent p-0 rounded inline-flex flex-nowrap justify-start gap-6 lg:gap-8">
                    <TabsTrigger
                      value="details"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none data-[state=active]:text-pink-700 px-4 text-sm font-bold transition-all"
                    >
                      Contract Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="visits"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none data-[state=active]:text-pink-700 px-4 text-sm font-bold transition-all"
                    >
                      Scheduled Visits
                    </TabsTrigger>
                    <TabsTrigger
                      value="remarks"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 data-[state=active]:shadow-none data-[state=active]:text-pink-700 px-4 text-sm font-bold transition-all"
                    >
                      Remarks
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="details" className="m-0 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-pink-600" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Contract Information</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Service Type</span>
                        <span className="font-medium text-foreground text-right">{contract.serviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frequency</span>
                        <span className="font-medium text-foreground">{contract.frequency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date</span>
                        <span className="font-medium text-foreground">{fmtDate(contract.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date</span>
                        <span className="font-medium text-foreground">{fmtDate(contract.endDate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Preferred Visit</span>
                        <NextVisitCell
                          nextVisit={calculateNextPreferredVisitDate(
                            contract.startDate,
                            contract.endDate,
                            contract.visitsCompleted,
                            contract.totalVisits
                          )}
                          emptyLabel="All visits done"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Scheduled Visit</span>
                        <NextVisitCell nextVisit={contract.nextVisit} emptyLabel="Not scheduled" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contract Amount</span>
                        <span className="font-semibold text-foreground">{fmtCurrency(contract.amount)}</span>
                      </div>
                      {contract.notes?.trim() && (
                        <div className="pt-2 border-t border-border/50">
                          <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                            AMC Notes
                          </span>
                          <p className="text-sm text-foreground mt-1.5 whitespace-pre-wrap">{contract.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Client Details</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <p className="font-semibold text-foreground">{contract.clientName}</p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {contract.phone}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {contract.email}
                      </div>
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {contract.location}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Visit Progress</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-bold text-foreground">
                          {contract.visitsCompleted} / {contract.totalVisits}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${visitProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <IndianRupee className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Payment Summary</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground font-medium">Contract Amount</p>
                      <p className="text-lg font-bold text-foreground mt-0.5">{fmtCurrency(contract.amount)}</p>
                    </div>
                    <div className="rounded-lg bg-green-500/5 p-3 border border-green-500/20">
                      <p className="text-xs text-muted-foreground font-medium">Advance Paid</p>
                      <p className="text-lg font-bold text-green-700 mt-0.5">
                        {fmtCurrency(contract.advancePaid ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-500/5 p-3 border border-amber-500/20">
                      <p className="text-xs text-muted-foreground font-medium">Pending Amount</p>
                      <p className="text-lg font-bold text-amber-700 mt-0.5">{fmtCurrency(pendingAmount)}</p>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Payment History
                  </h4>
                  {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-2">No payments recorded yet.</p>
                  ) : (
                    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                      {payments.map((p, idx) => (
                        <div key={idx} className="px-4 py-3 flex flex-wrap justify-between gap-2 text-sm">
                          <div>
                            <span className="font-semibold text-foreground">{fmtCurrency(p.amount)}</span>
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                              {p.type}
                            </span>
                            {p.note?.trim() && (
                              <p className="text-xs text-muted-foreground mt-0.5">{p.note}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.date).toLocaleString()}
                            {p.recordedBy ? ` · ${p.recordedBy}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="visits" className="m-0">
                <Schedules
                  entityId={contract.id ?? ""}
                  entityType="amc"
                  entityNo={contract.amcNo}
                  clientName={contract.clientName}
                  title={`AMC Visit - ${contract.amcNo}`}
                  onSuccess={refreshContractData}
                  isClosed={contract.status === "Expired"}
                />
              </TabsContent>

              <TabsContent value="remarks" className="m-0">
                <RemarksPanel
                  remarks={remarks}
                  newRemark={newRemark}
                  onNewRemarkChange={setNewRemark}
                  onAddRemark={handleAddRemark}
                  onEditRemark={handleEditRemark}
                  isEditingRemark={isEditingRemark}
                  emptyMessage="No follow-up remarks recorded."
                  placeholder="Add a progress remark or site notes..."
                  sectionTitle="Add Follow-up Remark"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>

      <AmcFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={loadContract}
        contract={contract}
      />
    </div>
  );
}

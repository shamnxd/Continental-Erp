import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Building2,
  User, FileText, ShieldCheck, ShieldX, Shield, Loader2,
  MoreVertical, AlertTriangle, MessageSquare, Calendar,
  CheckCircle, Clock, IndianRupee, TrendingUp, Wrench,
  Download, Send, Eye, AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Client } from "../../interfaces/client.interface";
import { getClientByIdApi, deleteClientApi } from "../../api/client.api";
import { getComplaintsApi } from "../../api/complaint.api";
import { Complaint } from "../../interfaces/complaint.interface";
import { ClientFormModal } from "./ClientFormModal";
import { mockComplaints } from "../complaints/Complaints";
import { mockEnquiries } from "../enquiries/Enquiries";
import { mockAMCContracts } from "../amc/AMC";
import { mockInvoices } from "../invoices/Invoices";

// ── helpers ──────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function amcBadge(status?: string) {
  if (status === "Active")
    return { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-500/10", label: "Active AMC" };
  if (status === "Expired" || status === "Due for Renewal")
    return { icon: ShieldX, color: "text-red-500", bg: "bg-red-500/10", label: status };
  return { icon: Shield, color: "text-muted-foreground", bg: "bg-muted", label: "No AMC" };
}

function StatusPill({ status, map }: { status: string; map: Record<string, string> }) {
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${cls}`}>{status}</span>;
}

const invoiceStatusMap: Record<string, string> = {
  Paid: "bg-green-500/10 text-green-600",
  Sent: "bg-blue-500/10 text-blue-500",
  Pending: "bg-amber-500/10 text-amber-600",
  Overdue: "bg-red-500/10 text-red-500",
};

const amcStatusMap: Record<string, string> = {
  Active: "bg-green-500/10 text-green-600",
  "Due for Renewal": "bg-amber-500/10 text-amber-600",
  Expired: "bg-red-500/10 text-red-500",
};

const complaintStatusMap: Record<string, string> = {
  Resolved: "bg-green-500/10 text-green-600",
  Open: "bg-orange-500/10 text-orange-500",
  "In Progress": "bg-blue-500/10 text-blue-500",
  Pending: "bg-amber-500/10 text-amber-600",
};

// ── main component ────────────────────────────────────────
export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getClientByIdApi(id)
      .then((res) => {
        if (res.success) setClient(res.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      const res = await deleteClientApi(id);
      if (res.success) navigate("/clients");
    } catch (err) {
      console.error(err);
    }
  };

  // ── derived mock data ──
  const byCompany = (name: string) => (s: string) =>
    s.toLowerCase() === name.toLowerCase();

  const clientAMC = client
    ? mockAMCContracts.filter((c) => byCompany(client.companyName)(c.clientName))
    : [];

  const latestAMC = clientAMC[0] ?? null;

  const allComplaints = client
    ? mockComplaints.filter((c) => byCompany(client.companyName)(c.clientName))
    : [];

  const activeComplaints = allComplaints.filter((c) => c.status !== "Resolved");

  const allEnquiries = client
    ? mockEnquiries.filter((e) => byCompany(client.companyName)(e.clientName))
    : [];

  const activeEnquiries = allEnquiries.filter((e) => e.status !== "Converted to Project");

  const clientInvoices = client
    ? mockInvoices.filter((inv) => byCompany(client.companyName)(inv.clientName))
    : [];

  const totalInvoiced = clientInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const paidAmount = clientInvoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.totalAmount, 0);
  const pendingAmount = totalInvoiced - paidAmount;

  // ── AMC payment simulation ──
  const amcTotal = latestAMC?.amount ?? 0;
  const amcAdvancePaid = latestAMC ? Math.round(amcTotal * 0.4) : 0;
  const amcNeedToPay = amcTotal - amcAdvancePaid;

  // ── loading/not-found ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm">Loading client details...</p>
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Client not found</p>
        <Button variant="outline" onClick={() => navigate("/clients")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Button>
      </div>
    );
  }

  const amc = amcBadge(client.amcStatus);
  const AmcIcon = amc.icon;

  return (
    <div className="space-y-4 pb-8">
      <Tabs defaultValue="overview" className="space-y-4">
        {/* ── Header Card ── */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/clients")}
                className="gap-2 h-9 px-3 hover:bg-muted shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Back</span>
              </Button>
              <div className="h-8 w-px bg-border hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 border-2 border-primary/20 shadow">
                  <img
                    src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(client.companyName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                    alt={client.companyName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate leading-tight">
                    {client.companyName}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">{client.contactPerson}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${amc.bg} ${amc.color}`}>
                <AmcIcon className="h-3.5 w-3.5" />
                {amc.label}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <MoreVertical className="h-4 w-4" />
                    <span className="hidden sm:inline">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4 text-green-500" /> Edit Client
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)} className="cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tabs inside Header Card */}
          <div className="px-4 sm:px-6">
            <TabsList className="w-full h-12 bg-transparent p-0 rounded overflow-x-auto flex-nowrap justify-start gap-6 lg:gap-8">
              {[
                { value: "overview", label: "Overview" },
                { value: "amc", label: "AMC Details" },
                { value: "invoices", label: "Invoices" },
                { value: "history", label: "History" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-full shrink-0 rounded border-0 !border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 text-xs font-bold uppercase tracking-wider transition-all hover:text-primary"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* ══════════════ OVERVIEW TAB ══════════════ */}
        <TabsContent value="overview" className="m-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Col 1-2 */}
            <div className="lg:col-span-2 space-y-4">
              {/* Company Info */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
                <SectionHeader icon={Building2} iconBg="bg-primary/10" iconColor="text-primary" title="Company Information" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <InfoField label="Company Name" value={client.companyName} />
                  <InfoField label="Contact Person">
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 border border-border">
                        <img src={`https://i.pravatar.cc/150?u=${encodeURIComponent(client.contactPerson)}`} alt={client.contactPerson} className="h-full w-full object-cover" />
                      </div>
                      <span className="text-sm text-foreground font-medium">{client.contactPerson}</span>
                    </div>
                  </InfoField>
                  <InfoField label="Phone">
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`tel:${client.phone}`} className="text-sm text-foreground hover:text-primary transition-colors">{client.phone}</a>
                    </div>
                  </InfoField>
                  <InfoField label="Email">
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`mailto:${client.email}`} className="text-sm text-foreground hover:text-primary truncate">{client.email}</a>
                    </div>
                  </InfoField>
                  <InfoField label="City">
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{client.city}</span>
                    </div>
                  </InfoField>
                  <InfoField label="GST Number" value={client.gst || "N/A"} mono />
                  {client.address && (
                    <div className="sm:col-span-2">
                      <InfoField label="Address" value={client.address} />
                    </div>
                  )}
                </div>
              </div>

              {/* Complaints */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader icon={AlertTriangle} iconBg="bg-orange-500/10" iconColor="text-orange-500" title="Complaints" />
                  <div className="flex items-center gap-2">
                    {activeComplaints.length > 0 && <Pill text={`${activeComplaints.length} active`} cls="bg-orange-500/10 text-orange-500" />}
                    <span className="text-xs text-muted-foreground">{allComplaints.length} total</span>
                  </div>
                </div>
                {allComplaints.length === 0 ? (
                  <Empty icon={AlertTriangle} text="No complaints on record" />
                ) : (
                  <div className="space-y-2">
                    {allComplaints.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{c.complaintNo ?? `Complaint #${i + 1}`}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.issue ?? c.description ?? "—"}</p>
                        </div>
                        <StatusPill status={c.status} map={complaintStatusMap} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enquiries */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <SectionHeader icon={MessageSquare} iconBg="bg-blue-500/10" iconColor="text-blue-500" title="Enquiries" />
                  {activeEnquiries.length > 0 && <Pill text={`${activeEnquiries.length} active`} cls="bg-blue-500/10 text-blue-500" />}
                </div>
                {allEnquiries.length === 0 ? (
                  <Empty icon={MessageSquare} text="No enquiries on record" />
                ) : (
                  <div className="space-y-2">
                    {allEnquiries.map((e, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{e.enquiryNo ?? `Enquiry #${i + 1}`}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{e.requirement}</p>
                        </div>
                        <span className="ml-3 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500">{e.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick stats */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
                <SectionHeader icon={FileText} iconBg="bg-purple-500/10" iconColor="text-purple-500" title="Quick Stats" />
                <div className="mt-4 space-y-3">
                  <StatRow label="Total Projects" value={client.projectsCount ?? 0} color="text-foreground" />
                  <StatRow label="Active Complaints" value={activeComplaints.length} color="text-orange-500" />
                  <StatRow label="Active Enquiries" value={activeEnquiries.length} color="text-blue-500" />
                  <StatRow label="Total Invoices" value={clientInvoices.length} color="text-foreground" />
                  <StatRow label="Total Invoiced" value={fmt(totalInvoiced)} color="text-foreground" isString />
                </div>
              </div>

              {/* AMC status */}
              <div className={`rounded-xl border p-4 sm:p-5 shadow-sm ${amc.bg} border-border`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${amc.bg}`}>
                    <AmcIcon className={`h-5 w-5 ${amc.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">AMC Status</p>
                    <p className={`text-lg font-bold ${amc.color}`}>{client.amcStatus ?? "None"}</p>
                  </div>
                </div>
                {latestAMC && (
                  <div className="mt-3 pt-3 border-t border-border/40 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between"><span>Plan</span><span className="font-medium text-foreground">{latestAMC.planName}</span></div>
                    <div className="flex justify-between"><span>Expires</span><span className="font-medium text-foreground">{fmtDate(latestAMC.endDate)}</span></div>
                  </div>
                )}
              </div>

              {/* Invoice summary */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
                <SectionHeader icon={IndianRupee} iconBg="bg-green-500/10" iconColor="text-green-600" title="Finance Summary" />
                <div className="mt-4 space-y-3">
                  <StatRow label="Total Invoiced" value={fmt(totalInvoiced)} color="text-foreground" isString />
                  <StatRow label="Amount Paid" value={fmt(paidAmount)} color="text-green-600" isString />
                  <StatRow label="Amount Pending" value={fmt(pendingAmount)} color="text-red-500" isString />
                </div>
              </div>

              {client.createdAt && (
                <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Client Since</p>
                  </div>
                  <p className="text-xl font-bold text-foreground">{fmtDate(client.createdAt)}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ══════════════ AMC DETAILS TAB ══════════════ */}
        <TabsContent value="amc" className="m-0 space-y-4">
          {clientAMC.length === 0 ? (
            <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No AMC contracts for this client</p>
            </div>
          ) : (
            clientAMC.map((contract) => (
              <div key={contract.id} className="space-y-4">
                {/* AMC Contract Card */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-green-400 to-blue-500" />
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">{contract.amcNo}</h3>
                          <StatusPill status={contract.status} map={amcStatusMap} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{contract.serviceType}</p>
                      </div>
                      <span className="text-lg font-bold text-foreground">{fmt(contract.amount)}</span>
                    </div>

                    {/* Plan + Dates */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      <InfoField label="Plan" value={contract.planName} />
                      <InfoField label="Frequency" value={contract.frequency} />
                      <InfoField label="Start Date" value={fmtDate(contract.startDate)} />
                      <InfoField label="End Date" value={fmtDate(contract.endDate)} />
                    </div>

                    {/* Visits progress */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
                        <span className="font-medium">Visit Progress</span>
                        <span className="font-bold text-foreground">{contract.visitsCompleted} / {contract.totalVisits} completed</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-pink-400 h-2 rounded-full transition-all"
                          style={{ width: `${(contract.visitsCompleted / contract.totalVisits) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Payment breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-lg bg-muted/50 border border-border p-3 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contract Value</p>
                        <p className="text-lg font-bold text-foreground mt-1">{fmt(contract.amount)}</p>
                      </div>
                      <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 text-center">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Advance Paid</p>
                        <p className="text-lg font-bold text-green-600 mt-1">{fmt(amcAdvancePaid)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">40% of contract</p>
                      </div>
                      <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 text-center">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Balance Due</p>
                        <p className="text-lg font-bold text-red-500 mt-1">{fmt(amcNeedToPay)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">60% remaining</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service History / Logs */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
                  <SectionHeader icon={Wrench} iconBg="bg-amber-500/10" iconColor="text-amber-500" title="Service History" />
                  {contract.serviceLogs.length === 0 ? (
                    <Empty icon={Wrench} text="No service logs yet" />
                  ) : (
                    <div className="mt-4 space-y-3">
                      {contract.serviceLogs.map((log) => {
                        const materialCost = log.materials.reduce((s, m) => s + m.cost, 0);
                        const totalCost = log.petrolExpense + log.otherExpenses + materialCost;
                        return (
                          <div key={log.id} className="rounded-lg border border-border bg-muted/20 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-border">
                                  <img src={`https://i.pravatar.cc/150?u=${encodeURIComponent(log.technician)}`} alt={log.technician} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{log.technician}</p>
                                  <p className="text-[11px] text-muted-foreground">{fmtDate(log.date)}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{log.travelTime}m travel</span>
                                <span className="flex items-center gap-1"><Wrench className="h-3.5 w-3.5" />{log.workTime}m work</span>
                                <span className="flex items-center gap-1 font-semibold text-foreground"><IndianRupee className="h-3.5 w-3.5" />{fmt(totalCost)}</span>
                              </div>
                            </div>

                            {/* Materials */}
                            {log.materials.length > 0 && (
                              <div className="mb-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Materials Used</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {log.materials.map((m, mi) => (
                                    <span key={mi} className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium">
                                      {m.name} ×{m.quantity} — {fmt(m.cost)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-border/40">
                              <span className="text-muted-foreground">Petrol: <span className="font-medium text-foreground">{fmt(log.petrolExpense)}</span></span>
                              {log.otherExpenses > 0 && <span className="text-muted-foreground">Other: <span className="font-medium text-foreground">{fmt(log.otherExpenses)}</span></span>}
                              <span className="text-muted-foreground">Materials: <span className="font-medium text-foreground">{fmt(materialCost)}</span></span>
                            </div>

                            {log.remarks && (
                              <p className="mt-2 text-xs text-muted-foreground italic">"{log.remarks}"</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* AMC Remarks */}
                {contract.remarks.length > 0 && (
                  <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5">
                    <SectionHeader icon={MessageSquare} iconBg="bg-purple-500/10" iconColor="text-purple-500" title="Contract Notes" />
                    <div className="mt-4 space-y-3">
                      {contract.remarks.map((r, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 border border-border">
                            <img src={`https://i.pravatar.cc/150?u=${encodeURIComponent(r.user)}`} alt={r.user} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 bg-muted/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-semibold text-foreground">{r.user}</p>
                              <p className="text-[10px] text-muted-foreground">{fmtDate(r.date)}</p>
                            </div>
                            <p className="text-xs text-foreground">{r.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* ══════════════ INVOICES TAB ══════════════ */}
        <TabsContent value="invoices" className="m-0 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FinanceCard label="Total Invoiced" value={fmt(totalInvoiced)} color="text-foreground" bg="bg-card" />
            <FinanceCard label="Amount Paid" value={fmt(paidAmount)} color="text-green-600" bg="bg-green-500/5" />
            <FinanceCard label="Amount Pending" value={fmt(pendingAmount)} color="text-red-500" bg="bg-red-500/5" />
          </div>

          {/* Invoices list */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {clientInvoices.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No invoices found for this client</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        {["Invoice No", "Date", "Type", "Amount", "GST", "Total", "Due Date", "Status", ""].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {clientInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">{inv.invoiceNo}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{fmtDate(inv.date)}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-500/10 text-blue-500">{inv.type}</span></td>
                          <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{fmt(inv.amount)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{fmt(inv.gst)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-foreground whitespace-nowrap">{fmt(inv.totalAmount)}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{fmtDate(inv.dueDate)}</td>
                          <td className="px-4 py-3"><StatusPill status={inv.status} map={invoiceStatusMap} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <button className="hover:text-blue-500 transition-colors"><Eye className="h-4 w-4" /></button>
                              <button className="hover:text-green-500 transition-colors"><Download className="h-4 w-4" /></button>
                              {inv.status !== "Paid" && <button className="hover:text-purple-500 transition-colors"><Send className="h-4 w-4" /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-border">
                  {clientInvoices.map((inv) => (
                    <div key={inv.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-foreground">{inv.invoiceNo}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(inv.date)} · {inv.type}</p>
                        </div>
                        <StatusPill status={inv.status} map={invoiceStatusMap} />
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Amount: <span className="text-foreground font-medium">{fmt(inv.amount)}</span></span>
                        <span>GST: <span className="text-foreground font-medium">{fmt(inv.gst)}</span></span>
                        <span>Total: <span className="font-bold text-foreground">{fmt(inv.totalAmount)}</span></span>
                        <span>Due: <span className="text-foreground">{fmtDate(inv.dueDate)}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ══════════════ HISTORY TAB ══════════════ */}
        <TabsContent value="history" className="m-0">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
            <SectionHeader icon={Clock} iconBg="bg-indigo-500/10" iconColor="text-indigo-500" title="Activity Timeline" />
            <div className="mt-5 space-y-0">
              {[
                ...allComplaints.map((c) => ({
                  type: "complaint" as const,
                  date: c.date ?? "2026-01-01",
                  title: `Complaint: ${c.complaintNo ?? "—"}`,
                  description: c.issue ?? "—",
                  status: c.status,
                  color: "bg-orange-500",
                  icon: AlertTriangle,
                })),
                ...allEnquiries.map((e) => ({
                  type: "enquiry" as const,
                  date: e.date ?? "2026-01-01",
                  title: `Enquiry: ${e.enquiryNo ?? "—"}`,
                  description: e.requirement ?? "—",
                  status: e.status,
                  color: "bg-blue-500",
                  icon: MessageSquare,
                })),
                ...clientAMC.map((a) => ({
                  type: "amc" as const,
                  date: a.startDate,
                  title: `AMC Contract: ${a.amcNo}`,
                  description: `${a.planName} · ${a.serviceType}`,
                  status: a.status,
                  color: "bg-green-500",
                  icon: ShieldCheck,
                })),
                ...clientInvoices.map((inv) => ({
                  type: "invoice" as const,
                  date: inv.date,
                  title: `Invoice: ${inv.invoiceNo}`,
                  description: `${inv.type} · ${fmt(inv.totalAmount)}`,
                  status: inv.status,
                  color: "bg-purple-500",
                  icon: FileText,
                })),
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((item, idx, arr) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full ${item.color} flex items-center justify-center shrink-0 shadow`}>
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        {idx < arr.length - 1 && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[20px]" />}
                      </div>
                      <div className="flex-1 pb-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <div className="flex items-center gap-2">
                            <StatusPill
                              status={item.status}
                              map={{ ...invoiceStatusMap, ...amcStatusMap, ...complaintStatusMap, "Site Visit Scheduled": "bg-blue-500/10 text-blue-500", "Converted to Project": "bg-green-500/10 text-green-600" }}
                            />
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{fmtDate(item.date)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  );
                })}

              {allComplaints.length === 0 && allEnquiries.length === 0 && clientAMC.length === 0 && clientInvoices.length === 0 && (
                <Empty icon={Clock} text="No activity history available" />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Edit Modal ── */}
      <ClientFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(updated) => { setClient(updated); setIsEditOpen(false); }}
        client={client}
      />

      {/* ── Delete Dialog ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this client?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{client.companyName}</strong> and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────
function SectionHeader({ icon: Icon, iconBg, iconColor, title }: { icon: React.ElementType; iconBg: string; iconColor: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-8 w-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function InfoField({ label, value, mono, children }: { label: string; value?: string | number; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      {children ? children : (
        <p className={`mt-1 text-sm text-foreground ${mono ? "font-mono" : "font-medium"}`}>{value ?? "—"}</p>
      )}
    </div>
  );
}

function StatRow({ label, value, color, isString }: { label: string; value: number | string; color: string; isString?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{isString ? value : value}</span>
    </div>
  );
}

function Pill({ text, cls }: { text: string; cls: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${cls}`}>{text}</span>;
}

function FinanceCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl border border-border shadow-sm p-4 text-center`}>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <Icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

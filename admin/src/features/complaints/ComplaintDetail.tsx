import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, Phone, Building, MapPin, Calendar, AlertCircle, MessageSquare, Clipboard, CheckCircle2, ShieldCheck, ShieldAlert, Shield, Mail, User, Pencil } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { RemarksChat } from "../../components/RemarksChat";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
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
import { getComplaintByIdApi, updateComplaintApi } from "../../api/complaint.api";
import { getClientByIdApi } from "../../api/client.api";
import { getSMRsByComplaintApi } from "../../api/smr.api";
import { Complaint } from "../../interfaces/complaint.interface";
import { Client } from "../../interfaces/client.interface";
import { SMR } from "../../interfaces/smr.interface";
import { getAmcApi } from "../../api/amc.api";
import type { AmcContract } from "../../interfaces/amc.interface";
import { SMRReportView } from "./SMRReportView";
import { SMRApprovalModal } from "./SMRApprovalModal";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import { toast } from "sonner";
import { Schedules } from "../../components/Schedules";

export function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "service" ? "service" : "details";
  
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [clientAmc, setClientAmc] = useState<AmcContract | null>(null);
  const [smrs, setSmrs] = useState<SMR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [smrToApprove, setSmrToApprove] = useState<SMR | null>(null);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [isResolveConfirmOpen, setIsResolveConfirmOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editIssue, setEditIssue] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<Complaint["priority"]>("Medium");
  const [editExpectedResolution, setEditExpectedResolution] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const fetchComplaintDetails = async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setIsLoading(true);
      const res = await getComplaintByIdApi(id);
      if (res.success) {
        setComplaint(res.data);
        // Fetch client details
        try {
          const clientRes = await getClientByIdApi(res.data.clientId);
          if (clientRes.success) {
            setClient(clientRes.data);
          }
          const amcRes = await getAmcApi({ clientId: res.data.clientId, page: 1, limit: 10 });
          if (amcRes.success && amcRes.data.length > 0) {
            const active =
              amcRes.data.find((c) => c.status === "Active" || c.status === "Due for Renewal") ??
              amcRes.data[0];
            setClientAmc(active);
          } else {
            setClientAmc(null);
          }
        } catch (cErr) {
          console.error("Failed to load client details for complaint:", cErr);
        }
      }
      
      const smrRes = await getSMRsByComplaintApi(id);
      if (smrRes.success) {
        setSmrs(smrRes.data);
      }
      if (!silent) setIsLoading(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load complaint data");
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const openEditComplaint = () => {
    if (!complaint) return;
    setEditIssue(complaint.issue ?? "");
    setEditDescription(complaint.description ?? "");
    setEditPriority(complaint.priority);
    setEditExpectedResolution(
      complaint.expectedResolution ? new Date(complaint.expectedResolution).toISOString().split("T")[0] : ""
    );
    setEditContactPerson(complaint.contactPerson ?? "");
    setEditPhone(complaint.phone ?? "");
    setEditLocation(complaint.location ?? "");
    setIsEditOpen(true);
  };

  const handleSaveComplaintEdit = async () => {
    if (!complaint || !id) return;
    if (!editIssue.trim()) {
      toast.error("Issue is required");
      return;
    }
    if (!editDescription.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!editPhone.trim()) {
      toast.error("Phone is required");
      return;
    }
    if (!editLocation.trim()) {
      toast.error("Location is required");
      return;
    }
    if (!editExpectedResolution) {
      toast.error("Expected resolution date is required");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await updateComplaintApi(id, {
        issue: editIssue.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        expectedResolution: new Date(editExpectedResolution).toISOString(),
        contactPerson: editContactPerson.trim(),
        phone: editPhone.trim(),
        location: editLocation.trim(),
      });
      if (res.success) {
        setComplaint(res.data);
        setIsEditOpen(false);
        toast.success("Complaint updated");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update complaint");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "Pending" | "In Progress" | "Resolved") => {
    if (!complaint || !id) return;
    try {
      const res = await updateComplaintApi(id, { status: newStatus });
      if (res.success) {
        setComplaint(res.data);
        toast.success(`Status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const openReassign = () => {
    if (complaint) {
      setSelectedTechs(complaint.assignedStaffIds?.length ? complaint.assignedStaffIds : []);
      setIsReassignOpen(true);
    }
  };

  const handleSaveReassign = async () => {
    if (!complaint || !id) return;
    try {
      const res = await updateComplaintApi(id, { assignedStaffIds: selectedTechs });
      if (res.success) {
        setComplaint(res.data);
        setIsReassignOpen(false);
        toast.success("Technicians reassigned successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reassign technicians");
    }
  };

  const handleOpenApprove = () => {
    if (complaintSmr) {
      setSmrToApprove(complaintSmr);
      setIsApprovalOpen(true);
    }
  };

  const complaintSmr = smrs[0] ?? null;
  const hasSmr = !!complaintSmr;

  const getStatusColor = (status: string) => {
    const colors = {
      Pending: "bg-amber-500/10 text-amber-500",
      "In Progress": "bg-blue-500/10 text-blue-500",
      Resolved: "bg-green-500/10 text-green-500",
    };
    return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      Critical: "bg-red-500/10 text-red-500 font-bold",
      High: "bg-orange-500/10 text-orange-500 font-bold",
      Medium: "bg-amber-500/10 text-amber-500 font-bold",
      Low: "bg-blue-500/10 text-blue-500 font-bold",
    };
    return colors[priority as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  if (isLoading || !complaint) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground font-semibold">
        Fetching complaint and service history from Continental...
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <Tabs defaultValue={defaultTab} className="space-y-4">

        {/* ── Header Card ── */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/complaints")}
                className="gap-2 h-9 px-3 hover:bg-muted shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Back</span>
              </Button>
              <div className="h-8 w-px bg-border hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 border-2 border-primary/20 shadow bg-card flex items-center justify-center">
                  {client?.logoUrl || complaint.clientLogoUrl ? (
                    <img
                      src={client?.logoUrl || complaint.clientLogoUrl}
                      alt={complaint.clientName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(complaint.clientName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                      alt={complaint.clientName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate leading-tight">
                    {complaint.complaintNo}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">{complaint.clientName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(complaint.priority)}`}>
                {complaint.priority}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(complaint.status)}`}>
                {complaint.status}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={openEditComplaint}
                className="h-9 px-3 font-bold"
                disabled={complaint.status === "Resolved"}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              {complaint.status !== "Resolved" ? (
                <Button
                  size="sm"
                  onClick={() => setIsResolveConfirmOpen(true)}
                  className="bg-green-600 hover:bg-green-700 font-bold h-9 px-4 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Resolve Case</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus("In Progress")}
                  className="font-bold border-border/80 h-9 px-4"
                >
                  Re-open
                </Button>
              )}
            </div>
          </div>

          {/* Tabs inside Header Card */}
          <div className="px-4 sm:px-6">
            <TabsList className="w-fit h-12 bg-transparent p-0 rounded inline-flex flex-nowrap justify-start gap-6 lg:gap-8">
              {[
                { value: "details", label: "Details" },
                { value: "schedules", label: "Schedules" },
                { value: "service", label: "SM Report" },
                { value: "remarks", label: `Remarks (${complaint.remarks.length})` },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-none w-auto h-full shrink-0 rounded border-0 !border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-4 text-xs font-bold uppercase tracking-wider transition-all hover:text-primary"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

              {/* DETAILS TAB */}
              <TabsContent value="details" className="m-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Complaint Info */}
                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Complaint Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Issue</label>
                        <p className="mt-1 text-foreground font-bold text-base leading-snug">{complaint.issue}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Detailed Description</label>
                        <p className="mt-1 text-muted-foreground text-sm leading-relaxed whitespace-pre-line bg-muted/20 p-3 rounded-lg border border-border/50">
                          {complaint.description}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Staff</label>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={openReassign}
                            className="h-auto p-0 text-pink-750 hover:text-pink-900 font-bold text-xs hover:no-underline"
                          >
                            Reassign
                          </Button>
                        </div>
                        {(!complaint.assignedTo?.length && !complaint.assignedStaffIds?.length) ? (
                          <div className="mt-1 p-2.5 rounded-lg border border-dashed border-border/60 bg-muted/10 text-center">
                            <p className="text-xs text-muted-foreground italic font-medium">No staff assigned</p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {(complaint.assignedTo ?? []).map((name) => (
                              <div key={name} className="flex items-center gap-1.5 bg-pink-500/5 border border-pink-500/10 px-2 py-1 rounded-full text-xs font-semibold text-foreground">
                                <div className="h-5 w-5 rounded-full bg-pink-700 text-white font-extrabold flex items-center justify-center text-[9px] shrink-0">
                                  {name.charAt(0)}
                                </div>
                                <span>{name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Client & AMC Column */}
                  <div className="space-y-4">
                    {/* Client Info */}
                    <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Building className="h-4.5 w-4.5 text-blue-500" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Client Information</h3>
                      </div>
                      
                      <div className="flex items-center gap-3 pb-3 border-b border-border/40">
                        <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border-2 border-pink-500/20 shadow-sm bg-pink-100 flex items-center justify-center">
                          {client?.logoUrl || complaint.clientLogoUrl ? (
                            <img
                              src={client?.logoUrl || complaint.clientLogoUrl}
                              alt={complaint.clientName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(complaint.clientName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                              alt={complaint.clientName}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{complaint.clientName}</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rep Name</label>
                          <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-foreground">
                            <User className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <p>{complaint.contactPerson || "—"}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</label>
                          <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                            {client?.email ? (
                              <a href={`mailto:${client.email}`} className="hover:text-pink-700 transition-colors truncate">
                                {client.email}
                              </a>
                            ) : (
                              <p className="text-muted-foreground">—</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone</label>
                          <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <a href={`tel:${complaint.phone}`} className="hover:text-pink-700 transition-colors">{complaint.phone}</a>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location</label>
                          <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-foreground">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <p>{complaint.location}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border/40">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs font-bold border-pink-200 text-pink-700 hover:bg-pink-50"
                            onClick={() => navigate(`/clients/${complaint.clientId}/complaints`)}
                          >
                            View Previous Complaints
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* AMC Details Card */}
                    <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                        <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-4.5 w-4.5 text-green-600" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">AMC Contract Details</h3>
                      </div>
                      
                      {(() => {
                        const activeAmc = clientAmc;
                        const status = client?.amcStatus ?? (activeAmc ? "Active" : "Inactive");
                        const badgeColor = 
                          status === "Active" ? "bg-green-500/10 text-green-600"
                          : status === "Expired" ? "bg-red-500/10 text-red-500"
                          : "bg-muted text-muted-foreground";

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AMC Status</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeColor}`}>
                                {status}
                              </span>
                            </div>

                            {activeAmc ? (
                              <div className="space-y-2.5 pt-2 border-t border-border/40 text-xs font-semibold">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Contract No</span>
                                  <span className="text-foreground">{activeAmc.amcNo}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Service Type</span>
                                  <span className="text-foreground">{activeAmc.serviceType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Frequency</span>
                                  <span className="text-foreground">{activeAmc.frequency}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Period</span>
                                  <span className="text-foreground">
                                    {new Date(activeAmc.startDate).toLocaleDateString(undefined, { month: "short", year: "2-digit" })} - {new Date(activeAmc.endDate).toLocaleDateString(undefined, { month: "short", year: "2-digit" })}
                                  </span>
                                </div>
                                {activeAmc.nextVisit && (
                                  <div className="flex justify-between text-blue-500">
                                    <span>Next Visit</span>
                                    <span>{new Date(activeAmc.nextVisit).toLocaleDateString()}</span>
                                  </div>
                                )}
                                
                                <div className="pt-2 border-t border-border/40">
                                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                    <span>Visits Progress</span>
                                    <span className="text-foreground font-bold">{activeAmc.visitsCompleted}/{activeAmc.totalVisits}</span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-green-500 h-1.5 rounded-full"
                                      style={{ width: `${(activeAmc.visitsCompleted / activeAmc.totalVisits) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 bg-muted/10 rounded-lg border border-dashed border-border/50 text-muted-foreground">
                                <Shield className="h-6 w-6 mx-auto mb-1 text-muted-foreground/45" />
                                <p className="text-[11px] font-medium">No AMC contract linked to client</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Timeline Info */}
                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4.5 w-4.5 text-green-500" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Timeline</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reported Date</label>
                        <p className="mt-1 text-foreground font-semibold text-sm">{new Date(complaint.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expected Resolution</label>
                        <p className="mt-1 text-pink-700 font-extrabold text-sm">{new Date(complaint.expectedResolution).toLocaleDateString()}</p>
                      </div>
                      <div className="pt-2">
                        <div className="bg-pink-500/5 rounded-xl p-4 border border-pink-500/20 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1.5">
                            <Calendar className="h-4 w-4 text-pink-600" />
                            <span className="font-bold text-xs text-foreground uppercase tracking-wider">Resolution Status</span>
                          </div>
                          {complaint.status === "Resolved" ? (
                            <p className="text-green-600 font-bold text-lg uppercase tracking-wide">Case Closed</p>
                          ) : (
                            <>
                              <p className="text-2xl font-black text-pink-600">
                                {Math.max(0, Math.ceil((new Date(complaint.expectedResolution).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} Days
                              </p>
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">Remaining until deadline</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* SM Report TAB */}
              <TabsContent value="service" className="m-0">
                <div className="bg-card rounded-xl border border-border p-5 lg:p-6 shadow-sm w-full">
                  {hasSmr && complaintSmr ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {complaintSmr.status === "Pending Approval" && complaint.status !== "Resolved" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/complaints/${id}/smr/edit`)}
                              className="h-8 text-xs font-bold flex items-center gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Report
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleOpenApprove}
                              className="h-8 text-xs font-bold bg-green-600 hover:bg-green-700 text-white"
                            >
                              Approve SMR
                            </Button>
                          </>
                        )}
                      </div>
                      <SMRReportView smr={complaintSmr} />
                    </div>
                  ) : (
                    <div className="py-16 border border-dashed border-border rounded-xl text-center space-y-4">
                      <Clipboard className="h-10 w-10 mx-auto text-muted-foreground/40" />
                      <div>
                        <p className="text-sm font-bold text-foreground">No SM Report yet</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                          One service maintenance report can be created per complaint.
                        </p>
                      </div>
                      {complaint.status !== "Resolved" && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/complaints/${id}/smr/create`)}
                          className="bg-pink-700 hover:bg-pink-800 text-white font-bold h-9 px-4 flex items-center gap-1.5 mx-auto"
                        >
                          <Clipboard className="h-4 w-4" />
                          Create SMR Report
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* REMARKS TAB */}
              <TabsContent value="remarks" className="m-0">
                {complaint.id && (
                  <RemarksChat
                    entityType="complaint"
                    entityId={complaint.id}
                    disabled={complaint.status === "Resolved"}
                  />
                )}
              </TabsContent>

              {/* SCHEDULES TAB */}
              <TabsContent value="schedules" className="m-0">
                <Schedules
                  entityId={complaint.id ?? ""}
                  entityType="complaint"
                  entityNo={complaint.complaintNo}
                  clientName={complaint.clientName}
                  title={complaint.issue}
                  onSuccess={() => fetchComplaintDetails(true)}
                  isClosed={complaint.status === "Resolved"}
                />
              </TabsContent>

            </Tabs>

      {/* SMR Approval Modal */}
      <SMRApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => {
          setIsApprovalOpen(false);
          setSmrToApprove(null);
        }}
        smr={smrToApprove}
        defaultRepName={complaint.contactPerson}
        onApproved={fetchComplaintDetails}
      />

      {/* Reassign Technicians Dialog */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Reassign Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <StaffSelectDropdown
              selected={selectedTechs}
              onChange={setSelectedTechs}
              label="Assigned Staff"
              placement="top"
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={() => setIsReassignOpen(false)} className="font-bold">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveReassign} className="bg-pink-700 hover:bg-pink-800 text-white font-bold">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Resolve Case Confirmation Modal */}
      <AlertDialog open={isResolveConfirmOpen} onOpenChange={setIsResolveConfirmOpen}>
        <AlertDialogContent className="bg-card border border-border shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Resolve Complaint Case?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to mark this complaint case ({complaint.complaintNo}) as **Resolved**? 
              This action will close the case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleUpdateStatus("Resolved")}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              Confirm Resolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Complaint Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl bg-card border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground font-bold">Edit Complaint</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Issue *</Label>
              <Input value={editIssue} onChange={(e) => setEditIssue(e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Description *</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-[110px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Complaint["priority"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["Critical", "High", "Medium", "Low"] as const).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expected Resolution *</Label>
              <Input
                type="date"
                value={editExpectedResolution}
                onChange={(e) => setEditExpectedResolution(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input value={editContactPerson} onChange={(e) => setEditContactPerson(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Location *</Label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/50 mt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSavingEdit}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveComplaintEdit}
              disabled={isSavingEdit}
              className="bg-pink-700 hover:bg-pink-800 text-white font-bold"
            >
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

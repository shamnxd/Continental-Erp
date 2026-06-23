import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, User, Award,
  Loader2, AlertTriangle, Calendar, MoreVertical, KeyRound,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
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
import { Staff, StaffWorkHistoryItem, getStaffDisplayRole } from "../../interfaces/staff.interface";
import { getStaffByIdApi, getStaffWorkHistoryApi, deleteStaffApi, changeStaffPasswordApi, getStaffSchedulesApi } from "../../api/staff.api";
import { getLeavesApi } from "../../api/leave.api";
import { StaffFormModal } from "../../components/StaffFormModal";
import { toast } from "sonner";

const labelClass = "text-[10px] font-bold text-muted-foreground uppercase tracking-wider";

export function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [workHistory, setWorkHistory] = useState<StaffWorkHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Schedules & Leaves state
  const [schedules, setSchedules] = useState<{ complaints: any[]; amcVisits: any[] }>({ complaints: [], amcVisits: [] });
  const [leaves, setLeaves] = useState<any[]>([]);

  // Leaves Date Filter
  const [leaveFilterType, setLeaveFilterType] = useState<"all" | "monthly" | "yearly" | "range">("all");
  const [leaveMonth, setLeaveMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [leaveYear, setLeaveYear] = useState(new Date().getFullYear());
  const [leaveDateFrom, setLeaveDateFrom] = useState("");
  const [leaveDateTo, setLeaveDateTo] = useState("");

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [staffRes, historyRes, schedulesRes, leavesRes] = await Promise.all([
        getStaffByIdApi(id),
        getStaffWorkHistoryApi(id),
        getStaffSchedulesApi(id),
        getLeavesApi({ staffId: id, page: 1, limit: 100 })
      ]);
      if (staffRes.success) setStaff(staffRes.data);
      if (historyRes.success) setWorkHistory(historyRes.data);
      if (schedulesRes.success) setSchedules(schedulesRes.data);
      if (leavesRes.success) setLeaves(leavesRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load staff details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const fromDate = new Date(leave.fromDate);
      if (leaveFilterType === "monthly") {
        return fromDate.getMonth() + 1 === leaveMonth && fromDate.getFullYear() === leaveYear;
      }
      if (leaveFilterType === "yearly") {
        return fromDate.getFullYear() === leaveYear;
      }
      if (leaveFilterType === "range") {
        if (!leaveDateFrom && !leaveDateTo) return true;
        const start = leaveDateFrom ? new Date(leaveDateFrom) : new Date(0);
        const end = leaveDateTo ? new Date(leaveDateTo) : new Date(8640000000000000);
        return fromDate >= start && fromDate <= end;
      }
      return true;
    });
  }, [leaves, leaveFilterType, leaveMonth, leaveYear, leaveDateFrom, leaveDateTo]);

  const leaveStats = useMemo(() => {
    const approved = filteredLeaves.filter((l) => l.status === "Approved");
    const pending = filteredLeaves.filter((l) => l.status === "Pending");
    const rejected = filteredLeaves.filter((l) => l.status === "Rejected");
    const totalDays = approved.reduce((sum, l) => sum + (l.days || 0), 0);
    return {
      total: filteredLeaves.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      totalDays,
    };
  }, [filteredLeaves]);

  const combinedSchedules = useMemo(() => {
    const list: any[] = [];
    schedules.complaints.forEach((c) => {
      list.push({
        id: c.id,
        title: c.title,
        type: "complaint",
        date: c.date,
        status: c.status,
        client: c.client,
        location: c.location,
        reference: c.reference,
        priority: c.priority,
      });
    });
    schedules.amcVisits.forEach((v) => {
      list.push({
        id: v.id,
        title: v.title,
        type: "amc_visit",
        date: v.date,
        status: v.status,
        client: v.client,
        location: v.location,
        reference: v.reference,
        notes: v.notes,
      });
    });
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [schedules]);

  const scheduleStats = useMemo(() => {
    const total = combinedSchedules.length;
    const completed = combinedSchedules.filter((s) => ["Resolved", "Completed"].includes(s.status)).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [combinedSchedules]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteStaffApi(id);
      toast.success("Staff deleted");
      navigate("/staff");
    } catch (err) {
      toast.error("Failed to delete staff");
    }
  };

  const handleChangePassword = async () => {
    if (!id || !newPassword.trim()) return;
    if (newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await changeStaffPasswordApi(id, newPassword.trim());
      toast.success("Password updated successfully");
      setIsChangePasswordOpen(false);
      setNewPassword("");
    } catch (err) {
      toast.error("Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      Available: "bg-green-500/10 text-green-600",
      "On Site": "bg-blue-500/10 text-blue-600",
      "On Leave": "bg-muted text-muted-foreground",
      Inactive: "bg-red-500/10 text-red-500",
      Pending: "bg-amber-500/10 text-amber-600",
      "In Progress": "bg-blue-500/10 text-blue-600",
      Resolved: "bg-green-500/10 text-green-600",
    };
    return map[status] ?? "bg-muted text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm">Loading staff details...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Staff member not found</p>
        <Button variant="outline" onClick={() => navigate("/staff")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Staff
        </Button>
      </div>
    );
  }

  const employmentBadge =
    staff.employmentType === "Permanent"
      ? { bg: "bg-pink-500/10", color: "text-pink-700", label: "Permanent Staff" }
      : { bg: "bg-amber-500/10", color: "text-amber-700", label: "Outsourced Staff" };

  return (
    <div className="space-y-4 pb-8">
      <Tabs defaultValue="details" className="space-y-4">
        {/* Header card — matches ClientDetail */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/staff")}
                className="gap-2 h-9 px-3 hover:bg-muted shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Back</span>
              </Button>
              <div className="h-8 w-px bg-border hidden sm:block shrink-0" />
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 border-2 border-primary/20 shadow">
                  <img
                    src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(staff.fullName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                    alt={staff.fullName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate leading-tight">
                    {staff.fullName}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {staff.staffNo} · {getStaffDisplayRole(staff)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${employmentBadge.bg} ${employmentBadge.color}`}
              >
                <Award className="h-3.5 w-3.5" />
                {employmentBadge.label}
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
                    <Edit className="mr-2 h-4 w-4 text-green-500" /> Edit Staff
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { setNewPassword(""); setIsChangePasswordOpen(true); }}
                    className="cursor-pointer"
                  >
                    <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" /> Change Password
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)} className="cursor-pointer">
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete Staff
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="px-4 sm:px-6">
            <TabsList className="w-fit h-12 bg-transparent p-0 rounded inline-flex flex-nowrap justify-start gap-6 lg:gap-8">
              {[
                { value: "details", label: "Details" },
                { value: "history", label: `Work History (${workHistory.length})` },
                { value: "schedules", label: `Schedules (${combinedSchedules.length})` },
                { value: "leaves", label: `Leaves (${filteredLeaves.length})` },
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

        <TabsContent value="details" className="m-0 space-y-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Phone</label>
                  <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${staff.phone}`} className="hover:text-pink-700">{staff.phone}</a>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${staff.email}`} className="hover:text-pink-700 truncate">{staff.email}</a>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Base City</label>
                  <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {staff.city}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Role</label>
                  <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {getStaffDisplayRole(staff)}
                  </div>
                </div>
                {staff.specialization && (
                  <div>
                    <label className={labelClass}>Specialization</label>
                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      {staff.specialization}
                    </div>
                  </div>
                )}
                {staff.notes && (
                  <div>
                    <label className={labelClass}>Notes</label>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{staff.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="m-0 space-y-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
            {workHistory.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No complaint assignments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workHistory.map((item) => (
                  <div
                    key={item.complaintId}
                    className="border border-border rounded-xl p-4 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => navigate(`/complaints/${item.complaintId}`)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-foreground">{item.complaintNo}</p>
                        <p className="text-sm text-muted-foreground">{item.clientName}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${statusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${statusColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mt-2 text-foreground">{item.issue}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.date).toLocaleDateString()} · {item.location}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="m-0 space-y-4">
          {/* Schedules Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">Total Schedules</span>
              <span className="text-2xl font-bold mt-1 block">{scheduleStats.total}</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider text-amber-600">Pending Works</span>
              <span className="text-2xl font-bold mt-1 block text-amber-600">{scheduleStats.pending}</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider text-green-600">Completed Works</span>
              <span className="text-2xl font-bold mt-1 block text-green-600">{scheduleStats.completed}</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
            {combinedSchedules.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No schedules assigned to this staff member</p>
              </div>
            ) : (
              <div className="space-y-3">
                {combinedSchedules.map((item) => (
                  <div
                    key={item.id}
                    className="border border-border rounded-xl p-4 hover:bg-muted/20 cursor-pointer transition-colors"
                    onClick={() => navigate(`/schedules/${item.id}`)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            item.type === "complaint" ? "bg-amber-100 text-amber-800" : "bg-pink-100 text-pink-800"
                          }`}>
                            {item.type === "complaint" ? "Complaint" : "AMC Visit"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">{item.reference}</span>
                        </div>
                        <h4 className="font-bold text-foreground mt-2">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">Client: {item.client}</p>
                      </div>
                      <div>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-3 pt-2 border-t border-border/50">
                      <span>Date: <strong className="text-foreground">{new Date(item.date).toLocaleDateString()}</strong></span>
                      <span>Location: <strong className="text-foreground">{item.location || "—"}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="m-0 space-y-4">
          {/* Date range filter toolbar */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">Filter Range:</label>
              <select
                value={leaveFilterType}
                onChange={(e) => setLeaveFilterType(e.target.value as any)}
                className="px-3 py-1.5 border border-border bg-background rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="all">All Leaves</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="range">Custom Range</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {leaveFilterType === "monthly" && (
                <>
                  <select
                    value={leaveMonth}
                    onChange={(e) => setLeaveMonth(Number(e.target.value))}
                    className="px-3 py-1.5 border border-border bg-background rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("en-US", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={leaveYear}
                    onChange={(e) => setLeaveYear(Number(e.target.value))}
                    className="px-3 py-1.5 border border-border bg-background rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </>
              )}

              {leaveFilterType === "yearly" && (
                <select
                  value={leaveYear}
                  onChange={(e) => setLeaveYear(Number(e.target.value))}
                  className="px-3 py-1.5 border border-border bg-background rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              )}

              {leaveFilterType === "range" && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={leaveDateFrom}
                    onChange={(e) => setLeaveDateFrom(e.target.value)}
                    className="px-3 py-1.5 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={leaveDateTo}
                    onChange={(e) => setLeaveDateTo(e.target.value)}
                    className="px-3 py-1.5 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Leaves Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm text-center">
              <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Total Requests</span>
              <span className="text-xl font-bold mt-0.5 block">{leaveStats.total}</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm text-center">
              <span className="text-[10px] text-green-600 block font-bold uppercase tracking-wider">Approved</span>
              <span className="text-xl font-bold mt-0.5 block text-green-600">{leaveStats.approved}</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm text-center">
              <span className="text-[10px] text-amber-600 block font-bold uppercase tracking-wider">Pending</span>
              <span className="text-xl font-bold mt-0.5 block text-amber-600">{leaveStats.pending}</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm text-center">
              <span className="text-[10px] text-red-500 block font-bold uppercase tracking-wider">Rejected</span>
              <span className="text-xl font-bold mt-0.5 block text-red-500">{leaveStats.rejected}</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-pink-700 block font-bold uppercase tracking-wider">Total Leave Days</span>
              <span className="text-xl font-bold mt-0.5 block text-pink-700">{leaveStats.totalDays} Days</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
            {filteredLeaves.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">No leave requests matching filter range</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredLeaves.map((leave) => (
                  <div key={leave.id} className="border border-border rounded-xl p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{leave.leaveType} Leave</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Submitted: {new Date(leave.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${statusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border/40">
                      <span>Period: <strong className="text-foreground">{new Date(leave.fromDate).toLocaleDateString()} – {new Date(leave.toDate).toLocaleDateString()}</strong></span>
                      <span>Duration: <strong className="text-foreground">{leave.days} day{leave.days !== 1 ? "s" : ""}</strong></span>
                      {leave.reason && <span className="italic">Reason: "{leave.reason}"</span>}
                    </div>
                    {leave.adminNote && (
                      <div className="text-xs p-2.5 bg-muted/30 border border-border/60 rounded-lg text-muted-foreground">
                        <strong className="text-foreground font-semibold">Admin Note:</strong> "{leave.adminNote}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <StaffFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(updated) => {
          setStaff(updated);
          setIsEditOpen(false);
        }}
        staff={staff}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {staff.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>This staff record will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <AlertDialog
        open={isChangePasswordOpen}
        onOpenChange={(open) => { if (!open) { setIsChangePasswordOpen(false); setNewPassword(""); } }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new portal login password for <strong>{staff.fullName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              id="detail-new-staff-password"
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 border-slate-200"
              onKeyDown={(e) => { if (e.key === "Enter") handleChangePassword(); }}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={changingPassword}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangePassword}
              disabled={changingPassword || newPassword.trim().length < 6}
              className="bg-pink-700 hover:bg-pink-800 text-white"
            >
              {changingPassword ? "Saving..." : "Save Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

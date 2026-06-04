import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, User, Briefcase,
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
import { getStaffByIdApi, getStaffWorkHistoryApi, deleteStaffApi, changeStaffPasswordApi } from "../../api/staff.api";
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

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [staffRes, historyRes] = await Promise.all([
        getStaffByIdApi(id),
        getStaffWorkHistoryApi(id),
      ]);
      if (staffRes.success) setStaff(staffRes.data);
      if (historyRes.success) setWorkHistory(historyRes.data);
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
      : { bg: "bg-amber-500/10", color: "text-amber-700", label: "Temporary Staff" };

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
                <Briefcase className="h-3.5 w-3.5" />
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
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
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

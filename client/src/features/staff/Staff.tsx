import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Plus, Edit, Trash2, Eye, MapPin, Phone, Mail, MoreVertical, UserX, UserCheck, KeyRound } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import type { Staff as StaffRecord } from "../../interfaces/staff.interface";
import { getStaffDisplayRole, getStaffStatusLabel } from "../../interfaces/staff.interface";
import { getStaffApi, deleteStaffApi, updateStaffApi, changeStaffPasswordApi } from "../../api/staff.api";
import { StaffFormModal } from "../../components/StaffFormModal";
import { useDebounce } from "../../hooks/useDebounce";
import { ManagementListPage } from "../../components/ManagementListPage";
import { toast } from "sonner";

type EmploymentFilter = "all" | "Permanent" | "Temporary";

const employmentFilterLabels: Record<EmploymentFilter, string> = {
  all: "All Types",
  Permanent: "Permanent",
  Temporary: "Temporary",
};

const PAGE_SIZE = 10;

export function Staff() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentFilter>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [changePasswordStaff, setChangePasswordStaff] = useState<StaffRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [stats, setStats] = useState({ total: 0, permanent: 0, temporary: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const [all, perm, temp] = await Promise.all([
        getStaffApi({ page: 1, limit: 1, activeOnly: false }),
        getStaffApi({ page: 1, limit: 1, employmentType: "Permanent", activeOnly: false }),
        getStaffApi({ page: 1, limit: 1, employmentType: "Temporary", activeOnly: false }),
      ]);
      setStats({
        total: all.total ?? 0,
        permanent: perm.total ?? 0,
        temporary: temp.total ?? 0,
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchStaff = useCallback(async (page: number, search: string, employment: EmploymentFilter) => {
    setIsLoading(true);
    try {
      const res = await getStaffApi({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        employmentType: employment !== "all" ? employment : undefined,
        activeOnly: false,
      });
      if (res.success) {
        setStaffList(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load staff");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, employmentFilter]);

  useEffect(() => {
    fetchStaff(currentPage, debouncedSearch, employmentFilter);
  }, [currentPage, debouncedSearch, employmentFilter, fetchStaff]);

  const statusColor = (label: string) => {
    const map: Record<string, string> = {
      Available: "bg-green-500/10 text-green-600",
      "On Site": "bg-blue-500/10 text-blue-600",
      "On Leave": "bg-muted text-muted-foreground",
      Inactive: "bg-red-500/10 text-red-500",
      Unavailable: "bg-red-500/10 text-red-500",
    };
    return map[label] ?? "bg-muted text-muted-foreground";
  };

  const handleToggleAvailability = async (s: StaffRecord, makeAvailable: boolean) => {
    if (!s.id) return;
    try {
      const res = await updateStaffApi(s.id, {
        isActive: makeAvailable,
        status: makeAvailable ? "Available" : "Inactive",
      });
      if (res.success) {
        toast.success(makeAvailable ? "Staff is now available for assignment" : "Staff marked as unavailable");
        fetchStaff(currentPage, debouncedSearch, employmentFilter);
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update staff availability");
    }
  };

  const renderStaffActions = (s: StaffRecord) => (
    <div
      className="flex justify-end"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 hover:bg-muted rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              navigate(`/staff/${s.id}`);
            }}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4 text-blue-500" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditStaff(s);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4 text-green-500" />
            Edit
          </DropdownMenuItem>
          {s.isActive ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleToggleAvailability(s, false);
              }}
              className="cursor-pointer"
            >
              <UserX className="mr-2 h-4 w-4 text-amber-600" />
              Mark Unavailable
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                handleToggleAvailability(s, true);
              }}
              className="cursor-pointer"
            >
              <UserCheck className="mr-2 h-4 w-4 text-green-500" />
              Mark Available
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault();
              setDeleteId(s.id!);
            }}
            className="cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setNewPassword("");
              setChangePasswordStaff(s);
            }}
            className="cursor-pointer"
          >
            <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
            Change Password
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const columns = [
    {
      header: "Staff",
      accessor: (s: StaffRecord) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-pink-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
            {s.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground leading-tight truncate max-w-[180px]">{s.fullName}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{s.staffNo}</p>
          </div>
        </div>
      ),
      className: "px-4 py-4 w-[220px] min-w-[200px]",
    },
    {
      header: "Role",
      accessor: (s: StaffRecord) => (
        <span className="text-sm font-medium text-foreground whitespace-nowrap">{getStaffDisplayRole(s)}</span>
      ),
      className: "px-4 py-4 w-[140px] min-w-[120px]",
    },
    {
      header: "Type",
      accessor: (s: StaffRecord) => (
        <span
          className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
            s.employmentType === "Permanent"
              ? "bg-pink-500/10 text-pink-700"
              : "bg-amber-500/10 text-amber-700"
          }`}
        >
          {s.employmentType}
        </span>
      ),
      className: "px-4 py-4 w-[110px]",
    },
    {
      header: "Contact",
      accessor: (s: StaffRecord) => (
        <div className="space-y-1 text-sm text-muted-foreground min-w-0">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[160px]">{s.phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[160px]">{s.email}</span>
          </div>
        </div>
      ),
      className: "px-4 py-4 w-[200px] min-w-[180px]",
    },
    {
      header: "City",
      accessor: (s: StaffRecord) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[100px]">{s.city}</span>
        </div>
      ),
      className: "px-4 py-4 w-[120px]",
    },
    {
      header: "Status",
      accessor: (s: StaffRecord) => {
        const label = getStaffStatusLabel(s);
        return (
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${statusColor(label)}`}>
            {label}
          </span>
        );
      },
      className: "px-4 py-4 w-[110px]",
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "px-4 py-4 text-right w-[52px]",
      accessor: (s: StaffRecord) => renderStaffActions(s),
    },
  ];

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStaffApi(deleteId);
      toast.success("Staff deleted");
      setDeleteId(null);
      fetchStaff(currentPage, debouncedSearch, employmentFilter);
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete staff");
    }
  };

  const handleChangePassword = async () => {
    if (!changePasswordStaff?.id || !newPassword.trim()) return;
    if (newPassword.trim().length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await changeStaffPasswordApi(changePasswordStaff.id, newPassword.trim());
      toast.success(`Password updated for ${changePasswordStaff.fullName}`);
      setChangePasswordStaff(null);
      setNewPassword("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const filterChips = [
    { value: "all" as EmploymentFilter, label: "All Types", count: stats.total, tone: "primary" as const },
    { value: "Permanent" as EmploymentFilter, label: "Permanent", count: stats.permanent, tone: "pink" as const },
    { value: "Temporary" as EmploymentFilter, label: "Temporary", count: stats.temporary, tone: "amber" as const },
  ];

  const employmentTypeBadge = (type: string) =>
    type === "Permanent"
      ? "bg-pink-500/10 text-pink-700"
      : "bg-amber-500/10 text-amber-700";

  return (
    <>
      <ManagementListPage
        title="Staff Management"
        subtitle="Manage permanent and temporary team members"
        headerAction={
          <Button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        }
        searchPlaceholder="Search by name, role, phone, email, city…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterChips}
        filterValue={employmentFilter}
        onFilterChange={setEmploymentFilter}
        activeFilterLabel={employmentFilter !== "all" ? employmentFilterLabels[employmentFilter] : undefined}
        onClearFilter={() => setEmploymentFilter("all")}
        columns={columns}
        data={staffList}
        isLoading={isLoading}
        rowKey={(s) => s.id ?? s.staffNo}
        onRowClick={(s) => s.id && navigate(`/staff/${s.id}`)}
        emptyMessage="No staff found"
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        entityLabel="staff"
      />

      <StaffFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          fetchStaff(currentPage, debouncedSearch, employmentFilter);
          fetchStats();
        }}
        staff={null}
      />
      <StaffFormModal
        isOpen={!!editStaff}
        onClose={() => setEditStaff(null)}
        onSuccess={() => {
          fetchStaff(currentPage, debouncedSearch, employmentFilter);
          fetchStats();
        }}
        staff={editStaff}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete staff member?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
        open={!!changePasswordStaff}
        onOpenChange={(open) => { if (!open) { setChangePasswordStaff(null); setNewPassword(""); } }}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new portal login password for <strong>{changePasswordStaff?.fullName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              id="new-staff-password"
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
    </>
  );
}

import { useState, useEffect } from "react";
import { useAppSelector } from "../../store/hooks";
import { api } from "../../api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Plus, Edit, Trash2, MoreVertical } from "lucide-react";
import { User } from "../../interfaces/user.interface";
import { ManagementListPage } from "../../components/ManagementListPage";
import { AdminFormModal } from "./AdminFormModal";

export function AdminManagement() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteAdmin, setDeleteAdmin] = useState<User | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response: any = await api.get("/admins");
      if (response.success) {
        setAdmins(response.data);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load administrators");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleEditClick = (admin: User) => {
    setSelectedAdmin(admin);
    setIsEditOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteAdmin?.id) return;

    try {
      const response: any = await api.delete(`/admins/${deleteAdmin.id}`);
      if (response.success) {
        toast.success("Administrator account deleted successfully");
        setDeleteAdmin(null);
        fetchAdmins();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete administrator");
    }
  };

  // Client-side filtering based on search query
  const filteredAdmins = admins.filter(
    (admin) =>
      (admin.name || admin.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: "Administrator",
      accessor: (admin: User) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 border border-border shadow-sm">
            <img
              src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                admin.name || admin.username || admin.email
              )}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
              alt={admin.name || admin.username}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-foreground leading-tight text-sm">
                {admin.name || admin.username}
              </p>
              {admin.id === currentUser?.id && (
                <Badge className="bg-pink-700/10 text-pink-700 hover:bg-pink-700/15 text-[10px] font-bold py-0 px-1.5 border-none">
                  You
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{admin.email}</p>
          </div>
        </div>
      ),
      className: "px-6 py-4",
    },
    {
      header: "CRM Access",
      accessor: (admin: User) => {
        const hasAccess = admin.permissions?.crm ?? true;
        return (
          <Badge
            className={`border-none ${
              hasAccess
                ? "bg-green-500/10 text-green-700 dark:text-green-400 font-semibold"
                : "bg-muted text-muted-foreground border border-dashed border-border"
            }`}
          >
            {hasAccess ? "Enabled" : "Disabled"}
          </Badge>
        );
      },
      className: "px-6 py-4",
    },
    {
      header: "Operations Access",
      accessor: (admin: User) => {
        const hasAccess = admin.permissions?.operations ?? true;
        return (
          <Badge
            className={`border-none ${
              hasAccess
                ? "bg-green-500/10 text-green-700 dark:text-green-400 font-semibold"
                : "bg-muted text-muted-foreground border border-dashed border-border"
            }`}
          >
            {hasAccess ? "Enabled" : "Disabled"}
          </Badge>
        );
      },
      className: "px-6 py-4",
    },
    {
      header: "Finance Access",
      accessor: (admin: User) => {
        const hasAccess = admin.permissions?.finance ?? true;
        return (
          <Badge
            className={`border-none ${
              hasAccess
                ? "bg-green-500/10 text-green-700 dark:text-green-400 font-semibold"
                : "bg-muted text-muted-foreground border border-dashed border-border"
            }`}
          >
            {hasAccess ? "Enabled" : "Disabled"}
          </Badge>
        );
      },
      className: "px-6 py-4",
    },
    {
      header: "Admin Access",
      accessor: (admin: User) => {
        const hasAccess = admin.permissions?.administration ?? true;
        return (
          <Badge
            className={`border-none ${
              hasAccess
                ? "bg-green-500/10 text-green-700 dark:text-green-400 font-semibold"
                : "bg-muted text-muted-foreground border border-dashed border-border"
            }`}
          >
            {hasAccess ? "Enabled" : "Disabled"}
          </Badge>
        );
      },
      className: "px-6 py-4",
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "px-6 py-4 text-right w-[60px]",
      accessor: (admin: User) => {
        const isSelf = admin.id === currentUser?.id;
        return (
          <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem
                  onClick={() => handleEditClick(admin)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4 text-green-500" />
                  Edit Permissions
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isSelf || admin.name === "admin" || admin.username === "admin"}
                  variant="destructive"
                  onClick={() => setDeleteAdmin(admin)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                  title={isSelf ? "You cannot delete yourself" : (admin.name === "admin" || admin.username === "admin") ? "The default super administrator account cannot be deleted" : "Delete Account"}
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <ManagementListPage
        title="Admin Management"
        subtitle="Create administrator accounts and manage their modular system permissions"
        headerAction={
          <Button
            onClick={() => {
              setSelectedAdmin(null);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 shrink-0 bg-pink-700 hover:bg-pink-800 text-white font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Administrator
          </Button>
        }
        searchPlaceholder="Search administrators by name or email…"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        columns={columns}
        data={filteredAdmins}
        isLoading={isLoading}
        rowKey={(admin) => admin.id}
        emptyMessage="No administrators found"
        currentPage={1}
        totalPages={1}
        total={filteredAdmins.length}
        pageSize={Math.max(filteredAdmins.length, 10)}
        onPageChange={() => {}}
        entityLabel="administrators"
      />

      <AdminFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchAdmins}
        admin={null}
      />

      <AdminFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={fetchAdmins}
        admin={selectedAdmin}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteAdmin} onOpenChange={(open) => !open && setDeleteAdmin(null)}>
        <AlertDialogContent className="rounded-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Delete administrator account?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete administrator <strong>{deleteAdmin?.name || deleteAdmin?.username || ""}</strong>? 
              This will permanently revoke all access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubmit} className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-semibold">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Staff,
  STAFF_ROLE_PRESETS,
  StaffEmploymentType,
} from "../interfaces/staff.interface";
import { createStaffApi, updateStaffApi } from "../api/staff.api";
import { useAppSelector } from "../store/hooks";
import { toast } from "sonner";

const inputClassName =
  "mt-1 border-border bg-background text-foreground placeholder:text-muted-foreground";

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (staff: Staff) => void;
  staff?: Staff | null;
}

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  role: "Technician" as string,
  customRole: "",
  employmentType: "Permanent" as StaffEmploymentType,
  specialization: "",
};

export function StaffFormModal({ isOpen, onClose, onSuccess, staff = null }: StaffFormModalProps) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (staff) {
      setForm({
        fullName: staff.fullName,
        phone: staff.phone,
        email: staff.email,
        city: staff.city,
        role: staff.role,
        customRole: staff.customRole || "",
        employmentType: staff.employmentType,
        specialization: staff.specialization || "",
      });
    } else {
      setForm(initialForm);
    }
  }, [staff, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim() || !form.city.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.role === "Custom" && !form.customRole.trim()) {
      toast.error("Enter a custom role name");
      return;
    }
    if (!accessToken) {
      toast.error("Your session expired. Please sign in again.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        role: form.role,
        customRole: form.role === "Custom" ? form.customRole.trim() : "",
        employmentType: form.employmentType,
        specialization: form.specialization.trim(),
        status: (staff ? staff.status : "Available") as any,
        isActive: staff ? staff.isActive : true,
      };

      if (staff?.id) {
        const res = await updateStaffApi(staff.id, payload);
        if (res.success) {
          toast.success("Staff updated");
          onSuccess(res.data);
          onClose();
        }
      } else {
        const res = await createStaffApi(payload);
        if (res.success) {
          toast.success("Staff member added");
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{staff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="staff-fullName" className="text-xs font-bold uppercase text-muted-foreground">
                Full Name *
              </Label>
              <Input
                id="staff-fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <Label htmlFor="staff-phone" className="text-xs font-bold uppercase text-muted-foreground">
                Phone *
              </Label>
              <Input
                id="staff-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <Label htmlFor="staff-email" className="text-xs font-bold uppercase text-muted-foreground">
                Email *
              </Label>
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <Label htmlFor="staff-city" className="text-xs font-bold uppercase text-muted-foreground">
                Base City *
              </Label>
              <Input
                id="staff-city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Employment Type *</Label>
              <Select
                value={form.employmentType}
                onValueChange={(v) => setForm({ ...form, employmentType: v as StaffEmploymentType })}
              >
                <SelectTrigger className="mt-1 border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Permanent">Permanent Staff</SelectItem>
                  <SelectItem value="Temporary">Temporary Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="mt-1 border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLE_PRESETS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r === "Custom" ? "Custom role..." : r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.role === "Custom" && (
              <div className="sm:col-span-2">
                <Label htmlFor="staff-customRole" className="text-xs font-bold uppercase text-muted-foreground">
                  Custom Role Name *
                </Label>
                <Input
                  id="staff-customRole"
                  value={form.customRole}
                  onChange={(e) => setForm({ ...form, customRole: e.target.value })}
                  placeholder="e.g. Site Coordinator"
                  className={inputClassName}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <Label htmlFor="staff-specialization" className="text-xs font-bold uppercase text-muted-foreground">
                Specialization
              </Label>
              <Input
                id="staff-specialization"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="e.g. HVAC, Electrical"
                className={inputClassName}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-pink-700 hover:bg-pink-800 text-white font-bold"
            >
              {isSubmitting ? "Saving..." : staff ? "Save Changes" : "Add Staff"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

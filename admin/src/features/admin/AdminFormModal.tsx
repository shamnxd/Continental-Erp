import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { User } from "../../interfaces/user.interface";
import { api } from "../../api";
import { toast } from "sonner";

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  admin: User | null;
}

export function AdminFormModal({ isOpen, onClose, onSuccess, admin }: AdminFormModalProps) {
  const initialFormState = {
    name: "",
    email: "",
    password: "",
    crm: true,
    operations: true,
    finance: true,
    administration: true,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  useEffect(() => {
    setErrors({});
    if (admin) {
      setFormData({
        name: admin.name || admin.username || "",
        email: admin.email,
        password: "", // Empty for security
        crm: admin.permissions?.crm ?? true,
        operations: admin.permissions?.operations ?? true,
        finance: admin.permissions?.finance ?? true,
        administration: admin.permissions?.administration ?? true,
      });
    } else {
      setFormData(initialFormState);
    }
  }, [admin, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: any = {};
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!admin && !formData.password.trim()) {
      newErrors.password = "Password is required for new accounts";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (admin && admin.id) {
        // Edit existing admin
        const payload: any = {
          name: formData.name,
          email: formData.email,
          permissions: {
            crm: formData.crm,
            operations: formData.operations,
            finance: formData.finance,
            administration: formData.administration,
          },
        };
        if (formData.password.trim()) {
          payload.password = formData.password;
        }

        const response: any = await api.put(`/admins/${admin.id}`, payload);
        if (response.success) {
          toast.success("Administrator account updated successfully");
          onSuccess();
          onClose();
        }
      } else {
        // Create new admin
        const response: any = await api.post("/admins", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          permissions: {
            crm: formData.crm,
            operations: formData.operations,
            finance: formData.finance,
            administration: formData.administration,
          },
        });
        if (response.success) {
          toast.success("Administrator account created successfully");
          onSuccess();
          onClose();
        }
      }
    } catch (error: any) {
      console.error("Failed to save admin:", error);
      const data = error.response?.data;
      if (data?.message === "Validation failed" && Array.isArray(data.errors)) {
        const fieldErrors: any = {};
        data.errors.forEach((err: any) => {
          // Map backend field name (e.g. name, email, password) to error state
          fieldErrors[err.field] = err.message;
        });
        setErrors(fieldErrors);
      } else if (data?.message) {
        const msg = data.message.toLowerCase();
        if (msg.includes("email")) {
          setErrors((prev) => ({ ...prev, email: data.message }));
        } else if (msg.includes("name")) {
          setErrors((prev) => ({ ...prev, name: data.message }));
        } else if (msg.includes("password")) {
          setErrors((prev) => ({ ...prev, password: data.message }));
        } else {
          toast.error(data.message);
        }
      } else {
        toast.error(error.response?.data?.message || "Failed to save administrator account");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent 
        className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{admin ? "Edit Administrator" : "Add New Administrator"}</DialogTitle>
        </DialogHeader>
        {(admin?.name === "admin" || admin?.username === "admin") && (
          <div className="bg-pink-700/10 text-pink-700 p-3 rounded-lg text-xs font-semibold mt-3 border border-pink-700/20">
            This is the default super administrator account. The name and module permissions cannot be modified.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="name" className={errors.name ? "text-red-600" : ""}>Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
                className={`mt-1 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                required
                disabled={admin?.name === "admin" || admin?.username === "admin"}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email" className={errors.email ? "text-red-600" : ""}>Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="email@company.com"
                className={`mt-1 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                required
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.email}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className={errors.password ? "text-red-600" : ""}>Password {admin ? "" : "*"}</Label>
                {admin && (
                  <span className="text-[10px] text-muted-foreground">Leave empty to keep current password</span>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter account password"
                className={`mt-1 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                required={!admin}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border/50">
            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Module Permissions</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">Toggle modules this administrator can access.</p>
          </div>

          {/* Grid structure for permissions switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/30">
            {/* CRM Switch */}
            <div className="flex items-center justify-between p-2 bg-background rounded-lg border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold cursor-pointer" htmlFor="perm-crm">
                  Sales & CRM
                </Label>
                <p className="text-[10px] text-muted-foreground">Clients, Enquiries, Quotations</p>
              </div>
              <Switch 
                id="perm-crm" 
                checked={formData.crm} 
                onCheckedChange={(val) => setFormData({ ...formData, crm: val })} 
                disabled={admin?.name === "admin" || admin?.username === "admin"}
              />
            </div>

            {/* Operations Switch */}
            <div className="flex items-center justify-between p-2 bg-background rounded-lg border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold cursor-pointer" htmlFor="perm-operations">
                  Operations & Services
                </Label>
                <p className="text-[10px] text-muted-foreground">Complaints, AMC, Schedules, Projects</p>
              </div>
              <Switch 
                id="perm-operations" 
                checked={formData.operations} 
                onCheckedChange={(val) => setFormData({ ...formData, operations: val })} 
                disabled={admin?.name === "admin" || admin?.username === "admin"}
              />
            </div>

            {/* Finance Switch */}
            <div className="flex items-center justify-between p-2 bg-background rounded-lg border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold cursor-pointer" htmlFor="perm-finance">
                  Finance & Analytics
                </Label>
                <p className="text-[10px] text-muted-foreground">Ledger, Bills, Invoices, Expenses, Reports</p>
              </div>
              <Switch 
                id="perm-finance" 
                checked={formData.finance} 
                onCheckedChange={(val) => setFormData({ ...formData, finance: val })} 
                disabled={admin?.name === "admin" || admin?.username === "admin"}
              />
            </div>

            {/* Administration Switch */}
            <div className="flex items-center justify-between p-2 bg-background rounded-lg border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold cursor-pointer" htmlFor="perm-admin">
                  Administration
                </Label>
                <p className="text-[10px] text-muted-foreground">Staff, Leaves, Audit logs, User accounts</p>
              </div>
              <Switch 
                id="perm-admin" 
                checked={formData.administration} 
                onCheckedChange={(val) => setFormData({ ...formData, administration: val })} 
                disabled={admin?.name === "admin" || admin?.username === "admin"}
              />
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-pink-700 hover:bg-pink-800 text-white font-semibold">
              {isSubmitting ? "Saving..." : admin ? "Save Changes" : "Save Administrator"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

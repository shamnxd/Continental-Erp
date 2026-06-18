import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Loader2 } from "lucide-react";
import { Client } from "../../interfaces/client.interface";
import { createClientApi, updateClientApi, uploadClientLogoApi } from "../../api/client.api";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: Client) => void;
  client?: Client | null;
}

export function ClientFormModal({ isOpen, onClose, onSuccess, client }: ClientFormModalProps) {
  const initialFormState = {
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    gst: "",
    city: "",
    address: "",
    parentCompany: "",
    logoUrl: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        phone: client.phone,
        email: client.email,
        gst: client.gst || "",
        city: client.city,
        address: client.address || "",
        parentCompany: client.parentCompany || "",
        logoUrl: client.logoUrl || "",
      });
    } else {
      setFormData(initialFormState);
    }
  }, [client, isOpen]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const res = await uploadClientLogoApi(file);
      if (res.success) {
        setFormData((prev) => ({ ...prev, logoUrl: res.url }));
      } else {
        alert("Failed to upload logo");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload logo. Please check server logs.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (client && client.id) {
        // Update client
        const response = await updateClientApi(client.id, formData);
        if (response.success) {
          onSuccess(response.data);
          onClose();
        }
      } else {
        // Create client
        const response = await createClientApi(formData);
        if (response.success) {
          onSuccess(response.data);
          onClose();
        }
      }
    } catch (error) {
      console.error("Failed to save client:", error);
      alert("Failed to save client. Please check details and try again.");
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
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            
            {/* Logo upload row */}
            <div className="sm:col-span-2 border-b border-border pb-4 mb-2 flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 border border-border shadow-sm flex items-center justify-center bg-muted">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No Logo</span>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="logoUpload">Company Logo (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="max-w-[250px] text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  />
                  {isUploadingLogo && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="parentCompany">Parent Company (e.g. SBI, TATA - Optional)</Label>
              <Input
                id="parentCompany"
                value={formData.parentCompany}
                onChange={(e) => setFormData({ ...formData, parentCompany: e.target.value })}
                placeholder="e.g. SBI"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Enter contact person"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@company.com"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                placeholder="GST Number"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
                className="mt-1"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
              className="mt-1"
            />
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isUploadingLogo} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingLogo} className="w-full sm:w-auto">
              {isSubmitting ? "Saving..." : "Save Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

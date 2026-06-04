import { useState } from "react";
import { submitPublicComplaintApi } from "../../api/complaintRequest.api";
import { toast } from "sonner";
import { ClipboardList, CheckCircle2, Phone, User, Building, MapPin, Mail, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";

export function PublicComplaintRegister() {
  const [form, setForm] = useState({
    clientName: "",
    contactPerson: "",
    phone: "",
    email: "",
    location: "",
    issue: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName.trim() || !form.contactPerson.trim() || !form.phone.trim() || !form.location.trim() || !form.issue.trim() || !form.description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitPublicComplaintApi({
        clientName: form.clientName,
        contactPerson: form.contactPerson,
        phone: form.phone,
        email: form.email || undefined,
        location: form.location,
        issue: form.issue,
        description: form.description,
      });

      if (response.success) {
        setIsSubmitted(true);
        toast.success("Complaint registered successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to register complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto h-16 w-16 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Complaint Submitted!</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
              Thank you for registering your complaint. Our service operations team has received it and will review and assign a technician shortly.
            </p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 text-left text-xs text-slate-500 space-y-2">
            <p><strong>Company/Client:</strong> {form.clientName}</p>
            <p><strong>Contact Person:</strong> {form.contactPerson}</p>
            <p><strong>Issue Registered:</strong> {form.issue}</p>
          </div>
          <Button
            onClick={() => {
              setForm({
                clientName: "",
                contactPerson: "",
                phone: "",
                email: "",
                location: "",
                issue: "",
                description: "",
              });
              setIsSubmitted(false);
            }}
            className="w-full h-12 bg-pink-700 hover:bg-pink-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-pink-700/10 active:scale-[0.98]"
          >
            Register Another Complaint
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background visual elements to match our wow aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-pink-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl relative z-10 space-y-8 my-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-700 mb-2">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customer Service Registration
          </h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Please fill out the form below to register your technical service or breakdown complaint. Our support desk will look into it immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-pink-700 uppercase tracking-widest border-b border-slate-100 pb-1.5">
              1. Customer Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                  Company / Organization Name <span className="text-pink-600">*</span>
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <Input
                    id="clientName"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    placeholder="Enter company name"
                    required
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contactPerson" className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                  Contact Person Name <span className="text-pink-600">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <Input
                    id="contactPerson"
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Enter name"
                    required
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                  Mobile / Phone Number <span className="text-pink-600">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Enter contact number"
                    required
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-slate-600 font-semibold">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter email address"
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                Site Location / Address <span className="text-pink-600">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-[13px] h-4.5 w-4.5 text-slate-400" />
                <textarea
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Enter full address of the equipment site location..."
                  rows={2}
                  required
                  className="w-full pl-10 pr-3.5 py-2 mt-1 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none font-sans"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-pink-700 uppercase tracking-widest border-b border-slate-100 pb-1.5">
              2. Complaint Details
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="issue" className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                Issue / Subject <span className="text-pink-600">*</span>
              </Label>
              <Input
                id="issue"
                value={form.issue}
                onChange={(e) => setForm({ ...form, issue: e.target.value })}
                placeholder="Brief title (e.g. AC compressor failure, Water pump leak)"
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                Problem Description & Details <span className="text-pink-600">*</span>
              </Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the issue, symptoms, model number of equipment, or any history..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 mt-1 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none font-sans"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-pink-700 hover:bg-pink-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-pink-700/10 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Registering Service Complaint...
              </>
            ) : (
              "Submit Service Request"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

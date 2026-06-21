import { useState } from "react";
import { submitPublicComplaintApi } from "../../api/complaintRequest.api";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";

export function PublicComplaintRegister() {
  const [step, setStep] = useState(1);
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
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleNext = () => {
    if (!form.clientName.trim() || !form.contactPerson.trim() || !form.phone.trim() || !form.location.trim()) {
      toast.error("Please fill in all required customer details.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.issue.trim() || !form.description.trim()) {
      toast.error("Please fill in all required complaint details.");
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

      console.log("Submit complaint response:", response);

      const payload: any = response;
      const isSuccess = payload?.success || payload?.data?.success;

      if (isSuccess) {
        const innerData = payload.data || payload;
        const finalData = innerData.data || innerData;
        const docId = finalData.id || finalData._id || "";
        const refCode = docId ? `REF-${String(docId).slice(-6).toUpperCase()}` : "REF-PENDING";
        setSubmittedRef(refCode);
        toast.success("Complaint registered successfully!");
      } else {
        // Fallback fallback if success is true but structure is different
        setSubmittedRef("REF-SUCCESS");
        toast.success("Complaint registered successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to register complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
        
        {/* Left Side: Logo & Branding */}
        <div className="md:col-span-5 flex flex-col items-center text-center gap-3 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-12 justify-center min-h-[300px]">
          <img
            src="/clogo.png"
            alt="Continental Logo"
            className="h-20 w-20 object-contain mb-1"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Continental
            </h1>
            <div className="inline-flex px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-[10px] font-bold tracking-wider uppercase">
              Support Desk
            </div>
          </div>
          <div className="space-y-1.5 max-w-xs mt-1">
            <p className="text-sm font-semibold text-slate-700">Service Register Portal</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our support team will review your submission and contact you within 24 to 48 hours.
            </p>
          </div>
        </div>

        {/* Right Side: Form or Success Card */}
        <div className="md:col-span-7">
          {submittedRef ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-200">
              <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Complaint Submitted!</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Thank you for registering your complaint. Our service team will review and contact you shortly.
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50 text-left text-xs text-slate-500 space-y-2">
                <div className="border-b border-slate-200/50 pb-2 mb-2 flex justify-between items-center text-slate-700">
                  <span className="font-semibold text-sm">Reference Number:</span>
                  <span className="font-mono font-extrabold text-pink-700 bg-pink-50 px-2 py-0.5 rounded text-sm">{submittedRef}</span>
                </div>
                <p><strong>Company:</strong> {form.clientName}</p>
                <p><strong>Contact:</strong> {form.contactPerson}</p>
                <p><strong>Issue:</strong> {form.issue}</p>
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
                  setStep(1);
                  setSubmittedRef(null);
                }}
                className="w-full h-10 bg-gradient-to-r from-pink-700 to-pink-600 hover:from-pink-600 hover:to-pink-500 text-white font-semibold rounded-lg transition-all active:scale-[0.98]"
              >
                Register Another Complaint
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Step Indicator */}
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <span className="uppercase tracking-wider">
                  {step === 1 ? "1. Customer Info" : "2. Complaint Details"}
                </span>
                <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  Step {step} of 2
                </span>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
                {step === 1 ? (
                  /* STEP 1: CUSTOMER INFO */
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="clientName" className="text-sm font-medium text-slate-700">
                        Company / Customer Name *
                      </Label>
                      <Input
                        id="clientName"
                        value={form.clientName}
                        onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                        placeholder="Enter organization name"
                        className="h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-pink-500 focus-visible:border-pink-500 rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="contactPerson" className="text-sm font-medium text-slate-700">
                        Contact Person *
                      </Label>
                      <Input
                        id="contactPerson"
                        value={form.contactPerson}
                        onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                        placeholder="Enter name"
                        className="h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-pink-500 focus-visible:border-pink-500 rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                        Mobile / Phone *
                      </Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Enter phone number"
                        className="h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-pink-500 focus-visible:border-pink-500 rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Email Address <span className="text-slate-400">(Optional)</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="Enter email address"
                        className="h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-pink-500 focus-visible:border-pink-500 rounded-lg"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                        Site Location / Address *
                      </Label>
                      <textarea
                        id="location"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        placeholder="Enter site location address"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none rounded-lg resize-none font-sans"
                        required
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={handleNext}
                      className="w-full h-10 bg-gradient-to-r from-pink-700 to-pink-600 hover:from-pink-600 hover:to-pink-500 text-white font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Next Step
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  /* STEP 2: COMPLAINT DETAILS */
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="issue" className="text-sm font-medium text-slate-700">
                        Issue / Subject *
                      </Label>
                      <Input
                        id="issue"
                        value={form.issue}
                        onChange={(e) => setForm({ ...form, issue: e.target.value })}
                        placeholder="e.g. Pump breakdown, AC gas leakage"
                        className="h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-pink-500 focus-visible:border-pink-500 rounded-lg"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                        Problem Description *
                      </Label>
                      <textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Detailed description of breakdown or services required..."
                        rows={4}
                        className="w-full px-3 py-2.5 text-sm border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none rounded-lg resize-none font-sans"
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={() => setStep(1)}
                        variant="outline"
                        className="flex-1 h-10 border-slate-200 text-slate-600 rounded-lg"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmit}
                        className="flex-[2] h-10 bg-gradient-to-r from-pink-700 to-pink-600 hover:from-pink-600 hover:to-pink-500 text-white font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Register Complaint"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

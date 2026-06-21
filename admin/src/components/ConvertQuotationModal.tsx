import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Quotation } from "../interfaces/quotation.interface";
import { convertQuotationApi } from "../api/quotation.api";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { FolderKanban, FileClock, Wrench } from "lucide-react";
import { StaffSelectDropdown } from "./StaffSelectDropdown";
import { getStaffApi } from "../api/staff.api";

interface ConvertQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
  onSuccess: () => void;
}

export function ConvertQuotationModal({
  isOpen,
  onClose,
  quotation,
  onSuccess,
}: ConvertQuotationModalProps) {
  const navigate = useNavigate();
  const [targetType, setTargetType] = useState<"project" | "amc" | "minorjob">("project");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Project Fields
  const [projectName, setProjectName] = useState("");
  const [projectStartDate, setProjectStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [projectExpectedCompletionDate, setProjectExpectedCompletionDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [projectValue, setProjectValue] = useState(0);

  // AMC Fields
  const [amcStartDate, setAmcStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [amcEndDate, setAmcEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [amcFrequency, setAmcFrequency] = useState<"Monthly" | "Quarterly" | "Bi-Annual" | "Annual">("Quarterly");
  const [amcServiceType, setAmcServiceType] = useState("Air Conditioning Service & Maintenance");
  const [amcAmount, setAmcAmount] = useState(0);
  const [amcNotes, setAmcNotes] = useState("");

  // Minor Job Fields
  const [minorJobDesc, setMinorJobDesc] = useState("");
  const [minorJobDate, setMinorJobDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      getStaffApi({ limit: 200, activeOnly: true })
        .then((res) => {
          if (res.success) setStaffList(res.data);
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && quotation) {
      setProjectName(`${quotation.clientName} - HVAC Installation`);
      setProjectStartDate(new Date().toISOString().split("T")[0]);
      const expected = new Date();
      expected.setDate(expected.getDate() + 30);
      setProjectExpectedCompletionDate(expected.toISOString().split("T")[0]);
      setProjectValue(quotation.total);

      setAmcStartDate(new Date().toISOString().split("T")[0]);
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      setAmcEndDate(d.toISOString().split("T")[0]);
      setAmcFrequency("Quarterly");
      setAmcServiceType("Annual Maintenance Contract");
      setAmcAmount(quotation.total);
      setAmcNotes(quotation.notes || "");

      // Prefill minor job description with quotation description/first line item or notes
      const defaultDesc = quotation.items && quotation.items.length > 0 
        ? quotation.items[0].description 
        : quotation.notes || `${quotation.clientName} - Minor Job`;
      setMinorJobDesc(defaultDesc);
      setMinorJobDate(new Date().toISOString().split("T")[0]);
      setSelectedStaffIds([]);
    }
  }, [isOpen, quotation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quotation.id) return;

    let payloadData = {};
    if (targetType === "project") {
      if (!projectName.trim()) {
        toast.error("Project name is required");
        return;
      }
      payloadData = {
        name: projectName.trim(),
        startDate: new Date(projectStartDate).toISOString(),
        expectedCompletionDate: new Date(projectExpectedCompletionDate).toISOString(),
        value: projectValue,
      };
    } else if (targetType === "amc") {
      if (!amcStartDate || !amcEndDate) {
        toast.error("Start and end dates are required");
        return;
      }
      payloadData = {
        startDateAmc: new Date(amcStartDate).toISOString(),
        endDateAmc: new Date(amcEndDate).toISOString(),
        frequency: amcFrequency,
        serviceType: amcServiceType.trim(),
        value: amcAmount,
        notes: amcNotes.trim(),
      };
    } else {
      if (!minorJobDesc.trim()) {
        toast.error("Description is required");
        return;
      }
      if (!minorJobDate) {
        toast.error("Scheduled date is required");
        return;
      }
      
      const selectedStaffNames = selectedStaffIds
        .map(id => staffList.find(s => (s.id || s._id) === id)?.fullName)
        .filter(Boolean);

      payloadData = {
        description: minorJobDesc.trim(),
        scheduledDate: new Date(minorJobDate).toISOString(),
        assignedTo: selectedStaffNames.join(", "),
        assignedStaffId: selectedStaffIds.join(", "),
      };
    }

    setIsSubmitting(true);
    try {
      const res = await convertQuotationApi(quotation.id, {
        targetType,
        data: payloadData,
      });

      if (res.success) {
        toast.success(`Converted successfully to ${targetType === "minorjob" ? "Minor Job" : targetType}`);
        onSuccess();
        onClose();

        const targetId = res.data.convertedTo?.targetId;
        if (targetType === "project") {
          navigate(`/projects/${targetId}`);
        } else if (targetType === "amc") {
          navigate(`/amc/${targetId}`);
        } else {
          navigate(`/minor-jobs/${targetId}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || `Failed to convert quotation to ${targetType}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full max-w-lg rounded-xl bg-card border border-border shadow-lg p-5 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Convert Quotation {quotation.quotationNo}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Choose what type of entity to convert this approved quotation into.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Convert To</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setTargetType("project")}
                className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-lg border-2 text-center transition-all ${
                  targetType === "project"
                    ? "border-pink-600 bg-pink-50/50 text-pink-700 font-bold dark:bg-pink-950/20 dark:text-pink-400"
                    : "border-border hover:border-slate-300 bg-background text-muted-foreground"
                }`}
              >
                <FolderKanban className="h-5 w-5 mb-1.5 shrink-0" />
                <span className="text-xs font-semibold">Project</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("amc")}
                className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-lg border-2 text-center transition-all ${
                  targetType === "amc"
                    ? "border-pink-600 bg-pink-50/50 text-pink-700 font-bold dark:bg-pink-950/20 dark:text-pink-400"
                    : "border-border hover:border-slate-300 bg-background text-muted-foreground"
                }`}
              >
                <FileClock className="h-5 w-5 mb-1.5 shrink-0" />
                <span className="text-xs font-semibold">AMC</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("minorjob")}
                className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-lg border-2 text-center transition-all ${
                  targetType === "minorjob"
                    ? "border-pink-600 bg-pink-50/50 text-pink-700 font-bold dark:bg-pink-950/20 dark:text-pink-400"
                    : "border-border hover:border-slate-300 bg-background text-muted-foreground"
                }`}
              >
                <Wrench className="h-5 w-5 mb-1.5 shrink-0" />
                <span className="text-xs font-semibold">Minor Job</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-border/60 my-2" />

          {/* Contextual Form Fields */}
          {targetType === "project" ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="mt-1 text-sm h-9"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="projectStartDate">Start Date *</Label>
                  <Input
                    id="projectStartDate"
                    type="date"
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                    className="mt-1 text-sm h-9"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="projectExpectedCompletion">Expected Completion *</Label>
                  <Input
                    id="projectExpectedCompletion"
                    type="date"
                    value={projectExpectedCompletionDate}
                    onChange={(e) => setProjectExpectedCompletionDate(e.target.value)}
                    className="mt-1 text-sm h-9"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="projectValue">Project Value (INR) *</Label>
                <Input
                  id="projectValue"
                  type="number"
                  value={projectValue || ""}
                  onChange={(e) => setProjectValue(Number(e.target.value))}
                  className="mt-1 text-sm h-9"
                  required
                />
              </div>
            </div>
          ) : targetType === "amc" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="amcStartDate">Start Date *</Label>
                  <Input
                    id="amcStartDate"
                    type="date"
                    value={amcStartDate}
                    onChange={(e) => setAmcStartDate(e.target.value)}
                    className="mt-1 text-sm h-9"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amcEndDate">End Date *</Label>
                  <Input
                    id="amcEndDate"
                    type="date"
                    value={amcEndDate}
                    onChange={(e) => setAmcEndDate(e.target.value)}
                    className="mt-1 text-sm h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Frequency *</Label>
                  <Select value={amcFrequency} onValueChange={(v) => setAmcFrequency(v as any)}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Bi-Annual">Bi-Annual</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amcAmount">Contract Amount *</Label>
                  <Input
                    id="amcAmount"
                    type="number"
                    value={amcAmount || ""}
                    onChange={(e) => setAmcAmount(Number(e.target.value))}
                    className="mt-1 text-sm h-9"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="amcServiceType">Service / AC Type *</Label>
                <Input
                  id="amcServiceType"
                  value={amcServiceType}
                  onChange={(e) => setAmcServiceType(e.target.value)}
                  placeholder="e.g. Split/Ductable AC Maintenance"
                  className="mt-1 text-sm h-9"
                  required
                />
              </div>

              <div>
                <Label htmlFor="amcNotes">AMC Notes / Terms</Label>
                <Textarea
                  id="amcNotes"
                  value={amcNotes}
                  onChange={(e) => setAmcNotes(e.target.value)}
                  placeholder="Payment terms, special notes..."
                  className="mt-1 text-sm"
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="minorJobDesc">Description *</Label>
                <Textarea
                  id="minorJobDesc"
                  value={minorJobDesc}
                  onChange={(e) => setMinorJobDesc(e.target.value)}
                  placeholder="Describe the job details..."
                  className="mt-1 text-sm"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="minorJobDate">Scheduled Date *</Label>
                <Input
                  id="minorJobDate"
                  type="date"
                  value={minorJobDate}
                  onChange={(e) => setMinorJobDate(e.target.value)}
                  className="mt-1 text-sm h-9"
                  required
                />
              </div>

              <div>
                <StaffSelectDropdown
                  selected={selectedStaffIds}
                  onChange={setSelectedStaffIds}
                  label="Assign Staff"
                  placement="bottom"
                  nameById={staffList.reduce((acc, curr) => {
                    const id = curr.id || curr._id;
                    if (id) acc[id] = curr.fullName;
                    return acc;
                  }, {} as Record<string, string>)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-9 text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-pink-700 hover:bg-pink-805 text-white font-semibold h-9 text-xs"
            >
              {isSubmitting ? "Converting..." : `Convert to ${targetType === "project" ? "Project" : targetType === "amc" ? "AMC" : "Minor Job"}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Plus, Trash2, CheckSquare } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { getComplaintByIdApi } from "../../api/complaint.api";
import { createSMRApi, getSMRsByComplaintApi, updateSMRApi } from "../../api/smr.api";
import { Complaint } from "../../interfaces/complaint.interface";
import { ACUnit, SMR } from "../../interfaces/smr.interface";
import { toast } from "sonner";

interface SMRCreatePageProps {
  mode: "create" | "edit";
}

const emptyEquipmentRow = (): ACUnit => ({
  type: "",
  make: "",
  modelNo: "",
  serialNo: "",
  quantity: 1,
  location: "N/A",
});

export function SMRCreatePage({ mode }: SMRCreatePageProps) {
  const { id: complaintId } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [existingSmr, setExistingSmr] = useState<SMR | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [natureOfComplaint, setNatureOfComplaint] = useState("");
  const [serviceRendered, setServiceRendered] = useState("");
  const [equipmentUnits, setEquipmentUnits] = useState<ACUnit[]>([emptyEquipmentRow()]);

  useEffect(() => {
    if (!complaintId) return;
    (async () => {
      try {
        setIsLoading(true);
        const [complaintRes, smrRes] = await Promise.all([
          getComplaintByIdApi(complaintId),
          getSMRsByComplaintApi(complaintId),
        ]);

        const smr = smrRes.success && smrRes.data.length > 0 ? smrRes.data[0] : null;

        if (isEdit) {
          if (!smr) {
            toast.info("No SMR report found to edit.");
            navigate(`/complaints/${complaintId}?tab=service`);
            return;
          }
          if (smr.status !== "Pending Approval") {
            toast.info("Only pending SMR reports can be edited.");
            navigate(`/complaints/${complaintId}?tab=service`);
            return;
          }
          setExistingSmr(smr);
          setNatureOfComplaint(smr.natureOfComplaint);
          setServiceRendered(smr.serviceRendered);
          setEquipmentUnits(
            smr.acUnits.length > 0
              ? smr.acUnits.map((u) => ({ ...u, serialNo: u.serialNo === "N/A" ? "" : u.serialNo }))
              : [emptyEquipmentRow()]
          );
        } else if (smr) {
          toast.info("This complaint already has an SMR report.");
          navigate(`/complaints/${complaintId}?tab=service`);
          return;
        }

        if (complaintRes.success) {
          setComplaint(complaintRes.data);
          if (!isEdit) {
            setNatureOfComplaint(complaintRes.data.issue || "");
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load complaint");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [complaintId, isEdit, navigate]);

  const addEquipmentRow = () => {
    setEquipmentUnits([...equipmentUnits, emptyEquipmentRow()]);
  };

  const removeEquipmentRow = (idx: number) => {
    if (equipmentUnits.length === 1) return;
    setEquipmentUnits(equipmentUnits.filter((_, i) => i !== idx));
  };

  const updateEquipment = (idx: number, field: keyof ACUnit, value: string | number) => {
    const updated = [...equipmentUnits];
    updated[idx] = { ...updated[idx], [field]: value };
    setEquipmentUnits(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !serviceRendered.trim()) return;

    const validUnits = equipmentUnits.filter(
      (u) => u.type.trim() && u.make.trim() && u.modelNo.trim()
    );
    if (validUnits.length === 0) {
      toast.error("Add at least one equipment item with type, make, and model.");
      return;
    }

    const payload = {
      natureOfComplaint: natureOfComplaint || complaint.issue,
      acUnits: validUnits.map((u) => ({
        ...u,
        serialNo: u.serialNo || "N/A",
        location: "N/A",
      })),
      serviceRendered: serviceRendered.trim(),
    };

    try {
      setIsSubmitting(true);

      if (isEdit && existingSmr?.id) {
        const res = await updateSMRApi(existingSmr.id, payload);
        if (res.success) {
          toast.success("SMR report updated.");
          navigate(`/complaints/${complaintId}?tab=service`);
        }
        return;
      }

      const res = await createSMRApi({
        complaintId: complaint.id || (complaint as { _id?: string })._id || "",
        clientId: complaint.clientId,
        clientName: complaint.clientName,
        clientLocation: complaint.location,
        contactName: complaint.contactPerson,
        date: new Date().toISOString(),
        ...payload,
        workDoneChecklist: {
          filtersCleaned: false,
          coilsCleaned: false,
          compressorCurrentChecked: false,
          electricalConnectionsTightened: false,
          gasPressureChecked: false,
        },
        compressorCurrentValue: "",
        status: "Pending Approval",
      });

      if (res.success) {
        toast.success(`SMR ${res.data.smrNo} created — pending approval`);
        navigate(`/complaints/${complaintId}?tab=service`);
      }
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 401) {
        toast.error("Session expired. Please log in again and retry.");
      } else if (axiosErr.response?.status === 400) {
        toast.error(axiosErr.response?.data?.message || "Cannot create SMR for this complaint");
        navigate(`/complaints/${complaintId}?tab=service`);
      } else {
        toast.error(axiosErr.response?.data?.message || (isEdit ? "Failed to update SMR" : "Failed to create SMR"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !complaint) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground font-semibold">
        Loading complaint details...
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 w-full">
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/complaints/${complaintId}?tab=service`)}
              className="gap-2 h-9 px-3 hover:bg-muted shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Back</span>
            </Button>
            <div className="h-8 w-px bg-border hidden sm:block shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-pink-600 shrink-0" />
                {isEdit ? "Edit SMR Report" : "Create SMR Report"}
              </h1>
              {isEdit && existingSmr && (
                <p className="text-xs text-muted-foreground mt-0.5">{existingSmr.smrNo}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {complaint.complaintNo} · {complaint.clientName}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          <div className="bg-muted/30 border border-border/60 rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Client Name</Label>
              <p className="mt-1 font-semibold text-foreground text-sm">{complaint.clientName}</p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Location</Label>
              <p className="mt-1 font-semibold text-foreground text-sm">{complaint.location}</p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Rep Name</Label>
              <p className="mt-1 font-semibold text-foreground text-sm">{complaint.contactPerson}</p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Complaint Ref</Label>
              <p className="mt-1 font-semibold text-foreground text-sm">{complaint.complaintNo}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <Label htmlFor="natureOfComplaint" className="text-xs font-bold uppercase text-muted-foreground">
                Nature of Complaint / Issue
              </Label>
              <Input
                id="natureOfComplaint"
                value={natureOfComplaint}
                onChange={(e) => setNatureOfComplaint(e.target.value)}
                placeholder="Describe the issue or service request"
                className="mt-1 h-9"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Equipment / Items Serviced
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEquipmentRow}
                className="h-8 text-xs font-semibold flex items-center gap-1 self-start sm:self-auto"
              >
                <Plus className="h-3 w-3" />
                Add Row
              </Button>
            </div>

            {/* Mobile: stacked cards */}
            <div className="md:hidden space-y-3">
              {equipmentUnits.map((unit, idx) => (
                <div key={idx} className="border border-border rounded-xl p-4 bg-card space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Item {idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEquipmentRow(idx)}
                      disabled={equipmentUnits.length === 1}
                      className="h-7 w-7 text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Type / Description</Label>
                      <Input
                        placeholder="e.g. Split AC, UPS, CCTV"
                        value={unit.type}
                        onChange={(e) => updateEquipment(idx, "type", e.target.value)}
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Make / Brand</Label>
                        <Input
                          placeholder="Make"
                          value={unit.make}
                          onChange={(e) => updateEquipment(idx, "make", e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Model No</Label>
                        <Input
                          placeholder="Model"
                          value={unit.modelNo}
                          onChange={(e) => updateEquipment(idx, "modelNo", e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Serial No</Label>
                        <Input
                          placeholder="Optional"
                          value={unit.serialNo}
                          onChange={(e) => updateEquipment(idx, "serialNo", e.target.value)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Qty</Label>
                        <Input
                          type="number"
                          value={unit.quantity}
                          min={1}
                          onChange={(e) => updateEquipment(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="mt-1 h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block border border-border rounded-xl overflow-x-auto shadow-sm w-full">
              <table className="w-full text-left text-xs divide-y divide-border">
                <thead className="bg-muted/70 text-muted-foreground font-bold">
                  <tr>
                    <th className="px-3 py-2.5">Type / Description</th>
                    <th className="px-3 py-2.5">Make / Brand</th>
                    <th className="px-3 py-2.5">Model No</th>
                    <th className="px-3 py-2.5">Serial No</th>
                    <th className="px-3 py-2.5 w-20">Qty</th>
                    <th className="px-2 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {equipmentUnits.map((unit, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-1.5">
                        <Input
                          placeholder="e.g. Split AC, UPS, CCTV"
                          value={unit.type}
                          onChange={(e) => updateEquipment(idx, "type", e.target.value)}
                          className="h-8 text-xs w-full"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          placeholder="Make / brand"
                          value={unit.make}
                          onChange={(e) => updateEquipment(idx, "make", e.target.value)}
                          className="h-8 text-xs w-full"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          placeholder="Model"
                          value={unit.modelNo}
                          onChange={(e) => updateEquipment(idx, "modelNo", e.target.value)}
                          className="h-8 text-xs w-full"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          placeholder="Optional"
                          value={unit.serialNo}
                          onChange={(e) => updateEquipment(idx, "serialNo", e.target.value)}
                          className="h-8 text-xs w-full"
                        />
                      </td>
                      <td className="px-2 py-1.5 w-20">
                        <Input
                          type="number"
                          value={unit.quantity}
                          min={1}
                          onChange={(e) => updateEquipment(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="h-8 text-xs text-center w-full"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEquipmentRow(idx)}
                          disabled={equipmentUnits.length === 1}
                          className="h-7 w-7 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <Label htmlFor="serviceRendered" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Details of Work Done / Service Rendered *
            </Label>
            <Textarea
              id="serviceRendered"
              placeholder="Describe all work performed, parts replaced, readings taken, etc."
              value={serviceRendered}
              onChange={(e) => setServiceRendered(e.target.value)}
              className="mt-1"
              rows={6}
              required
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/complaints/${complaintId}?tab=service`)}
              disabled={isSubmitting}
              className="h-10 px-6 font-semibold w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-pink-700 hover:bg-pink-800 text-white h-10 px-6 font-bold w-full sm:w-auto"
            >
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Creating SMR..."
                : isEdit
                  ? "Save Changes"
                  : "Create SMR (Pending Approval)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

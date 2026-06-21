import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Plus, Trash2, CheckSquare } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { getAmcByIdApi } from "../../api/amc.api";
import { createSMRApi } from "../../api/smr.api";
import { updateAmcVisitApi } from "../../api/amc.api";
import type { AmcContract } from "../../interfaces/amc.interface";
import type { ACUnit } from "../../interfaces/smr.interface";
import { toast } from "sonner";

const emptyEquipmentRow = (): ACUnit => ({
  type: "",
  make: "",
  modelNo: "",
  serialNo: "",
  quantity: 1,
  location: "N/A",
});

export function AmcSMRCreatePage() {
  const { amcId, visitId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<AmcContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [natureOfComplaint, setNatureOfComplaint] = useState("");
  const [serviceRendered, setServiceRendered] = useState("");
  const [equipmentUnits, setEquipmentUnits] = useState<ACUnit[]>([emptyEquipmentRow()]);

  useEffect(() => {
    if (!amcId) return;
    (async () => {
      try {
        setIsLoading(true);
        const res = await getAmcByIdApi(amcId);
        if (res.success) {
          setContract(res.data);
          setNatureOfComplaint(res.data.serviceType || "");
        } else {
          toast.error("Contract not found");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load contract");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [amcId]);

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
    if (!contract || !amcId || !visitId) return;

    if (!serviceRendered.trim()) return;

    const validUnits = equipmentUnits.filter((u) => u.type.trim() && u.make.trim() && u.modelNo.trim());
    if (validUnits.length === 0) {
      toast.error("Add at least one equipment item with type, make, and model.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSMRApi({
        amcVisitId: visitId,
        clientId: contract.clientId,
        clientName: contract.clientName,
        clientLocation: contract.location,
        contactName: contract.contactPerson,
        date: new Date().toISOString(),
        natureOfComplaint: natureOfComplaint || contract.serviceType,
        acUnits: validUnits.map((u) => ({
          ...u,
          serialNo: u.serialNo || "N/A",
          location: "N/A",
        })),
        serviceRendered: serviceRendered.trim(),
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
        await updateAmcVisitApi(amcId, visitId, { status: "Completed" });
        toast.success(`SMR ${res.data.smrNo} created — pending approval`);
        navigate(`/amc/${amcId}/visits/${visitId}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create SMR");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !contract) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground font-semibold">
        Loading contract details...
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
              onClick={() => navigate(`/amc/${amcId}/visits/${visitId}`)}
              className="gap-2 h-9 px-3 hover:bg-muted shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Back</span>
            </Button>
            <div className="h-8 w-px bg-border hidden sm:block shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-pink-600 shrink-0" />
                Create SMR Report
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {contract.amcNo} · {contract.clientName}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          <div className="bg-muted/30 border border-border/60 rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Client Name</Label>
              <p className="mt-1 font-semibold text-foreground text-sm">{contract.clientName}</p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Location</Label>
              <p className="mt-1 font-semibold text-foreground text-sm">{contract.location}</p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Rep Name</Label>
              <p className="mt-1 font-semibold text-foreground text-sm">{contract.contactPerson}</p>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">Contract Ref</Label>
              <p className="mt-1 font-semibold text-foreground text-sm">{contract.amcNo}</p>
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
              onClick={() => navigate(`/amc/${amcId}/visits/${visitId}`)}
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
              {isSubmitting ? "Creating SMR..." : "Create SMR (Pending Approval)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

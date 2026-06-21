import { CheckSquare, Landmark } from "lucide-react";
import { SMR } from "../../interfaces/smr.interface";

interface SMRReportViewProps {
  smr: SMR;
}

const labelClass = "text-[10px] font-bold text-muted-foreground uppercase tracking-wider";

export function SMRReportView({ smr }: SMRReportViewProps) {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Pending Approval":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "Rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="w-full space-y-5 text-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2 min-w-0">
          <CheckSquare className="h-5 w-5 text-pink-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground truncate">{smr.smrNo}</p>
            <p className="text-xs text-muted-foreground">Service Maintenance Report</p>
          </div>
        </div>
        <span
          className={`self-start px-2.5 py-1 text-xs font-semibold border rounded-full uppercase tracking-wider ${getStatusBadgeColor(smr.status)}`}
        >
          {smr.status === "Pending Approval" ? "Pending" : smr.status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className={labelClass}>Service Date</label>
          <p className="mt-1 font-semibold text-foreground">
            {new Date(smr.date).toLocaleDateString()}
          </p>
        </div>
        <div>
          <label className={labelClass}>Client</label>
          <p className="mt-1 font-semibold text-foreground">{smr.clientName}</p>
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <p className="mt-1 font-semibold text-foreground">{smr.clientLocation}</p>
        </div>
        <div>
          <label className={labelClass}>Contact</label>
          <p className="mt-1 font-semibold text-foreground">{smr.contactName}</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={labelClass}>Nature of Complaint</label>
          <p className="mt-1 text-foreground leading-relaxed">{smr.natureOfComplaint}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Equipment / Items Serviced
        </h3>
        <div className="border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border">
              <tr>
                <th className="px-3 py-2.5">Type / Description</th>
                <th className="px-3 py-2.5">Make</th>
                <th className="px-3 py-2.5">Model No</th>
                <th className="px-3 py-2.5">Serial No</th>
                <th className="px-3 py-2.5 text-center w-16">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {smr.acUnits.map((unit, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 font-semibold text-foreground">{unit.type}</td>
                  <td className="px-3 py-2 text-muted-foreground">{unit.make}</td>
                  <td className="px-3 py-2 text-muted-foreground">{unit.modelNo}</td>
                  <td className="px-3 py-2 text-muted-foreground">{unit.serialNo}</td>
                  <td className="px-3 py-2 text-center font-semibold text-foreground">{unit.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <label className={labelClass}>Details of Work Done / Service Rendered</label>
        <p className="mt-1 text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-3 rounded-lg border border-border/50">
          {smr.serviceRendered}
        </p>
      </div>

      {smr.approval && (
        <div className="pt-4 border-t border-border/50 space-y-2">
          <label className={labelClass}>Client Representative Approval</label>
          <p className="font-semibold text-foreground">{smr.approval.clientRepName}</p>
          {smr.approval.designation && (
            <p className="text-xs text-muted-foreground">{smr.approval.designation}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Approved on {new Date(smr.approval.date).toLocaleDateString()}
          </p>
          {smr.approval.hasSeal && (
            <div className="mt-2 flex items-center gap-1.5 text-pink-700 bg-pink-50 border border-pink-200 rounded-md px-2.5 py-1 w-fit text-[10px] font-bold uppercase">
              <Landmark className="h-3.5 w-3.5" />
              Company Stamp Applied
            </div>
          )}
          {smr.approval.signature.startsWith("data:image/") && (
            <div className="mt-2 border border-border rounded-lg p-2 bg-background inline-block">
              <img
                src={smr.approval.signature}
                alt="Representative signature"
                className="max-w-[200px] max-h-16 object-contain"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

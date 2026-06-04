import { FileText, Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import type { SMR } from "../../interfaces/smr.interface";

interface SmrImportPanelProps {
  smr: SMR | null;
  onImportLines: () => void;
}

export function SmrImportPanel({ smr, onImportLines }: SmrImportPanelProps) {
  if (!smr) {
    return (
      <p className="text-xs text-muted-foreground rounded-lg border border-dashed p-3">
        Link a complaint with an approved SMR to import service lines (equipment + work done). Enter rates on the invoice.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-pink-200 bg-pink-50/40 dark:bg-pink-950/20 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <FileText className="h-5 w-5 text-pink-700 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{smr.smrNo}</p>
          <p className="text-xs text-muted-foreground">
            {smr.clientName} · {smr.status} · {smr.acUnits.length} equipment row(s)
          </p>
          {smr.serviceRendered && (
            <p className="text-xs mt-1 line-clamp-2">{smr.serviceRendered}</p>
          )}
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto" onClick={onImportLines}>
        <Download className="h-3.5 w-3.5" />
        Import line items from SMR
      </Button>
      <p className="text-[10px] text-muted-foreground">SMR has no prices — you set qty/rate per line after import.</p>
    </div>
  );
}

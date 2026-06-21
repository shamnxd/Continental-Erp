import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { getQuotationsApi } from "../../api/quotation.api";
import { Quotation, QuotationStatus } from "../../interfaces/quotation.interface";
import { AppRoute } from "../../constants/routes.enum";
import { toast } from "sonner";

interface EnquiryQuotationsTabProps {
  enquiryId: string;
  onCreateQuotationClick: () => void;
}

interface QuotationGroup {
  quotationNo: string;
  activeRevision: Quotation;
  revisions: Quotation[];
}

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    "Pending Approval": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    Approved: "bg-green-500/10 text-green-600 dark:text-green-400",
    Rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
    Expired: "bg-muted text-muted-foreground",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
};

export function EnquiryQuotationsTab({ enquiryId, onCreateQuotationClick }: EnquiryQuotationsTabProps) {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotations = useCallback(async () => {
    if (!enquiryId) return;
    setIsLoading(true);
    try {
      const res = await getQuotationsApi({ enquiryId, allRevisions: true });
      if (res.success) {
        // Sort by date descending, then revision descending
        const sorted = [...res.data].sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return (b.revision ?? 0) - (a.revision ?? 0);
        });
        setQuotations(sorted);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quotations");
    } finally {
      setIsLoading(false);
    }
  }, [enquiryId]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-pink-700/50 animate-pulse" />
            <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">
              Linked Quotations...
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/20 rounded-xl border border-border overflow-hidden shadow-sm animate-pulse">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-border/80 text-muted-foreground text-left font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Quotation No</th>
                <th className="py-2.5 px-3">Rev</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Created From</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-8 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed border-border px-6 space-y-4">
        <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mx-auto">
          <FileText className="h-6 w-6 text-pink-700" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-foreground">No Quotations Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            No quotations have been prepared for this enquiry yet. You can create one from a costing sheet or from scratch.
          </p>
        </div>
        <Button
          onClick={onCreateQuotationClick}
          className="bg-pink-700 hover:bg-pink-800 text-white font-semibold gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Create Quotation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-pink-700" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Linked Quotations ({quotations.length})
          </span>
        </div>
        {quotations.length === 0 && (
          <Button
            size="sm"
            onClick={onCreateQuotationClick}
            className="bg-pink-700 hover:bg-pink-800 text-white font-semibold gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            New Quotation
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900/20 rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-border/80 text-muted-foreground text-left font-bold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3">Quotation No</th>
              <th className="py-2.5 px-3">Rev</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Created From</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {quotations.map((rev) => (
              <tr
                key={rev.id}
                onClick={() => navigate(`${AppRoute.QUOTATIONS}/${rev.id}`)}
                className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors duration-150 ${
                  rev.isActive
                    ? "bg-pink-50/20 text-pink-900 dark:text-pink-100 font-semibold"
                    : "text-muted-foreground font-medium"
                }`}
              >
                <td className="py-3 px-3 font-bold text-foreground">{rev.quotationNo}</td>
                <td className="py-3 px-3 font-bold">Rev {rev.revision}</td>
                <td className="py-3 px-3">
                  {new Date(rev.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3 px-3 font-semibold text-foreground">{formatInr(rev.total)}</td>
                <td className="py-3 px-3">
                  {rev.costingRevision !== undefined && rev.costingRevision !== null ? (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Costing Rev {rev.costingRevision}
                    </span>
                  ) : rev.clonedFromQuotationRevision !== undefined && rev.clonedFromQuotationRevision !== null ? (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Quotation Rev {rev.clonedFromQuotationRevision}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">Direct / Draft</span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${getStatusColor(
                      rev.status
                    )}`}
                  >
                    {rev.status}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {rev.isActive ? (
                    <span className="text-[10px] text-green-600 font-bold uppercase">
                      Yes
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

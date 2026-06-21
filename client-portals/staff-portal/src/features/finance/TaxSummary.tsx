import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { ApiRoute } from "../../constants/routes.enum";
import { toast } from "sonner";
import {
  RotateCw,
  Percent,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

interface TaxData {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export default function TaxSummary() {
  const [taxData, setTaxData] = useState<TaxData>({ cgst: 0, sgst: 0, igst: 0, total: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchTaxSummary = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(ApiRoute.TALLY_TAX_SUMMARY);
      if (res.success && res.data) {
        setTaxData(res.data);
      }
      setIsCached(!!res.isCached);
      setLastSyncedAt(res.lastSyncedAt || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load tax balances from Tally");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxSummary();
  }, []);

  return (
    <div className="space-y-6">
      {isCached && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2 shadow-sm">
          <span className="font-semibold">⚠️ Tally Agent is Offline.</span>
          <span>Showing cached report from {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "N/A"}.</span>
        </div>
      )}
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">GST Duties &amp; Taxes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track CGST, SGST, and IGST balances directly from Tally Duties &amp; Taxes ledgers.
          </p>
        </div>

        <button
          onClick={fetchTaxSummary}
          disabled={loading}
          className="flex items-center gap-1.5 bg-pink-700 hover:bg-pink-800 text-white font-semibold rounded-xl h-10 px-4 transition-colors text-sm shadow-md"
        >
          <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Reload Tax Summary
        </button>
      </div>

      {/* OVERVIEW SUMMARY GRID */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">CGST Ledger Balance</span>
            <div className="rounded-lg bg-pink-700/10 p-1.5 text-pink-700">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-foreground sm:text-xl mt-2">
            ₹{taxData.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Central Goods &amp; Services Tax Liability</p>
        </div>

        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">SGST Ledger Balance</span>
            <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-500">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-foreground sm:text-xl mt-2">
            ₹{taxData.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">State Goods &amp; Services Tax Liability</p>
        </div>

        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Tax Liability</span>
            <div className="rounded-lg bg-rose-500/10 p-1.5 text-rose-500">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-rose-500 sm:text-xl mt-2">
            ₹{taxData.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-semibold text-rose-500">
            <AlertCircle className="h-3 w-3 animate-pulse" /> Cumulative GST Payable
          </p>
        </div>
      </div>

      {/* TAX FILING ADVISORY */}
      <div className="bg-primary/5 rounded-xl border border-primary/10 p-4 space-y-2.5">
        <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
          <CheckCircle className="h-4 w-4" />
          Filing &amp; Reconciliation Advisory
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          These figures show your current ledger closing balances under the **Duties &amp; Taxes** group in Tally. 
          CGST and SGST balances will net out against available Input Tax Credit (ITC) from purchase vouchers 
          once monthly entries are reconciled in Tally. 
          To cross-reference with GSTR-1, export the sales register or use Tally's GST report suite.
        </p>
      </div>

      {/* DETAILS CARD */}
      <div className="rounded-xl border bg-card shadow-sm p-4.5 space-y-3">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Ledger Details</h3>
        
        {loading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <RotateCw className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <div className="space-y-3 max-w-xl">
            <div className="flex justify-between items-center py-2.5 border-b text-sm">
              <span className="font-semibold text-foreground">CGST (Central GST)</span>
              <span className="font-bold text-foreground">₹{taxData.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b text-sm">
              <span className="font-semibold text-foreground">SGST (State GST)</span>
              <span className="font-bold text-foreground">₹{taxData.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b text-sm">
              <span className="font-semibold text-foreground">IGST (Integrated GST)</span>
              <span className="font-bold text-foreground">₹{taxData.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center py-3 text-sm font-extrabold text-rose-500">
              <span>Total Duties &amp; Taxes Balance</span>
              <span>₹{taxData.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

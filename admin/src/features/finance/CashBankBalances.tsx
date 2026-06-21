import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { ApiRoute } from "../../constants/routes.enum";
import { toast } from "sonner";
import {
  RotateCw,
  Building2,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Layers
} from "lucide-react";

interface AccountBalance {
  ledgerName: string;
  balance: number;
}

export default function CashBankBalances() {
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(ApiRoute.TALLY_BALANCES);
      if (res.success && res.data) {
        setBalances(res.data);
      }
      setIsCached(!!res.isCached);
      setLastSyncedAt(res.lastSyncedAt || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load bank balances from Tally");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const totalBank = balances
    .filter(b => b.ledgerName.toLowerCase().includes("bank") || b.ledgerName.toLowerCase().includes("account"))
    .reduce((sum, b) => sum + b.balance, 0);

  const totalCash = balances
    .filter(b => b.ledgerName.toLowerCase().includes("cash"))
    .reduce((sum, b) => sum + b.balance, 0);

  const totalFunds = totalBank + totalCash;

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
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Cash & Bank Balances</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor ledger closing balances across all bank accounts and cash boxes configured in Tally.
          </p>
        </div>

        <button
          onClick={fetchBalances}
          disabled={loading}
          className="flex items-center gap-1.5 bg-pink-700 hover:bg-pink-800 text-white font-semibold rounded-xl h-10 px-4 transition-colors text-sm shadow-md"
        >
          <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Balances
        </button>
      </div>

      {/* SUMMARY GRID */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Bank Ledger Funds</span>
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-foreground sm:text-xl mt-2">
            ₹{totalBank.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Total in bank checking accounts</p>
        </div>

        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Cash in Hand</span>
            <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-500">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-foreground sm:text-xl mt-2">
            ₹{totalCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Liquid cash in cash registry / boxes</p>
        </div>

        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Available Funds</span>
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-lg font-extrabold text-emerald-600 sm:text-xl mt-2">
            ₹{totalFunds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-semibold text-emerald-600">
            <TrendingUp className="h-3 w-3" /> Working capital cash flow
          </p>
        </div>
      </div>

      {/* DETAILED ACCOUNTS CARDS LIST */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Account Ledgers</h3>
        
        {loading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground border border-dashed rounded-xl bg-card">
            <RotateCw className="h-5 w-5 animate-spin mr-2 text-primary" />
            Loading cash/bank ledgers from Tally...
          </div>
        ) : balances.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl bg-card">
            No bank or cash ledger balances found.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {balances.map((acct) => {
              const isCash = acct.ledgerName.toLowerCase().includes("cash");
              return (
                <div key={acct.ledgerName} className="rounded-xl border bg-card p-3 shadow-sm flex items-center justify-between hover:shadow-md transition">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isCash ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}>
                      {isCash ? <Wallet className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">{acct.ledgerName}</h4>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider leading-none">
                        {isCash ? "Asset / Cash-in-hand" : "Asset / Bank Account"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      ₹{acct.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5 justify-end leading-none mt-0.5">
                      <ArrowUpRight className="h-2.5 w-2.5" /> Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

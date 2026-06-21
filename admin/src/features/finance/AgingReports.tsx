import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { ApiRoute } from "../../constants/routes.enum";
import { toast } from "sonner";
import {
  RotateCw,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface AgingItem {
  name: string;
  amount: number;
  days30: number;
  days60: number;
  days90: number;
  days90plus: number;
}

interface AgingData {
  receivables: AgingItem[];
  payables: AgingItem[];
}

export default function AgingReports() {
  const [data, setData] = useState<AgingData>({ receivables: [], payables: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("receivables");
  const [isCached, setIsCached] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchAging = async () => {
    setLoading(true);
    try {
      const res: any = await api.get(ApiRoute.TALLY_AGING);
      if (res.success && res.data) {
        setData(res.data);
      }
      setIsCached(!!res.isCached);
      setLastSyncedAt(res.lastSyncedAt || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to retrieve aging reports from Tally");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAging();
  }, []);

  const calculateTotalDue = (list: AgingItem[]) => {
    return list.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateBracketTotal = (list: AgingItem[], bracket: keyof AgingItem) => {
    return list.reduce((sum, item) => sum + (Number(item[bracket]) || 0), 0);
  };

  const totalReceivable = calculateTotalDue(data.receivables);
  const totalPayable = calculateTotalDue(data.payables);

  const getBrackets = (list: AgingItem[]) => {
    return {
      t30: calculateBracketTotal(list, "days30"),
      t60: calculateBracketTotal(list, "days60"),
      t90: calculateBracketTotal(list, "days90"),
      t90p: calculateBracketTotal(list, "days90plus")
    };
  };

  const recBrackets = getBrackets(data.receivables);
  const payBrackets = getBrackets(data.payables);

  const currentBrackets = activeTab === "receivables" ? recBrackets : payBrackets;
  const currentTotal = activeTab === "receivables" ? totalReceivable : totalPayable;

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
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Outstanding Aging Reports</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor client payment outstanding periods and vendor payables directly from Tally bill details.
          </p>
        </div>

        <button
          onClick={fetchAging}
          disabled={loading}
          className="flex items-center gap-1.5 bg-pink-700 hover:bg-pink-800 text-white font-semibold rounded-xl h-10 px-4 transition-colors text-sm shadow-md"
        >
          <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Reload Aging
        </button>
      </div>

      {/* QUICK STATS METRIC */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accounts Receivable</p>
          <h3 className="text-lg font-extrabold text-pink-700 sm:text-xl mt-1.5">
            ₹{totalReceivable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Dues outstanding from customers</p>
        </div>

        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accounts Payable</p>
          <h3 className="text-lg font-extrabold text-rose-500 sm:text-xl mt-1.5">
            ₹{totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Pending payments owed to vendors</p>
        </div>

        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overdue (&gt;90 Days)</p>
          <h3 className="text-lg font-extrabold text-amber-500 sm:text-xl mt-1.5">
            ₹{(recBrackets.t90p + payBrackets.t90p).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-semibold text-amber-600">
            <AlertTriangle className="h-3 w-3" /> Action required
          </p>
        </div>

        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Receivables</p>
          <h3 className="text-lg font-extrabold text-emerald-500 sm:text-xl mt-1.5">
            ₹{(totalReceivable - totalPayable).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Net pending cash flow margin</p>
        </div>
      </div>

      {/* AGING BRACKET BREAKDOWNS */}
      <div className="rounded-xl border bg-card p-3.5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Aging Brackets Summary ({activeTab === "receivables" ? "Receivables" : "Payables"})
        </h3>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="border rounded-xl p-3 bg-muted/20">
            <span className="text-xs text-muted-foreground font-semibold">0 - 30 Days</span>
            <p className="text-base font-bold text-foreground mt-0.5">
              ₹{currentBrackets.t30.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[9px] text-muted-foreground font-bold">
              {currentTotal > 0 ? Math.round((currentBrackets.t30 / currentTotal) * 100) : 0}% of total
            </span>
          </div>

          <div className="border rounded-xl p-3 bg-muted/20">
            <span className="text-xs text-muted-foreground font-semibold">31 - 60 Days</span>
            <p className="text-base font-bold text-foreground mt-0.5">
              ₹{currentBrackets.t60.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[9px] text-muted-foreground font-bold">
              {currentTotal > 0 ? Math.round((currentBrackets.t60 / currentTotal) * 100) : 0}% of total
            </span>
          </div>

          <div className="border rounded-xl p-3 bg-muted/20">
            <span className="text-xs text-muted-foreground font-semibold">61 - 90 Days</span>
            <p className="text-base font-bold text-foreground mt-0.5">
              ₹{currentBrackets.t90.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[9px] text-muted-foreground font-bold">
              {currentTotal > 0 ? Math.round((currentBrackets.t90 / currentTotal) * 100) : 0}% of total
            </span>
          </div>

          <div className="border rounded-xl p-3 bg-amber-500/5 border-amber-500/20">
            <span className="text-xs text-amber-600 font-bold">90+ Days (Critical)</span>
            <p className="text-base font-bold text-amber-500 mt-0.5">
              ₹{currentBrackets.t90p.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[9px] text-amber-600 font-bold">
              {currentTotal > 0 ? Math.round((currentBrackets.t90p / currentTotal) * 100) : 0}% of total
            </span>
          </div>
        </div>
      </div>

      {/* DETAIL TABLES TABS */}
      <Tabs defaultValue="receivables" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted rounded-xl">
          <TabsTrigger value="receivables" className="rounded-lg text-xs font-semibold py-2">
            Accounts Receivable (Clients)
          </TabsTrigger>
          <TabsTrigger value="payables" className="rounded-lg text-xs font-semibold py-2">
            Accounts Payable (Vendors)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="mt-6">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Customer Name</th>
                    <th className="px-5 py-3 text-right">0-30 Days</th>
                    <th className="px-5 py-3 text-right">31-60 Days</th>
                    <th className="px-5 py-3 text-right">61-90 Days</th>
                    <th className="px-5 py-3 text-right">90+ Days</th>
                    <th className="px-5 py-3 text-right font-bold">Total Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <RotateCw className="h-4 w-4 animate-spin text-primary" />
                          Loading Accounts Receivable...
                        </div>
                      </td>
                    </tr>
                  ) : data.receivables.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        All customer balances cleared! No outstanding receivables.
                      </td>
                    </tr>
                  ) : (
                    data.receivables.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="px-5 py-4 font-semibold text-foreground">{item.name}</td>
                        <td className="px-5 py-4 text-right text-muted-foreground font-medium">₹{item.days30.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-right text-muted-foreground font-medium">₹{item.days60.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-right text-muted-foreground font-medium">₹{item.days90.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-right text-amber-500 font-bold">₹{item.days90plus.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-right font-extrabold text-pink-700">₹{item.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payables" className="mt-6">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3">Vendor / Payee Name</th>
                    <th className="px-5 py-3 text-right">0-30 Days</th>
                    <th className="px-5 py-3 text-right">31-60 Days</th>
                    <th className="px-5 py-3 text-right">61-90 Days</th>
                    <th className="px-5 py-3 text-right">90+ Days</th>
                    <th className="px-5 py-3 text-right font-bold">Total Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        <div className="flex items-center justify-center gap-2">
                          <RotateCw className="h-4 w-4 animate-spin text-primary" />
                          Loading Accounts Payable...
                        </div>
                      </td>
                    </tr>
                  ) : data.payables.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                        All vendor bills paid! No outstanding payables.
                      </td>
                    </tr>
                  ) : (
                    data.payables.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="px-5 py-4 font-semibold text-foreground">{item.name}</td>
                        <td className="px-5 py-4 text-right text-muted-foreground font-medium">₹{item.days30.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-right text-muted-foreground font-medium">₹{item.days60.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-right text-muted-foreground font-medium">₹{item.days90.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-right text-rose-500 font-bold">₹{item.days90plus.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-4 text-right font-extrabold text-rose-500">₹{item.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

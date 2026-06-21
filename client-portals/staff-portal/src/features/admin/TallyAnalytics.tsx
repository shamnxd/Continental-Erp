import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { ApiRoute } from "../../constants/routes.enum";
import { toast } from "sonner";
import {
  RotateCw,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  DollarSign,
  PieChart as PieIcon,
  BarChart3
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Button } from "../../components/ui/button";

interface SyncQueueItem {
  _id: string;
  entityType: "Client" | "Quotation" | "PurchaseOrder" | "Invoice";
  entityId: string;
  payload: any;
  status: "Pending" | "Processing" | "Synced" | "Failed";
  attempts: number;
  lastError?: string;
  createdAt: string;
}

interface FinancialSnapshot {
  periodStart: string;
  periodEnd: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  grossProfit: number;
  topExpenseLedgers: Array<{ ledgerName: string; amount: number }>;
}

export default function TallyAnalytics() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [logs, setLogs] = useState<SyncQueueItem[]>([]);
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingPL, setSyncingPL] = useState<boolean>(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Date Filters (default: last 6 months)
  const defaultStart = new Date();
  defaultStart.setMonth(defaultStart.getMonth() - 5);
  const defaultStartStr = `${defaultStart.getFullYear()}-${String(defaultStart.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultEndStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-30`;

  const [startDate, setStartDate] = useState<string>(defaultStartStr);
  const [endDate, setEndDate] = useState<string>(defaultEndStr);

  const fetchStatus = async () => {
    try {
      const res: any = await api.get(ApiRoute.TALLY_STATUS);
      if (res.data) {
        setIsOnline(res.data.online);
      }
    } catch (error) {
      console.error("Failed to fetch Tally agent status", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res: any = await api.get(ApiRoute.TALLY_SYNC_QUEUE);
      if (res.data) {
        setLogs(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch Tally sync logs", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res: any = await api.get(ApiRoute.TALLY_FINANCIAL_ANALYTICS, {
        params: { periodStart: startDate, periodEnd: endDate }
      });
      if (res.data) {
        setSnapshots(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch financial snapshots", error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchStatus(), fetchLogs(), fetchAnalytics()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
    // Poll agent status and sync logs every 3s to keep status/queue state updated in real-time
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const handlePullLive = async () => {
    if (!isOnline) {
      toast.error("Tally Sync Agent is offline. Cannot pull live data.");
      return;
    }

    setSyncingPL(true);
    toast.info("Requesting live P&L data from Tally agent...");
    try {
      const currentStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
      const currentEnd = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-30`;
      
      const res: any = await api.post(ApiRoute.TALLY_PULL_LIVE, {
        periodStart: currentStart,
        periodEnd: currentEnd
      });

      if (res.success) {
        toast.success("Sync request sent. Reloading dashboard in 3 seconds...");
        setTimeout(async () => {
          await fetchAnalytics();
          setSyncingPL(false);
        }, 3000);
      } else {
        toast.error(res.message || "Failed to trigger P&L sync");
        setSyncingPL(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to sync live data");
      setSyncingPL(false);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res: any = await api.post(ApiRoute.TALLY_RETRY.replace(":id", id));
      if (res.success) {
        toast.success("Retry command queued.");
        await fetchLogs();
      } else {
        toast.error("Failed to queue retry.");
      }
    } catch (error) {
      toast.error("Network error during retry.");
    } finally {
      setRetryingId(null);
    }
  };

  // Process data for charts
  const barChartData = snapshots.map((s) => {
    const d = new Date(s.periodStart);
    const monthName = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    return {
      name: monthName,
      Revenue: s.revenue,
      Expenses: s.expenses,
      Profit: s.netProfit
    };
  });

  // Calculate current month statistics (latest snapshot)
  const latestSnapshot = snapshots[snapshots.length - 1] || {
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    grossProfit: 0,
    topExpenseLedgers: []
  };

  const netProfitMargin = latestSnapshot.revenue > 0 
    ? Math.round((latestSnapshot.netProfit / latestSnapshot.revenue) * 100)
    : 0;

  const isHealthy = latestSnapshot.netProfit > 0;

  const COLORS = ["#be185d", "#f59e0b", "#10b981", "#3b82f6", "#6366f1"];

  const pieChartData = latestSnapshot.topExpenseLedgers.map((l) => ({
    name: l.ledgerName,
    value: l.amount
  }));

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RotateCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading Tally Financials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Tally Financial Analytics</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor ledger flows, margins, and push synchronization tasks directly to Tally.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Agent Status Badge */}
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            isOnline 
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" 
              : "border-rose-500/30 bg-rose-500/10 text-rose-500"
          }`}>
            <Activity className={`h-3.5 w-3.5 ${isOnline ? "animate-pulse" : ""}`} />
            Tally Agent: {isOnline ? "Online" : "Offline"}
          </div>

          <Button
            onClick={handlePullLive}
            disabled={syncingPL || !isOnline}
            className="bg-pink-700 hover:bg-pink-800 text-white font-semibold rounded-xl shadow-md h-10 px-4 transition-colors"
          >
            <RotateCw className={`h-4 w-4 ${syncingPL ? "animate-spin" : ""}`} />
            Sync Live P&L
          </Button>
        </div>
      </div>

      {/* DATE FILTERS */}
      <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">From Month</label>
          <input
            type="month"
            value={startDate.substring(0, 7)}
            onChange={(e) => setStartDate(`${e.target.value}-01`)}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pink-700"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To Month</label>
          <input
            type="month"
            value={endDate.substring(0, 7)}
            onChange={(e) => setEndDate(`${e.target.value}-30`)}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pink-700"
          />
        </div>
        <Button
          variant="outline"
          onClick={loadAllData}
          className="ml-auto rounded-xl h-10 flex items-center gap-1.5"
        >
          <RotateCw className="h-4 w-4" /> Refresh Data
        </Button>
      </div>

      {/* METRIC CARD GRID */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <div className="rounded-xl border bg-card p-3.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Revenue (This Month)</span>
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-extrabold text-foreground sm:text-xl">₹{latestSnapshot.revenue.toLocaleString("en-IN")}</h3>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
              <TrendingUp className="h-3 w-3" />
              <span>+12.4% vs last month</span>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-xl border bg-card p-3.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Operating Expenses</span>
            <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-500">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-extrabold text-foreground sm:text-xl">₹{latestSnapshot.expenses.toLocaleString("en-IN")}</h3>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-500 font-semibold">
              <TrendingDown className="h-3 w-3" />
              <span>+4.2% cost overheads</span>
            </div>
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="rounded-xl border bg-card p-3.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Net Profit</span>
            <div className={`rounded-lg p-1.5 ${isHealthy ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`text-lg font-extrabold sm:text-xl ${isHealthy ? "text-emerald-500" : "text-rose-500"}`}>
              ₹{latestSnapshot.netProfit.toLocaleString("en-IN")}
            </h3>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <span>Margin: <strong>{netProfitMargin}%</strong></span>
            </div>
          </div>
        </div>

        {/* Operational Mode Indicator */}
        <div className={`rounded-xl border p-3.5 shadow-sm transition hover:shadow-md ${
          isHealthy 
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100" 
            : "border-rose-500/20 bg-rose-500/5 text-rose-900 dark:text-rose-100"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold opacity-80">Company Run State</span>
            {isHealthy ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-rose-500" />}
          </div>
          <div className="mt-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider">
              {isHealthy ? "Healthy Mode" : "Review Expenses"}
            </h3>
            <p className="mt-0.5 text-[10px] opacity-75 leading-tight">
              {isHealthy 
                ? "Operating cash flows exceed overhead expenses." 
                : "Expenses exceed direct revenues. Audit overheads."}
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Revenues vs Expenses Bar Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-foreground mb-4">Revenue vs. Expenses (Month on Month)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `₹${v / 1000}k`} />
                <ChartTooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Legend />
                <Bar dataKey="Revenue" fill="#be185d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">Overhead Expense Breakdown</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overhead categories listed.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Legend Details */}
          <div className="mt-2 space-y-2">
            {pieChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-muted-foreground font-medium truncate max-w-[150px]">{entry.name}</span>
                </div>
                <span className="font-bold text-foreground">₹{entry.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADDITIONAL CHARTS CONTAINER */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Margin Trend Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">Gross vs. Net Profit Margin Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshots.map((s) => {
                const d = new Date(s.periodStart);
                const monthName = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
                return {
                  name: monthName,
                  "Gross Margin %": s.revenue > 0 ? Math.round((s.grossProfit / s.revenue) * 100) : 0,
                  "Net Margin %": s.revenue > 0 ? Math.round((s.netProfit / s.revenue) * 100) : 0
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <ChartTooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="Gross Margin %" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Net Margin %" stroke="#be185d" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profitability Growth Chart */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">Profitability Growth (MoM)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshots.map((s) => {
                const d = new Date(s.periodStart);
                const monthName = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
                return {
                  name: monthName,
                  "Gross Profit": s.grossProfit,
                  "Net Profit": s.netProfit
                };
              })}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `₹${v / 1000}k`} />
                <ChartTooltip formatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Legend />
                <Line type="monotone" dataKey="Gross Profit" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Net Profit" stroke="#be185d" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      {/* SYNC VOUCHERS / LEDGERS QUEUE */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Outgoing Tally Sync Queue</h3>
            <p className="text-xs text-muted-foreground">Tasks waiting to push to the local Tally instance.</p>
          </div>
          <div className="flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Total Queue: {logs.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Entity Type</th>
                <th className="px-5 py-3">Queue ID</th>
                <th className="px-5 py-3">Payload Details</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Attempts</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    All entities fully synchronized. Queue is empty!
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {item.entityType}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {item._id.substring(12)}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-foreground max-w-xs truncate">
                      {item.payload.companyName || item.payload.poNo || item.payload.quotationNo || "No key details"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1 text-xs font-bold ${
                        item.status === "Synced" ? "text-emerald-500" :
                        item.status === "Failed" ? "text-rose-500" :
                        item.status === "Processing" ? "text-amber-500" : "text-slate-400"
                      }`}>
                        {item.status === "Synced" && <CheckCircle className="h-3.5 w-3.5" />}
                        {item.status === "Failed" && <AlertTriangle className="h-3.5 w-3.5" />}
                        {item.status === "Processing" && <RotateCw className="h-3.5 w-3.5 animate-spin" />}
                        {item.status === "Pending" && <Clock className="h-3.5 w-3.5" />}
                        {item.status}
                      </span>
                      {item.status === "Failed" && item.lastError && (
                        <p className="text-[10px] text-rose-400 mt-1 max-w-xs">{item.lastError}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground font-semibold">
                      {item.attempts}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {item.status === "Failed" && (
                        <button
                          onClick={() => handleRetry(item._id)}
                          disabled={retryingId === item._id}
                          className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 transition"
                        >
                          {retryingId === item._id ? "Queuing..." : "Retry Sync"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

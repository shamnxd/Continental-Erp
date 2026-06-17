import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { getDashboardApi } from "../../api/dashboard.api";
import {
  AlertCircle,
  ArrowLeft,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export function CriticalAlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await getDashboardApi({ allAlerts: true });
        if (res.success && res.data.criticalAlerts) {
          setAlerts(res.data.criticalAlerts);
        }
      } catch (err) {
        console.error("Failed to load critical alerts", err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        alert.title.toLowerCase().includes(q) ||
        alert.client.toLowerCase().includes(q) ||
        alert.assignee.toLowerCase().includes(q);

      // 2. Priority Filter
      const matchesPriority =
        priorityFilter === "all" || alert.priority === priorityFilter;

      // 3. Type Filter
      let matchesType = true;
      if (typeFilter !== "all") {
        const titleL = alert.title.toLowerCase();
        if (typeFilter === "warranty") {
          matchesType = titleL.includes("warranty");
        } else if (typeFilter === "amc") {
          matchesType = titleL.includes("amc");
        } else if (typeFilter === "complaint") {
          matchesType = titleL.includes("complaint");
        } else if (typeFilter === "invoice") {
          matchesType = titleL.includes("invoice");
        }
      }

      return matchesSearch && matchesPriority && matchesType;
    });
  }, [alerts, searchQuery, priorityFilter, typeFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-pink-700" />
        <span className="text-sm font-semibold">Loading all alerts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-border"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Critical & High Priority Alerts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            A comprehensive overview of expired warranties, overdue AMC visits, pending complaints, and payment delays.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search alerts by client, description, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 !rounded-xl text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-11 !rounded-xl px-4 text-sm w-[160px] border-input">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-11 !rounded-xl px-4 text-sm w-[160px] border-input">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="warranty">Warranties</SelectItem>
                <SelectItem value="amc">AMC Visits</SelectItem>
                <SelectItem value="complaint">Complaints</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alerts List Container */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <span className="text-sm font-semibold text-foreground">
            Showing {filteredAlerts.length} of {alerts.length} Active Alerts
          </span>
        </div>
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground italic border border-dashed border-border rounded-xl">
              No matching alerts found
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => alert.link && navigate(alert.link)}
                className={`p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md hover:bg-muted/10 transition-all ${
                  alert.link ? "cursor-pointer" : ""
                } ${
                  alert.priority === "Critical"
                    ? "bg-red-500/5 border-red-500 hover:border-red-600"
                    : "bg-orange-500/5 border-orange-500 hover:border-orange-600"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`h-4 w-4 ${alert.priority === "Critical" ? "text-red-500" : "text-orange-500"}`} />
                    <h3 className="font-bold text-foreground text-sm sm:text-base">{alert.title}</h3>
                  </div>
                  <span
                    className={`w-fit px-2 py-0.5 text-xs font-bold rounded uppercase shrink-0 ${
                      alert.priority === "Critical"
                        ? "bg-red-500/20 text-red-500"
                        : "bg-orange-500/20 text-orange-500"
                    }`}
                  >
                    {alert.priority}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium bg-muted/40 px-2.5 py-1 rounded w-fit border border-border/20">
                  Client: <span className="text-foreground font-semibold">{alert.client}</span>
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground pt-2 border-t border-border/30">
                  <span>Assigned To: <strong className="text-foreground">{alert.assignee}</strong></span>
                  <span className="font-semibold text-pink-700">{alert.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

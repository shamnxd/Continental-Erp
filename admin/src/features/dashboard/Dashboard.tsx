import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getDashboardApi } from "../../api/dashboard.api";
import {
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const iconMap: Record<string, React.ComponentType<any>> = {
  FileText: FileText,
  Calendar: Calendar,
  AlertCircle: AlertCircle,
  DollarSign: DollarSign,
  Clock: Clock,
  Users: Users,
  CheckCircle: CheckCircle,
};

export function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await getDashboardApi();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-pink-700" />
        <span className="text-sm font-semibold">Loading dashboard data...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <span className="text-sm font-semibold">Failed to fetch dashboard metrics.</span>
      </div>
    );
  }

  const todayDateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Quick Overview Banner */}
      <div className="bg-gradient-to-r from-pink-700 via-pink-600 to-pink-600 rounded-2xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold mb-1">Today's Overview</h3>
            <p className="text-pink-100 text-[10px] font-medium uppercase tracking-wider">{todayDateStr}</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{data.overview.activeTasks}</p>
              <p className="text-pink-100 text-[10px] font-medium uppercase mt-0.5">Active Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{data.overview.alertsCount}</p>
              <p className="text-pink-100 text-[10px] font-medium uppercase mt-0.5">Alerts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{data.overview.revenueThisMonth}</p>
              <p className="text-pink-100 text-[10px] font-medium uppercase mt-0.5">Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.stats.map((stat: any) => {
          const IconComponent = iconMap[stat.icon] || FileText;
          return (
            <div
              key={stat.name}
              className="bg-card rounded-xl shadow-sm border border-border p-3.5 hover:shadow transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">{stat.name}</p>
                  <p className="text-2xl font-bold text-foreground leading-tight">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">{stat.change}</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-xl shadow-sm shrink-0`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Alerts & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Critical Alerts */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Critical Alerts</h3>
            <button
              onClick={() => navigate("/critical-alerts")}
              className="text-xs font-semibold text-pink-700 hover:text-pink-800 transition-colors bg-pink-50 dark:bg-pink-950/20 px-2.5 py-1 rounded-lg border border-pink-200/40 hover:border-pink-300 hover:bg-pink-100/50"
            >
              View All ({data.criticalAlerts.length})
            </button>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {data.criticalAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-xl">
                No active critical alerts found
              </div>
            ) : (
              data.criticalAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  onClick={() => alert.link && navigate(alert.link)}
                  className={`p-3 rounded-xl border-l-4 transition-colors ${
                    alert.link ? "cursor-pointer hover:bg-muted/30" : ""
                  } ${
                    alert.priority === "Critical"
                      ? "bg-red-500/10 border-red-500"
                      : "bg-orange-500/10 border-orange-500"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-foreground text-[13px]">{alert.title}</h4>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${
                        alert.priority === "Critical"
                          ? "bg-red-500/20 text-red-500"
                          : "bg-orange-500/20 text-orange-500"
                      }`}
                    >
                      {alert.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1 font-medium">{alert.client}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Assigned: {alert.assignee}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Upcoming Tasks</h3>
            <button
              onClick={() => navigate("/upcoming-tasks")}
              className="text-xs font-semibold text-pink-700 hover:text-pink-800 transition-colors bg-pink-50 dark:bg-pink-950/20 px-2.5 py-1 rounded-lg border border-pink-200/40 hover:border-pink-300 hover:bg-pink-100/50"
            >
              View All
            </button>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {data.upcomingTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground italic border border-dashed border-border rounded-xl">
                No upcoming visits or follow-ups scheduled
              </div>
            ) : (
              data.upcomingTasks.map((task: any) => (
                <div 
                  key={task.id} 
                  onClick={() => {
                    if (task.type === "enquiry") {
                      navigate(`/enquiries/${task.id}`);
                    } else {
                      navigate(`/schedules/${task.id}`);
                    }
                  }}
                  className="p-3 bg-muted/30 rounded-xl hover:bg-muted/50 hover:border-pink-650/30 transition-all border border-transparent cursor-pointer shadow-sm"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-foreground text-[13px]">{task.task}</h4>
                    <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1 font-medium">{task.client}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full overflow-hidden shrink-0 border border-primary/20 shadow-sm bg-pink-700 text-white text-[7px] flex items-center justify-center font-bold">
                        {task.assignee.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{task.assignee}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3 text-pink-650" />
                      {task.date}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Compact Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue vs Expenses - Compact */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Revenue</h3>
            <DollarSign className="h-4 w-4 text-pink-600" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data.revenueData}>
              <CartesianGrid key="revenue-grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis key="revenue-xaxis" dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
              <YAxis key="revenue-yaxis" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} hide />
              <Tooltip
                key="revenue-tooltip"
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "var(--foreground)"
                }}
                itemStyle={{ color: "var(--foreground)" }}
              />
              <Line key="revenue-line" type="monotone" dataKey="revenue" stroke="#be185d" strokeWidth={2} dot={{ fill: "#be185d", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-pink-700">
              {data.revenueData.length > 0
                ? data.revenueData[data.revenueData.length - 1].revenue >= 100000
                  ? `₹${(data.revenueData[data.revenueData.length - 1].revenue / 100000).toFixed(1)}L`
                  : `₹${data.revenueData[data.revenueData.length - 1].revenue.toLocaleString("en-IN")}`
                : "₹0"}
            </span>
            <span className="text-xs text-green-600 font-medium">+18%</span>
          </div>
        </div>

        {/* Complaints - Compact */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Complaints</h3>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                key="complaint-pie"
                data={data.complaintStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={50}
                fill="#8884d8"
                dataKey="value"
              >
                {data.complaintStatusData.map((entry: any, index: number) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                key="complaint-tooltip"
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {data.complaintStatusData.map((item: any, idx: number) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name.split(' ')[0]}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AMC Visits - Compact */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">AMC Visits</h3>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.amcVisitsData}>
              <CartesianGrid key="amc-grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis key="amc-xaxis" dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
              <YAxis key="amc-yaxis" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} hide />
              <Tooltip
                key="amc-tooltip"
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                }}
              />
              <Bar key="scheduled-bar" dataKey="scheduled" fill="#db2777" radius={[4, 4, 0, 0]} />
              <Bar key="completed-bar" dataKey="completed" fill="#9f1239" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#db2777]" />
                <span className="text-xs text-muted-foreground">Scheduled</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#9f1239]" />
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {data.amcVisitsData.length > 0
                ? `${data.amcVisitsData[data.amcVisitsData.length - 1].completed}/${data.amcVisitsData[data.amcVisitsData.length - 1].scheduled}`
                : "0/0"}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">
            Recent Activities
          </h3>
        </div>
        <div className="divide-y divide-border">
          {data.recentActivities.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground italic">
              No recent activity log recorded
            </div>
          ) : (
            data.recentActivities.map((activity: any) => (
              <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-border shadow-sm">
                  <img 
                    src={
                      activity.type === 'enquiry' || activity.type === 'complaint'
                        ? `https://i.pravatar.cc/150?u=${activity.id}`
                        : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(activity.client || "Continental")}&backgroundColor=be185d&fontSize=40&fontWeight=700`
                    } 
                    alt="" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {activity.title}
                    </p>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 font-medium">
                    {activity.type} • {activity.client}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

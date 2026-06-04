import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { staffApi } from "../../api/staffApi";
import { AppRoute } from "../../constants/routes.enum";
import { 
  CheckSquare, 
  AlertCircle, 
  Calendar, 
  CalendarDays, 
  Plus, 
  ArrowRight,
  Loader2,
  Clock,
  TrendingUp,
  FileText
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalTasks: number;
  pendingComplaints: number;
  upcomingVisits: number;
  pendingLeaves: number;
  approvedLeaves: number;
}

export function StaffDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assignedComplaints, setAssignedComplaints] = useState<any[]>([]);
  const [assignedVisits, setAssignedVisits] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, tasksRes, leavesRes]: any[] = await Promise.all([
          staffApi.get("/staff/portal/me"),
          staffApi.get("/staff/portal/tasks"),
          staffApi.get("/staff/portal/leaves?limit=100"),
        ]);
        
        setProfile(meRes.data);
        const complaints = tasksRes.data?.complaints || [];
        const visits = tasksRes.data?.amcVisits || [];
        const leaves = leavesRes.data || [];

        setAssignedComplaints(complaints);
        setAssignedVisits(visits);

        setStats({
          totalTasks: complaints.length + visits.length,
          pendingComplaints: complaints.filter((c: any) => c.status !== "Resolved").length,
          upcomingVisits: visits.filter((v: any) => v.status === "Scheduled").length,
          pendingLeaves: leaves.filter((l: any) => l.status === "Pending").length,
          approvedLeaves: leaves.filter((l: any) => l.status === "Approved").length,
        });
      } catch {
        // handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate complaint status data for PieChart
  const openCount = assignedComplaints.filter((c) => c.status === "Open" || c.status === "Pending" || c.status === "Assigned").length;
  const progressCount = assignedComplaints.filter((c) => c.status === "In Progress").length;
  const resolvedCount = assignedComplaints.filter((c) => c.status === "Resolved").length;

  const complaintChartData = [
    { name: "Resolved", value: resolvedCount || 1, color: "#be185d" }, // Default value of 1 to render chart if empty
    { name: "In Progress", value: progressCount, color: "#9f1239" },
    { name: "Pending", value: openCount, color: "#f59e0b" },
  ].filter(item => item.value > 0);

  // Calculate visit status data for BarChart
  const scheduledVisits = assignedVisits.filter(v => v.status === "Scheduled").length;
  const completedVisits = assignedVisits.filter(v => v.status === "Completed" || v.status === "Resolved").length;
  
  const visitChartData = [
    { name: "Scheduled", count: scheduledVisits },
    { name: "Completed", count: completedVisits },
  ];

  // High priority assigned items for alerts panel
  const highPriorityAlerts = assignedComplaints
    .filter((c) => c.priority === "Critical" || c.priority === "High")
    .slice(0, 3);

  // Timeline list of upcoming tasks
  const upcomingTasks = [
    ...assignedComplaints.map(c => ({ ...c, taskType: "Complaint" })),
    ...assignedVisits.map(v => ({ ...v, taskType: "AMC Visit" }))
  ].slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Quick Overview Banner */}
      <div className="bg-gradient-to-r from-pink-700 via-pink-600 to-pink-600 rounded-2xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold mb-1">
              {greeting()}, {profile?.fullName?.split(" ")[0]}! 👋
            </h3>
            <p className="text-pink-100 text-[10px] font-medium uppercase tracking-wider">
              {profile?.role || "Staff Member"} — Staff ID: {profile?.staffNo}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.totalTasks}</p>
              <p className="text-pink-100 text-[10px] font-medium uppercase mt-0.5">My Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.pendingComplaints}</p>
              <p className="text-pink-100 text-[10px] font-medium uppercase mt-0.5">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.pendingLeaves}</p>
              <p className="text-pink-100 text-[10px] font-medium uppercase mt-0.5">Leaves</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <button
            onClick={() => navigate(AppRoute.STAFF_TASKS)}
            className="bg-card rounded-xl shadow-sm border border-border p-3.5 hover:shadow transition-all text-left outline-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Total Assigned Tasks</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{stats.totalTasks}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">Active Session</span>
                </div>
              </div>
              <div className="bg-pink-700 p-3 rounded-xl shadow-sm shrink-0">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
            </div>
          </button>

          {/* Card 2 */}
          <button
            onClick={() => navigate(AppRoute.STAFF_TASKS)}
            className="bg-card rounded-xl shadow-sm border border-border p-3.5 hover:shadow transition-all text-left outline-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Pending Complaints</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{stats.pendingComplaints}</p>
                <div className="flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-500">Requires Action</span>
                </div>
              </div>
              <div className="bg-amber-500 p-3 rounded-xl shadow-sm shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </button>

          {/* Card 3 */}
          <button
            onClick={() => navigate(AppRoute.STAFF_TASKS)}
            className="bg-card rounded-xl shadow-sm border border-border p-3.5 hover:shadow transition-all text-left outline-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Upcoming AMC Visits</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{stats.upcomingVisits}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold text-blue-500">Scheduled</span>
                </div>
              </div>
              <div className="bg-pink-600 p-3 rounded-xl shadow-sm shrink-0">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
          </button>

          {/* Card 4 */}
          <button
            onClick={() => navigate(AppRoute.STAFF_LEAVES)}
            className="bg-card rounded-xl shadow-sm border border-border p-3.5 hover:shadow transition-all text-left outline-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Approved Leaves</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{stats.approvedLeaves}</p>
                <div className="flex items-center gap-1 mt-2">
                  <CheckSquare className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs font-semibold text-green-500">Processed</span>
                </div>
              </div>
              <div className="bg-rose-500 p-3 rounded-xl shadow-sm shrink-0">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Critical Alerts & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Urgent Task Alerts */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Urgent Priority Tasks</h3>
            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {highPriorityAlerts.length} Active
            </span>
          </div>
          <div className="space-y-2">
            {highPriorityAlerts.length > 0 ? (
              highPriorityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border-l-4 ${
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
                      Ref: {alert.reference}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{alert.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No critical or high priority complaints assigned right now.
              </div>
            )}
          </div>
        </div>

        {/* Assigned Task Schedule */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Task Schedule</h3>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {upcomingTasks.length} Scheduled
            </span>
          </div>
          <div className="space-y-2">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div key={task.id} className="p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-foreground text-[13px]">{task.title}</h4>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{task.taskType}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1 font-medium">{task.client}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{task.location || "On-Site"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                      <Clock className="h-3 w-3" />
                      {task.date ? new Date(task.date).toLocaleDateString() : "Scheduled"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No active complaints or visits scheduled.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assigned Complaints Chart */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Complaints Status</h3>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                key="complaint-pie"
                data={complaintChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={55}
                fill="#8884d8"
                dataKey="value"
              >
                {complaintChartData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {complaintChartData.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AMC Visits Status */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">AMC Visits Summary</h3>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={visitChartData}>
              <CartesianGrid key="amc-grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis key="amc-xaxis" dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
              <YAxis key="amc-yaxis" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} hide />
              <Tooltip />
              <Bar key="scheduled-bar" dataKey="count" fill="#db2777" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#db2777]" />
                <span className="text-xs text-muted-foreground">Total Count</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">
              {completedVisits} Completed / {scheduledVisits} Scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => navigate(AppRoute.STAFF_LEAVES)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs transition-all shadow-sm w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Request Leave
          </button>
          <button
            onClick={() => navigate(AppRoute.STAFF_TASKS)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs transition-all border border-border w-full sm:w-auto"
          >
            View My Tasks
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

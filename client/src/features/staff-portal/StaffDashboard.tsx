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
  Loader2
} from "lucide-react";

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

  return (
    <div className="space-y-4">
      {/* Welcome Header Banner */}
      <div className="bg-gradient-to-r from-pink-700 via-pink-600 to-pink-600 rounded-2xl shadow-lg p-4 text-white">
        <div>
          <h3 className="text-base font-semibold mb-1">
            {greeting()}, {profile?.fullName?.split(" ")[0]}! 👋
          </h3>
          <p className="text-pink-100 text-[10px] font-medium uppercase tracking-wider">
            Here's what's going on with your work today.
          </p>
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
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Pending Leaves</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{stats.pendingLeaves}</p>
              </div>
              <div className="bg-rose-500 p-3 rounded-xl shadow-sm shrink-0">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Quick Actions & Shortcut */}
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

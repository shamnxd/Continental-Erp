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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          {greeting()}, {profile?.fullName?.split(" ")[0]}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Here is what is going on with your work today.
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Card 1 */}
          <button
            onClick={() => navigate(AppRoute.STAFF_TASKS)}
            className="flex flex-col text-left bg-card hover:bg-muted/30 border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 outline-none group hover:-translate-y-0.5"
          >
            <div className="h-12 w-12 rounded-xl bg-pink-500/10 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400 flex items-center justify-center mb-4 transition-colors group-hover:bg-pink-500/20">
              <CheckSquare className="h-6 w-6" />
            </div>
            <span className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.totalTasks}</span>
            <span className="text-sm font-medium text-muted-foreground mt-2">Total Assigned Tasks</span>
          </button>

          {/* Card 2 */}
          <button
            onClick={() => navigate(AppRoute.STAFF_TASKS)}
            className="flex flex-col text-left bg-card hover:bg-muted/30 border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 outline-none group hover:-translate-y-0.5"
          >
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center mb-4 transition-colors group-hover:bg-amber-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <span className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.pendingComplaints}</span>
            <span className="text-sm font-medium text-muted-foreground mt-2">Pending Complaints</span>
          </button>

          {/* Card 3 */}
          <button
            onClick={() => navigate(AppRoute.STAFF_TASKS)}
            className="flex flex-col text-left bg-card hover:bg-muted/30 border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 outline-none group hover:-translate-y-0.5"
          >
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center mb-4 transition-colors group-hover:bg-blue-500/20">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.upcomingVisits}</span>
            <span className="text-sm font-medium text-muted-foreground mt-2">Upcoming AMC Visits</span>
          </button>

          {/* Card 4 */}
          <button
            onClick={() => navigate(AppRoute.STAFF_LEAVES)}
            className="flex flex-col text-left bg-card hover:bg-muted/30 border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 outline-none group hover:-translate-y-0.5"
          >
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 flex items-center justify-center mb-4 transition-colors group-hover:bg-violet-500/20">
              <CalendarDays className="h-6 w-6" />
            </div>
            <span className="text-3xl font-bold text-foreground leading-none tracking-tight">{stats.pendingLeaves}</span>
            <span className="text-sm font-medium text-muted-foreground mt-2">Pending Leaves</span>
          </button>
        </div>
      )}

      {/* Quick Actions & Shortcut */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(AppRoute.STAFF_LEAVES)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-[0.98] w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Request Leave
          </button>
          <button
            onClick={() => navigate(AppRoute.STAFF_TASKS)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm transition-all border border-border/80 w-full sm:w-auto"
          >
            View My Tasks
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

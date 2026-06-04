import { useEffect, useState } from "react";
import { staffApi } from "../../api/staffApi";
import { FilterStatChips } from "../../components/FilterStatChips";
import { 
  CheckSquare, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  AlertCircle,
  Loader2,
  FileText
} from "lucide-react";

interface Task {
  id: string;
  type: "complaint" | "amc_visit";
  title: string;
  reference: string;
  client: string;
  status: string;
  priority?: string;
  date: string;
  location: string;
  notes?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; text: string }> = {
    Pending: { bg: "bg-yellow-500/10 dark:bg-yellow-500/20", text: "text-yellow-700 dark:text-yellow-400" },
    "In Progress": { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-700 dark:text-blue-400" },
    Resolved: { bg: "bg-green-500/10 dark:bg-green-500/20", text: "text-green-700 dark:text-green-400" },
    Scheduled: { bg: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-700 dark:text-purple-400" },
    Completed: { bg: "bg-green-500/10 dark:bg-green-500/20", text: "text-green-700 dark:text-green-400" },
    Cancelled: { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-700 dark:text-red-400" },
    Assigned: { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-700 dark:text-blue-400" },
    Open: { bg: "bg-yellow-500/10 dark:bg-yellow-500/20", text: "text-yellow-700 dark:text-yellow-400" },
  };
  const style = map[status] || { bg: "bg-muted", text: "text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${style.bg} ${style.text}`}>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const map: Record<string, { bg: string; text: string }> = {
    Critical: { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-700 dark:text-red-400" },
    High: { bg: "bg-orange-500/10 dark:bg-orange-500/20", text: "text-orange-700 dark:text-orange-400" },
    Medium: { bg: "bg-yellow-500/10 dark:bg-yellow-500/20", text: "text-yellow-700 dark:text-yellow-400" },
    Low: { bg: "bg-green-500/10 dark:bg-green-500/20", text: "text-green-700 dark:text-green-400" },
  };
  const style = map[priority] || { bg: "bg-muted", text: "text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {priority}
    </span>
  );
};

type TaskTab = "complaints" | "amc_visits";

export function StaffTasks() {
  const [activeTab, setActiveTab] = useState<TaskTab>("complaints");
  const [complaints, setComplaints] = useState<Task[]>([]);
  const [amcVisits, setAmcVisits] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    staffApi.get("/staff/portal/tasks")
      .then((res: any) => {
        setComplaints(res.data?.complaints || []);
        setAmcVisits(res.data?.amcVisits || []);
      })
      .catch(() => setError("Failed to load tasks."))
      .finally(() => setLoading(false));
  }, []);

  const currentList = activeTab === "complaints" ? complaints : amcVisits;

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const filterChips = [
    { value: "complaints" as TaskTab, label: "Complaints", count: complaints.length, tone: "pink" as const },
    { value: "amc_visits" as TaskTab, label: "AMC Visits", count: amcVisits.length, tone: "primary" as const }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">My Tasks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All tasks assigned to you.</p>
        </div>
      </div>

      {/* Admin Style Pills Tabs */}
      <FilterStatChips
        options={filterChips}
        value={activeTab}
        onChange={(val) => setActiveTab(val)}
      />

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Loading tasks...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {!loading && !error && currentList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border border-border/50 rounded-xl text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <CheckSquare className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No tasks assigned</h3>
          <p className="text-sm text-muted-foreground">
            You have no {activeTab === "complaints" ? "complaints" : "AMC visits"} assigned.
          </p>
        </div>
      )}

      {!loading && !error && currentList.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {currentList.map((task) => (
            <div
              key={task.id}
              className="bg-card hover:bg-muted/20 border border-border p-3.5 rounded-xl shadow-sm hover:shadow transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground leading-snug break-words">{task.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{task.reference}</p>
                </div>
                <div className="flex gap-2 items-center flex-wrap shrink-0">
                  <StatusBadge status={task.status} />
                  {task.priority && <PriorityBadge priority={task.priority} />}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/50">
                <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                  <span className="text-sm truncate text-foreground/80 font-medium">{task.client}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                  <span className="text-sm truncate text-foreground/80 font-medium">{task.location || "—"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                  <span className="text-sm truncate text-foreground/80 font-medium">{formatDate(task.date)}</span>
                </div>
              </div>

              {task.notes && (
                <div className="bg-muted/40 border border-border/40 rounded-xl p-3 flex items-start gap-2.5">
                  <FileText className="h-4 w-4 text-muted-foreground/70 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-normal">
                    <strong className="text-foreground/80 font-semibold">Notes:</strong> {task.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

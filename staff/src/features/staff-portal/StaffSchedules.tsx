import { useEffect, useState } from "react";
import { staffApi } from "../../api/staffApi";
import { FilterStatChips } from "../../components/FilterStatChips";
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  AlertCircle,
  Loader2,
  FileText,
  X
} from "lucide-react";

interface ScheduleEvent {
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

type ScheduleFilter = "all" | "amc_visits" | "complaints";

export function StaffSchedules() {
  const [filter, setFilter] = useState<ScheduleFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  useEffect(() => {
    staffApi.get("/staff/portal/tasks")
      .then((res: any) => {
        const complaintsList = (res.data?.complaints || []).map((c: any) => ({
          ...c,
          type: "complaint" as const,
        }));
        const visitsList = (res.data?.amcVisits || []).map((v: any) => ({
          ...v,
          type: "amc_visit" as const,
        }));

        // Combine and sort chronologically by date
        const combined = [...complaintsList, ...visitsList].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setEvents(combined);
      })
      .catch(() => setError("Failed to load schedules."))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter(e => {
    if (filter === "complaints") return e.type === "complaint";
    if (filter === "amc_visits") return e.type === "amc_visit";
    return true;
  });

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { 
      weekday: "short",
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const complaintsCount = events.filter(e => e.type === "complaint").length;
  const visitsCount = events.filter(e => e.type === "amc_visit").length;

  const filterChips = [
    { value: "all" as ScheduleFilter, label: "All Schedules", count: events.length, tone: "primary" as const },
    { value: "amc_visits" as ScheduleFilter, label: "AMC Visits", count: visitsCount, tone: "pink" as const },
    { value: "complaints" as ScheduleFilter, label: "Complaints", count: complaintsCount, tone: "amber" as const }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Schedules</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Chronological list of all your assigned works.</p>
        </div>
      </div>

      {/* Filter Chips */}
      <FilterStatChips
        options={filterChips}
        value={filter}
        onChange={(val) => setFilter(val)}
      />

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Loading schedules...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {!loading && !error && filteredEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border border-border/50 rounded-xl text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <Calendar className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No schedules found</h3>
          <p className="text-sm text-muted-foreground">
            You have no events matching this filter.
          </p>
        </div>
      )}

      {!loading && !error && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="bg-card hover:bg-muted/30 border border-border p-3.5 rounded-xl shadow-sm hover:shadow transition-all space-y-3 cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      event.type === "complaint" 
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
                        : "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
                    }`}>
                      {event.type === "complaint" ? "Complaint" : "AMC Visit"}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{event.reference}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug mt-1.5">{event.title}</h3>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={event.status} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/50">
                <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                  <span className="text-sm truncate text-foreground/80 font-semibold text-pink-600 dark:text-pink-400">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                  <span className="text-sm truncate text-foreground/80 font-medium">{event.client}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                  <span className="text-sm truncate text-foreground/80 font-medium">{event.location || "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Details Dialog Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-lg p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-5 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-pink-700/10 text-pink-700 dark:bg-pink-700/25 dark:text-pink-400">
                  {selectedEvent.type === "complaint" ? "Complaint" : "AMC Visit"}
                </span>
                <h2 className="text-lg font-bold text-foreground mt-2">{selectedEvent.title}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{selectedEvent.reference}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Status</label>
                  <StatusBadge status={selectedEvent.status} />
                </div>
                {selectedEvent.priority && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Priority</label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground">
                      {selectedEvent.priority}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block">Client</label>
                    <p className="text-sm font-semibold text-foreground">{selectedEvent.client}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block">Location</label>
                    <p className="text-sm font-medium text-foreground">{selectedEvent.location || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground block">Target / Scheduled Date</label>
                    <p className="text-sm font-medium text-foreground">{formatDate(selectedEvent.date)}</p>
                  </div>
                </div>
              </div>

              {selectedEvent.notes && (
                <div className="border-t border-border pt-4">
                  <div className="bg-muted/40 border border-border/40 rounded-xl p-3.5 flex items-start gap-2.5">
                    <FileText className="h-5 w-5 text-muted-foreground/75 shrink-0 mt-0.5" />
                    <div>
                      <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Instructions / Notes</label>
                      <p className="text-xs text-muted-foreground leading-relaxed">{selectedEvent.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5 border-t border-border mt-5">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

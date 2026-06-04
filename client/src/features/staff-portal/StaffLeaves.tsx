import { useEffect, useState } from "react";
import { staffApi } from "../../api/staffApi";
import { 
  CalendarDays, 
  Plus, 
  X, 
  Calendar, 
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

interface LeaveRequest {
  id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote?: string;
  createdAt: string;
}

const LEAVE_TYPES = ["Annual", "Sick", "Emergency", "Unpaid", "Other"];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
    Pending: { bg: "bg-yellow-500/10 dark:bg-yellow-500/20", text: "text-yellow-700 dark:text-yellow-400", icon: Clock },
    Approved: { bg: "bg-green-500/10 dark:bg-green-500/20", text: "text-green-700 dark:text-green-400", icon: CheckCircle2 },
    Rejected: { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-700 dark:text-red-400", icon: XCircle },
  };
  const s = map[status] || { bg: "bg-muted", text: "text-muted-foreground", icon: Clock };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.bg} ${s.text}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
};

export function StaffLeaves() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    leaveType: "Annual",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const fetchLeaves = () => {
    setLoading(true);
    staffApi.get("/staff/portal/leaves")
      .then((res: any) => setLeaves(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaves(); }, []);

  const calcDays = () => {
    if (!form.fromDate || !form.toDate) return 0;
    const diff = (new Date(form.toDate).getTime() - new Date(form.fromDate).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.ceil(diff) + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await staffApi.post("/staff/portal/leaves", form);
      setShowModal(false);
      setForm({ leaveType: "Annual", fromDate: "", toDate: "", reason: "" });
      fetchLeaves();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Leave Requests</h2>
          <p className="text-sm text-muted-foreground mt-0.5">View and manage your leave applications.</p>
        </div>
        <button
          id="staff-request-leave-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-[0.98] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Request Leave
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm">Loading leave requests...</p>
        </div>
      )}

      {!loading && leaves.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card border border-border/50 rounded-2xl text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
            <CalendarDays className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No leave requests</h3>
          <p className="text-sm text-muted-foreground">You haven't submitted any leave requests yet.</p>
        </div>
      )}

      {!loading && leaves.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {leaves.map((leave) => (
            <div key={leave.id} className="bg-card hover:bg-muted/20 border border-border p-3.5 rounded-xl shadow-sm hover:shadow transition-all space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground leading-snug">{leave.leaveType} Leave</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Submitted {formatDate(leave.createdAt)}</p>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={leave.status} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 border-t border-border/50 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/75" />
                  <span className="text-foreground/80 font-medium">{formatDate(leave.fromDate)} – {formatDate(leave.toDate)}</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground">
                  {leave.days} day{leave.days !== 1 ? "s" : ""}
                </span>
                {leave.reason && (
                  <span className="text-muted-foreground text-xs italic">"{leave.reason}"</span>
                )}
              </div>

              {leave.adminNote && (
                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  leave.status === "Approved" 
                    ? "bg-green-500/5 border-green-500/20 text-green-800 dark:text-green-400" 
                    : "bg-red-500/5 border-red-500/20 text-red-800 dark:text-red-400"
                }`}>
                  <strong className="font-semibold">Admin Note:</strong> {leave.adminNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Request Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-lg p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-foreground">Request Leave</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 mb-4 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1.5">Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground/80 block mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={form.fromDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground/80 block mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={form.toDate}
                    min={form.fromDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              {form.fromDate && form.toDate && (
                <div className="bg-primary/10 border border-primary/10 rounded-xl p-3 text-xs text-primary font-semibold">
                  📅 Duration: {calcDays()} day{calcDays() !== 1 ? "s" : ""}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1.5">Reason (optional)</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Brief reason for leave..."
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-sm"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

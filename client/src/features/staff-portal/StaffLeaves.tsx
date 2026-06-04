import { useEffect, useState } from "react";
import { staffApi } from "../../api/staffApi";

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
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    Pending: { bg: "#fef9c3", color: "#ca8a04", dot: "#ca8a04" },
    Approved: { bg: "#dcfce7", color: "#16a34a", dot: "#16a34a" },
    Rejected: { bg: "#fee2e2", color: "#dc2626", dot: "#dc2626" },
  };
  const s = map[status] || { bg: "#f3f4f6", color: "#6b7280", dot: "#6b7280" };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "12px",
      fontWeight: 600,
      padding: "4px 12px",
      borderRadius: "20px",
      background: s.bg,
      color: s.color,
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
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
    <div style={{ padding: "28px 32px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#1f2937" }}>Leave Requests</h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#9ca3af" }}>View and manage your leave applications.</p>
        </div>
        <button
          id="staff-request-leave-btn"
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #be185d 0%, #9d174d 100%)",
            color: "white",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(190,24,93,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Request Leave
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
          <svg style={{ animation: "spin 0.8s linear infinite" }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && leaves.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: "12px" }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p style={{ fontSize: "15px", fontWeight: 500, color: "#374151", margin: "0 0 4px" }}>No leave requests</p>
          <p style={{ fontSize: "13px", margin: 0 }}>You haven't submitted any leave requests yet.</p>
        </div>
      )}

      {!loading && leaves.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {leaves.map((leave) => (
            <div key={leave.id} style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid #f3e8ee",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>{leave.leaveType} Leave</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>Submitted {formatDate(leave.createdAt)}</p>
                </div>
                <StatusBadge status={leave.status} />
              </div>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: leave.adminNote ? "8px" : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{formatDate(leave.fromDate)} – {formatDate(leave.toDate)}</span>
                </div>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "2px 10px",
                  borderRadius: "20px",
                  background: "#f3f4f6",
                  color: "#374151",
                }}>
                  {leave.days} day{leave.days !== 1 ? "s" : ""}
                </span>
                {leave.reason && (
                  <span style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic" }}>"{leave.reason}"</span>
                )}
              </div>
              {leave.adminNote && (
                <div style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: leave.status === "Approved" ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${leave.status === "Approved" ? "#bbf7d0" : "#fecaca"}`,
                  fontSize: "12px",
                  color: leave.status === "Approved" ? "#16a34a" : "#dc2626",
                }}>
                  <strong>Admin note:</strong> {leave.adminNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Request Leave Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "28px",
            width: "100%",
            maxWidth: "460px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1f2937" }}>Request Leave</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {submitError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #f3e8ee",
                    background: "#fdf4f8",
                    fontSize: "14px",
                    color: "#1f2937",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>From Date</label>
                  <input
                    type="date"
                    value={form.fromDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #f3e8ee",
                      background: "#fdf4f8",
                      fontSize: "14px",
                      color: "#1f2937",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>To Date</label>
                  <input
                    type="date"
                    value={form.toDate}
                    min={form.fromDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1px solid #f3e8ee",
                      background: "#fdf4f8",
                      fontSize: "14px",
                      color: "#1f2937",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {form.fromDate && form.toDate && (
                <div style={{ background: "#fce7f3", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#9d174d", fontWeight: 500 }}>
                  📅 Duration: {calcDays()} day{calcDays() !== 1 ? "s" : ""}
                </div>
              )}

              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Reason (optional)</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Brief reason for leave..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #f3e8ee",
                    background: "#fdf4f8",
                    fontSize: "14px",
                    color: "#1f2937",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "10px",
                    border: "1px solid #f3e8ee",
                    background: "#ffffff",
                    color: "#6b7280",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #be185d 0%, #9d174d 100%)",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                  }}
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

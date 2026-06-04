import { useEffect, useState } from "react";
import { staffApi } from "../../api/staffApi";

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
  const map: Record<string, { bg: string; color: string }> = {
    Pending: { bg: "#fef9c3", color: "#ca8a04" },
    "In Progress": { bg: "#dbeafe", color: "#2563eb" },
    Resolved: { bg: "#dcfce7", color: "#16a34a" },
    Scheduled: { bg: "#ede9fe", color: "#7c3aed" },
    Completed: { bg: "#dcfce7", color: "#16a34a" },
    Cancelled: { bg: "#fee2e2", color: "#dc2626" },
    Assigned: { bg: "#dbeafe", color: "#2563eb" },
    Open: { bg: "#fef9c3", color: "#ca8a04" },
  };
  const style = map[status] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{
      fontSize: "11px",
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: "20px",
      background: style.bg,
      color: style.color,
      whiteSpace: "nowrap",
    }}>{status}</span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const map: Record<string, { bg: string; color: string }> = {
    Critical: { bg: "#fee2e2", color: "#dc2626" },
    High: { bg: "#ffedd5", color: "#ea580c" },
    Medium: { bg: "#fef9c3", color: "#ca8a04" },
    Low: { bg: "#dcfce7", color: "#16a34a" },
  };
  const style = map[priority] || { bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{
      fontSize: "11px",
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: "20px",
      background: style.bg,
      color: style.color,
    }}>{priority}</span>
  );
};

export function StaffTasks() {
  const [activeTab, setActiveTab] = useState<"complaints" | "amc_visits">("complaints");
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

  return (
    <div style={{ padding: "28px 32px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#1f2937" }}>My Tasks</h1>
        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#9ca3af" }}>All tasks assigned to you.</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "4px",
        background: "#f3f4f6",
        borderRadius: "12px",
        padding: "4px",
        marginBottom: "20px",
        width: "fit-content",
      }}>
        {([
          { key: "complaints", label: `Complaints (${complaints.length})` },
          { key: "amc_visits", label: `AMC Visits (${amcVisits.length})` },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            id={`staff-tasks-tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === tab.key ? "#ffffff" : "transparent",
              color: activeTab === tab.key ? "#be185d" : "#6b7280",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
          <svg style={{ animation: "spin 0.8s linear infinite" }} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "16px", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {!loading && !error && currentList.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: "12px" }}>
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p style={{ fontSize: "15px", fontWeight: 500, color: "#374151", margin: "0 0 4px" }}>No tasks assigned</p>
          <p style={{ fontSize: "13px", margin: 0 }}>You have no {activeTab === "complaints" ? "complaints" : "AMC visits"} assigned.</p>
        </div>
      )}

      {!loading && !error && currentList.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {currentList.map((task) => (
            <div
              key={task.id}
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                padding: "18px 20px",
                border: "1px solid #f3e8ee",
                boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>{task.title}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>{task.reference}</p>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <StatusBadge status={task.status} />
                  {task.priority && <PriorityBadge priority={task.priority} />}
                </div>
              </div>
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{task.client}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{task.location || "—"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{formatDate(task.date)}</span>
                </div>
              </div>
              {task.notes && (
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>
                  Note: {task.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

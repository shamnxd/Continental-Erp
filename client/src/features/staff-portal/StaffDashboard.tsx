import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { staffApi } from "../../api/staffApi";
import { AppRoute } from "../../constants/routes.enum";

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

  const statCards = stats ? [
    {
      label: "Total Assigned Tasks",
      value: stats.totalTasks,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
      color: "#be185d",
      bg: "#fce7f3",
      onClick: () => navigate(AppRoute.STAFF_TASKS),
    },
    {
      label: "Pending Complaints",
      value: stats.pendingComplaints,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      ),
      color: "#f59e0b",
      bg: "#fffbeb",
      onClick: () => navigate(AppRoute.STAFF_TASKS),
    },
    {
      label: "Upcoming AMC Visits",
      value: stats.upcomingVisits,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      color: "#3b82f6",
      bg: "#eff6ff",
      onClick: () => navigate(AppRoute.STAFF_TASKS),
    },
    {
      label: "Pending Leave Requests",
      value: stats.pendingLeaves,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      color: "#8b5cf6",
      bg: "#f5f3ff",
      onClick: () => navigate(AppRoute.STAFF_LEAVES),
    },
  ] : [];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af" }}>
        <div style={{ textAlign: "center" }}>
          <svg style={{ animation: "spin 0.8s linear infinite", marginBottom: "8px" }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <p style={{ fontSize: "14px" }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#1f2937" }}>
          {greeting()}, {profile?.fullName?.split(" ")[0]}! 👋
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#9ca3af" }}>
          Here's what's going on with your work today.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
        gap: "16px",
        marginBottom: "32px",
      }}>
        {statCards.map((card, i) => (
          <button
            key={i}
            onClick={card.onClick}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid #f3e8ee",
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              cursor: "pointer",
              textAlign: "left",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)";
            }}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: card.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: card.color,
              marginBottom: "12px",
            }}>
              {card.icon}
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "28px", fontWeight: 700, color: "#1f2937" }}>{card.value}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", lineHeight: 1.4 }}>{card.label}</p>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #f3e8ee" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(AppRoute.STAFF_LEAVES)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #f3e8ee",
              background: "linear-gradient(135deg, #be185d 0%, #9d174d 100%)",
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Request Leave
          </button>
          <button
            onClick={() => navigate(AppRoute.STAFF_TASKS)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid #f3e8ee",
              background: "#ffffff",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/>
            </svg>
            View My Tasks
          </button>
        </div>
      </div>
    </div>
  );
}

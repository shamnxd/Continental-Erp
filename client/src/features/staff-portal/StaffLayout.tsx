import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router";
import { staffApi, clearStaffToken, isStaffLoggedIn } from "../../api/staffApi";
import { AppRoute } from "../../constants/routes.enum";

interface StaffProfile {
  id: string;
  fullName: string;
  staffNo: string;
  email: string;
  role: string;
  city: string;
  status: string;
}

export function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isStaffLoggedIn()) {
      navigate(AppRoute.STAFF_LOGIN, { replace: true });
      return;
    }
    staffApi.get("/staff/portal/me").then((res: any) => {
      setStaff(res.data);
    }).catch(() => {
      clearStaffToken();
      navigate(AppRoute.STAFF_LOGIN, { replace: true });
    });
  }, [navigate]);

  const handleLogout = async () => {
    try { await staffApi.post("/staff/auth/logout"); } catch {}
    clearStaffToken();
    navigate(AppRoute.STAFF_LOGIN, { replace: true });
  };

  const navLinks = [
    {
      path: AppRoute.STAFF_DASHBOARD,
      label: "Dashboard",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      path: AppRoute.STAFF_TASKS,
      label: "My Tasks",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
    },
    {
      path: AppRoute.STAFF_LEAVES,
      label: "Leave Requests",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return { bg: "#dcfce7", text: "#16a34a" };
      case "On Site": return { bg: "#dbeafe", text: "#2563eb" };
      case "On Leave": return { bg: "#fef9c3", text: "#ca8a04" };
      default: return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#fdf4f8", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{
        width: "240px",
        flexShrink: 0,
        background: "#ffffff",
        borderRight: "1px solid #f3e8ee",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
      }}>
        {/* Brand */}
        <div style={{ padding: "20px", borderBottom: "1px solid #f3e8ee" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #be185d 0%, #9d174d 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1f2937" }}>Staff Portal</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>Continental</p>
            </div>
          </div>
        </div>

        {/* Staff Info */}
        {staff && (
          <div style={{ padding: "16px", borderBottom: "1px solid #f3e8ee" }}>
            <div style={{
              background: "linear-gradient(135deg, #fdf4f8 0%, #fce7f3 100%)",
              borderRadius: "12px",
              padding: "14px",
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #be185d 0%, #9d174d 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                fontSize: "16px",
                marginBottom: "8px",
              }}>
                {staff.fullName.charAt(0).toUpperCase()}
              </div>
              <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "#1f2937" }}>{staff.fullName}</p>
              <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#9ca3af" }}>{staff.staffNo}</p>
              {(() => {
                const sc = getStatusColor(staff.status);
                return (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: sc.bg,
                    color: sc.text,
                  }}>{staff.status}</span>
                );
              })()}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#be185d" : "#6b7280",
                  background: isActive ? "#fce7f3" : "transparent",
                  transition: "all 0.15s",
                }}
              >
                {link.icon}
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "12px", borderTop: "1px solid #f3e8ee" }}>
          <button
            id="staff-logout-btn"
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              color: "#6b7280",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef2f2";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>
    </div>
  );
}

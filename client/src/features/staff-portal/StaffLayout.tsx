import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { staffApi, clearStaffToken, isStaffLoggedIn } from "../../api/staffApi";
import { AppRoute } from "../../constants/routes.enum";

interface StaffProfile {
  id: string;
  fullName: string;
  staffNo: string;
  email: string;
  role: string;
  status: string;
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navigation: NavItem[] = [
  { name: "Dashboard", href: AppRoute.STAFF_DASHBOARD, icon: LayoutDashboard },
  { name: "My Tasks", href: AppRoute.STAFF_TASKS, icon: CheckSquare },
  { name: "Leave Requests", href: AppRoute.STAFF_LEAVES, icon: CalendarDays },
];

function getPageTitle(pathname: string): string {
  const match = navigation.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`)
  );
  return match?.name ?? "Staff Portal";
}

export function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState<StaffProfile | null>(null);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await staffApi.post("/staff/auth/logout"); } catch {}
    clearStaffToken();
    navigate(AppRoute.STAFF_LOGIN, { replace: true });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-pink-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center shrink-0">
                <img
                  src="/clogo.png"
                  alt="Continental Logo"
                  className="h-full w-full object-contain"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Continental</h1>
                <p className="text-xs text-muted-foreground">Staff Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              <h3 className="px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                Staff Menu
              </h3>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive =
                    location.pathname === item.href ||
                    location.pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-pink-700 to-pink-600 text-white shadow-md shadow-pink-700/30"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          isActive
                            ? "text-white"
                            : "text-muted-foreground group-hover:text-primary"
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Logout */}
          <div className="border-t border-sidebar-border p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content — offset for fixed sidebar on desktop */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-64">
        {/* Top bar (Minimal Header) */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 lg:px-8 shadow-sm shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <h2 className="text-xl font-bold text-foreground">
              {getPageTitle(location.pathname)}
            </h2>
          </div>

          {/* User profile dropdown like admin */}
          {staff && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-border py-1.5 pr-2">
              <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-sm shrink-0">
                <img
                  src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(staff.fullName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                  alt={staff.fullName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="hidden sm:block text-left min-w-0 max-w-[140px] lg:max-w-[180px]">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {staff.fullName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{staff.email}</p>
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Bell,
  FileText,
  AlertCircle,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { staffApi } from "../../api/staffApi";
import { AppRoute } from "../../constants/routes.enum";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logOut } from "../../store/slices/staffAuthSlice";

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
  { name: "Dashboard", href: AppRoute.DASHBOARD, icon: LayoutDashboard },
  { name: "My Tasks", href: AppRoute.TASKS, icon: CheckSquare },
  { name: "My Enquiries", href: AppRoute.ENQUIRIES, icon: FileText },
  { name: "Schedules", href: AppRoute.SCHEDULES, icon: Calendar },
  { name: "Leave Requests", href: AppRoute.LEAVES, icon: CalendarDays },
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
  const dispatch = useAppDispatch();
  const { staff, loading } = useAppSelector((state) => state.staffAuth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      return saved === "dark";
    }
    return false;
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notifications = [
    { id: 1, title: "New Complaint Assigned", message: "A new complaint ENQ-2026-001 has been assigned to you.", time: "5 mins ago", type: "complaint" },
    { id: 2, title: "Leave Request Approved", message: "Your leave request for Annual Leave has been approved.", time: "2 hours ago", type: "leave" },
    { id: 3, title: "Upcoming Visit scheduled", message: "AMC Quarterly Service is scheduled for tomorrow.", time: "4 hours ago", type: "amc" },
  ];

  const searchResults = searchQuery
    ? navigation.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    if (!loading && !staff) {
      navigate(AppRoute.LOGIN, { replace: true });
    }
  }, [staff, loading, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogout = async () => {
    try { await staffApi.post("/staff/auth/logout"); } catch {}
    dispatch(logOut());
    navigate(AppRoute.LOGIN, { replace: true });
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
        {/* Top bar */}
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

          <div className="flex items-center gap-2 relative">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 hover:bg-muted rounded-xl transition-colors relative group"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              )}
            </button>

            {/* Global Search Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  setShowNotifications(false);
                }}
                className={`p-2.5 hover:bg-muted rounded-xl transition-colors relative group ${
                  showSearch ? "bg-muted text-foreground" : ""
                }`}
              >
                <Search className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              </button>

              {showSearch && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSearch(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search pages (e.g. Tasks, Leave)..."
                          className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                      {searchResults.length > 0 ? (
                        searchResults.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-xl transition-colors text-sm font-medium text-foreground"
                          >
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <item.icon className="h-4 w-4" />
                            </div>
                            {item.name}
                          </Link>
                        ))
                      ) : (
                        <p className="p-4 text-center text-xs text-muted-foreground">
                          {searchQuery ? "No pages found" : "Start typing to search pages..."}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowSearch(false);
                }}
                className={`p-2.5 hover:bg-muted rounded-xl transition-colors relative group ${
                  showNotifications ? "bg-muted text-foreground" : ""
                }`}
              >
                <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-card"></span>
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <h3 className="font-bold text-foreground">Notifications</h3>
                      <button className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 cursor-pointer group"
                        >
                          <div className="flex gap-3">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                n.type === "leave"
                                  ? "bg-blue-100 text-blue-600"
                                  : n.type === "amc"
                                  ? "bg-pink-100 text-pink-600"
                                  : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              {n.type === "leave" ? (
                                <FileText className="h-4 w-4" />
                              ) : n.type === "amc" ? (
                                <Calendar className="h-4 w-4" />
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {n.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                                {n.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile dropdown */}
            {staff && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 flex items-center gap-2.5 pl-3 border-l border-border hover:bg-muted/50 rounded-xl py-1.5 pr-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
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
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{staff.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{staff.staffNo}</p>
                  </div>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

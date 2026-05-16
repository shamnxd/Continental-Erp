import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  Calendar,
  UserCog,
  Receipt,
  BarChart3,
  Menu,
  X,
  LogOut,
  Trello,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Kanban Board", href: "/kanban", icon: Trello },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Enquiries", href: "/enquiries", icon: FileText },
  { name: "Quotations", href: "/quotations", icon: FileSpreadsheet },
  { name: "Complaints", href: "/complaints", icon: AlertCircle },
  {
    name: "AMC",
    icon: Calendar,
    submenu: [
      { name: "AMC Contracts", href: "/amc" },
      { name: "AMC Plans", href: "/amc-plans" },
    ]
  },
  { name: "Staff", href: "/staff", icon: UserCog },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [amcExpanded, setAmcExpanded] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      // Default to light mode (false) if no theme is saved, ignoring system preferences
      return saved === "dark";
    }
    return false;
  });
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-pink-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center shrink-0">
                <img src="/clogo.png" alt="Continental Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Continental</h1>
                <p className="text-xs text-muted-foreground">Management Suite</p>
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
          <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
            {navigation.map((item) => {
              if (item.submenu) {
                const isAnySubmenuActive = item.submenu.some(
                  (sub) => location.pathname === sub.href || location.pathname.startsWith(sub.href)
                );
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => setAmcExpanded(!amcExpanded)}
                      className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isAnySubmenuActive
                        ? "bg-gradient-to-r from-pink-700 to-pink-600 text-white shadow-md shadow-pink-700/30"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${isAnySubmenuActive ? "text-white" : "text-muted-foreground group-hover:text-primary"}`} />
                        {item.name}
                      </div>
                      {amcExpanded ? (
                        <ChevronDown className={`h-4 w-4 ${isAnySubmenuActive ? "text-white" : "text-muted-foreground"}`} />
                      ) : (
                        <ChevronRight className={`h-4 w-4 ${isAnySubmenuActive ? "text-white" : "text-muted-foreground"}`} />
                      )}
                    </button>
                    {amcExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map((subitem) => {
                          const isActive = location.pathname === subitem.href;
                          return (
                            <Link
                              key={subitem.name}
                              to={subitem.href}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                ? "bg-pink-700/20 text-pink-700"
                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                                }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              {subitem.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive =
                location.pathname === item.href ||
                (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? "bg-gradient-to-r from-pink-700 to-pink-600 text-white shadow-md shadow-pink-700/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 mb-3 px-2 py-2 bg-muted/30 rounded-xl">
              <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-lg shrink-0">
                <img
                  src={`https://i.pravatar.cc/150?u=dd`}
                  alt="Admin"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@continental.com</p>
              </div>
            </div>
            <button className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 lg:px-8 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {navigation.find(
                  (item) =>
                    item.href === location.pathname ||
                    (item.href && item.href !== "/" && location.pathname.startsWith(item.href))
                )?.name || "Dashboard"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Welcome back, Admin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <button className="p-2.5 hover:bg-muted rounded-xl transition-colors relative group">
              <Search className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            </button>
            <button className="p-2.5 hover:bg-muted rounded-xl transition-colors relative group">
              <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-card"></span>
            </button>
            <div className="ml-2 h-10 w-10 rounded-full overflow-hidden ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all shadow-md shrink-0">
              <img
                src={`https://i.pravatar.cc/150?u=dd`}
                alt="Admin"
                className="h-full w-full object-cover"
              />
            </div>
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

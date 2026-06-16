import { useState, useEffect } from "react";
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
  CalendarDays,
  Wrench,
  FolderKanban,
  MessageSquareWarning,
  Palmtree,
  ScrollText,
  ShieldCheck,
  Handshake,
  ShoppingBag,
} from "lucide-react";
import { AppRoute } from "../constants/routes.enum";

type NavLeaf = { name: string; href: string };
type NavSubItem = { name: string; href?: string; children?: NavLeaf[] };
type NavItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: NavSubItem[];
};
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logoutUser } from "../store/slices/authSlice";

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigation: NavSection[] = [
  {
    title: "Core & Board",
    items: [
      { name: "Dashboard", href: AppRoute.DASHBOARD, icon: LayoutDashboard },
      { name: "Kanban Board", href: AppRoute.KANBAN, icon: Trello },
    ],
  },
  {
    title: "Sales & CRM",
    items: [
      { name: "Clients", href: AppRoute.CLIENTS, icon: Users },
      { name: "Enquiries", href: AppRoute.ENQUIRIES, icon: FileText },
      { name: "Quotations", href: AppRoute.QUOTATIONS, icon: FileSpreadsheet },
    ],
  },
  {
    title: "Operations & Services",
    items: [
      { name: "Complaints", href: AppRoute.COMPLAINTS, icon: AlertCircle },
      { name: "Customer Complaints", href: AppRoute.CUSTOMER_COMPLAINTS, icon: MessageSquareWarning },
      { name: "AMC Contracts", href: AppRoute.AMC, icon: Calendar },
      { name: "Schedules", href: AppRoute.SCHEDULES, icon: CalendarDays },
      { name: "Minor Jobs", href: AppRoute.MINOR_JOBS, icon: Wrench },
      { name: "Projects", href: AppRoute.PROJECTS, icon: FolderKanban },
      { name: "Subcontracts", href: AppRoute.SUBCONTRACTS, icon: Handshake },
      { name: "Purchase Orders", href: AppRoute.PURCHASE_ORDERS, icon: ShoppingBag },
      { name: "Warranty Management", href: AppRoute.WARRANTY_MANAGEMENT, icon: ShieldCheck },
    ],
  },
  {
    title: "Finance & Analytics",
    items: [
      {
        name: "Finance",
        icon: Receipt,
        submenu: [
          { name: "Overview", href: AppRoute.FINANCE },
          {
            name: "Receivables",
            children: [
              { name: "Customer Invoices", href: AppRoute.FINANCE_RECEIVABLES_INVOICES },
              { name: "Customer Payments", href: AppRoute.FINANCE_RECEIVABLES_PAYMENTS },
              { name: "Outstanding Receivables", href: AppRoute.FINANCE_RECEIVABLES_OUTSTANDING },
            ],
          },
          {
            name: "Payables",
            children: [
              { name: "Vendor Bills", href: AppRoute.FINANCE_PAYABLES_BILLS },
              { name: "Vendor Payments", href: AppRoute.FINANCE_PAYABLES_PAYMENTS },
              { name: "Outstanding Payables", href: AppRoute.FINANCE_PAYABLES_OUTSTANDING },
            ],
          },
          {
            name: "Expenses",
            children: [
              { name: "Direct Expenses", href: AppRoute.FINANCE_EXPENSES_DIRECT },
              { name: "Travel", href: AppRoute.FINANCE_EXPENSES_TRAVEL },
              { name: "Fuel", href: AppRoute.FINANCE_EXPENSES_FUEL },
              { name: "Misc Expenses", href: AppRoute.FINANCE_EXPENSES_MISC },
            ],
          },
          { name: "Cash & Ledger", href: AppRoute.FINANCE_LEDGER },
        ],
      },
      { name: "Reports", href: AppRoute.REPORTS, icon: BarChart3 },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Staff", href: AppRoute.STAFF, icon: UserCog },
      { name: "Leave Management", href: AppRoute.LEAVE_MANAGEMENT, icon: Palmtree },
      { name: "Audit Logs", href: AppRoute.AUDIT_LOGS, icon: ScrollText },
      { name: "Admin Management", href: AppRoute.ADMIN_MANAGEMENT, icon: ShieldCheck },
    ],
  },
];

function isFinancePath(pathname: string) {
  return pathname === AppRoute.FINANCE || pathname.startsWith(`${AppRoute.FINANCE}/`);
}

function isSubNavActive(pathname: string, href: string) {
  if (href === AppRoute.FINANCE) return pathname === AppRoute.FINANCE;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function financeLeafActive(pathname: string, submenu: NavSubItem[]): NavLeaf | undefined {
  for (const sub of submenu) {
    if (sub.href && isSubNavActive(pathname, sub.href)) return { name: sub.name, href: sub.href };
    if (sub.children) {
      const leaf = sub.children.find((c) => isSubNavActive(pathname, c.href));
      if (leaf) return leaf;
    }
  }
  return undefined;
}

function getPageTitle(pathname: string): string {
  if (pathname === AppRoute.FINANCE_INVOICE_CREATE || pathname.endsWith("/receivables/invoices/new")) return "Create invoice";
  if (pathname === AppRoute.FINANCE_VENDOR_BILL_CREATE || pathname.endsWith("/payables/bills/new")) return "New vendor bill";

  for (const section of navigation) {
    for (const item of section.items) {
      if (item.submenu) {
        const leaf = financeLeafActive(pathname, item.submenu);
        if (leaf) return leaf.name;
        if (isFinancePath(pathname)) return "Finance";
      } else if (item.href) {
        if (pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`))) {
          return item.name;
        }
      }
    }
  }
  if (pathname === AppRoute.DASHBOARD) return "Dashboard";
  return "Dashboard";
}

export function RootLayout() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Finance: false,
    Receivables: false,
    Payables: false,
    Expenses: false,
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      // Default to light mode (false) if no theme is saved, ignoring system preferences
      return saved === "dark";
    }
    return false;
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const notifications = [
    { id: 1, title: "New Enquiry", message: "New enquiry from ABC Corporation", time: "2 mins ago", type: "enquiry" },
    { id: 2, title: "AMC Due", message: "AMC visit for XYZ Industries is due tomorrow", time: "1 hour ago", type: "amc" },
    { id: 3, title: "Complaint Assigned", message: "You have been assigned a new complaint", time: "3 hours ago", type: "complaint" },
  ];

  const permissions = user?.permissions || {
    crm: true,
    operations: true,
    finance: true,
    administration: true
  };

  const filteredNavigation = navigation.filter((section) => {
    if (section.title === "Sales & CRM") return permissions.crm;
    if (section.title === "Operations & Services") return permissions.operations;
    if (section.title === "Finance & Analytics") return permissions.finance;
    if (section.title === "Administration") return permissions.administration;
    return true;
  });

  const searchResults = searchQuery 
    ? navigation.flatMap(section => {
        if (section.title === "Sales & CRM" && !permissions.crm) return [];
        if (section.title === "Operations & Services" && !permissions.operations) return [];
        if (section.title === "Finance & Analytics" && !permissions.finance) return [];
        if (section.title === "Administration" && !permissions.administration) return [];

        return section.items.flatMap(item => 
          item.submenu 
            ? item.submenu.filter(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : item.name.toLowerCase().includes(searchQuery.toLowerCase()) ? [item] : []
        );
      })
    : [];

  useEffect(() => {
    if (!isFinancePath(location.pathname)) return;
    setExpandedMenus((prev) => ({
      ...prev,
      Finance: true,
      Receivables: location.pathname.includes("/receivables") ? true : prev.Receivables,
      Payables: location.pathname.includes("/payables") ? true : prev.Payables,
      Expenses: location.pathname.includes("/expenses") ? true : prev.Expenses,
    }));
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
          <nav className="flex-1 space-y-6 px-4 py-6 overflow-y-auto">
            {filteredNavigation.map((section) => (
              <div key={section.title} className="space-y-2">
                <h3 className="px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    if (item.submenu) {
                      const isAnySubmenuActive = item.submenu.some(
                        (sub) =>
                          (sub.href && isSubNavActive(location.pathname, sub.href)) ||
                          sub.children?.some((c) => isSubNavActive(location.pathname, c.href)),
                      );
                      const isExpanded = expandedMenus[item.name] ?? false;
                      return (
                        <div key={item.name}>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMenus((prev) => ({ ...prev, [item.name]: !prev[item.name] }))
                            }
                            className={`group flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isAnySubmenuActive
                              ? "bg-gradient-to-r from-pink-700 to-pink-600 text-white shadow-md shadow-pink-700/30"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={`h-5 w-5 ${isAnySubmenuActive ? "text-white" : "text-muted-foreground group-hover:text-primary"}`} />
                              {item.name}
                            </div>
                            {isExpanded ? (
                              <ChevronDown className={`h-4 w-4 ${isAnySubmenuActive ? "text-white" : "text-muted-foreground"}`} />
                            ) : (
                              <ChevronRight className={`h-4 w-4 ${isAnySubmenuActive ? "text-white" : "text-muted-foreground"}`} />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="ml-4 mt-1 space-y-1">
                              {item.submenu.map((subitem) => {
                                if (subitem.children) {
                                  const groupActive = subitem.children.some((c) =>
                                    isSubNavActive(location.pathname, c.href),
                                  );
                                  const groupExpanded = expandedMenus[subitem.name] ?? groupActive;
                                  return (
                                    <div key={subitem.name}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedMenus((prev) => ({
                                            ...prev,
                                            [subitem.name]: !prev[subitem.name],
                                          }))
                                        }
                                        className={`flex items-center justify-between w-full px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                          groupActive
                                            ? "text-pink-700 dark:text-pink-400"
                                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                                        }`}
                                      >
                                        {subitem.name}
                                        {groupExpanded ? (
                                          <ChevronDown className="h-3.5 w-3.5" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                      {groupExpanded && (
                                        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                                          {subitem.children.map((child) => {
                                            const isActive = isSubNavActive(location.pathname, child.href);
                                            return (
                                              <Link
                                                key={child.href}
                                                to={child.href}
                                                className={`block px-3 py-2 rounded-md text-xs font-medium transition-all ${
                                                  isActive
                                                    ? "bg-pink-700/20 text-pink-700 dark:text-pink-400"
                                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                                                }`}
                                                onClick={() => setSidebarOpen(false)}
                                              >
                                                {child.name}
                                              </Link>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                if (!subitem.href) return null;
                                const isActive = isSubNavActive(location.pathname, subitem.href);
                                return (
                                  <Link
                                    key={subitem.name}
                                    to={subitem.href}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                      isActive
                                        ? "bg-pink-700/20 text-pink-700 dark:text-pink-400"
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

                    if (!item.href) return null;

                    const isActive =
                      location.pathname === item.href ||
                      (item.href !== "/" && location.pathname.startsWith(`${item.href}/`));
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
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <button
              onClick={() => dispatch(logoutUser())}
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
                {getPageTitle(location.pathname)}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
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
                className={`p-2.5 hover:bg-muted rounded-xl transition-colors relative group ${showSearch ? 'bg-muted text-foreground' : ''}`}
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
                          placeholder="Search pages (e.g. AMC, Clients)..."
                          className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                      {searchResults.length > 0 ? (
                        searchResults.map((item: any) => (
                          <Link
                            key={item.href || item.name}
                            to={item.href}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-xl transition-colors text-sm font-medium text-foreground"
                          >
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {item.icon ? <item.icon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
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
                className={`p-2.5 hover:bg-muted rounded-xl transition-colors relative group ${showNotifications ? 'bg-muted text-foreground' : ''}`}
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
                      <button className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">Mark all as read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 cursor-pointer group">
                          <div className="flex gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                              n.type === 'enquiry' ? 'bg-blue-100 text-blue-600' : 
                              n.type === 'amc' ? 'bg-pink-100 text-pink-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {n.type === 'enquiry' ? <FileText className="h-4 w-4" /> : 
                               n.type === 'amc' ? <Calendar className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-muted/30 text-center">
                      <button className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">View all notifications</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Admin profile */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 flex items-center gap-2.5 pl-3 border-l border-border hover:bg-muted/50 rounded-xl py-1.5 pr-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-sm shrink-0">
                      <img
                        src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || user.email)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="hidden sm:block text-left min-w-0 max-w-[140px] lg:max-w-[180px]">
                      <p className="text-sm font-semibold text-foreground truncate leading-tight">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      dispatch(logoutUser());
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

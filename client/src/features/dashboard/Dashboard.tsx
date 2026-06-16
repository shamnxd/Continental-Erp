import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getWarrantiesApi } from "../../api/warranty.api";
import {
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const stats = [
  {
    name: "Total Enquiries",
    value: "145",
    change: "+12%",
    icon: FileText,
    color: "bg-pink-700",
  },
  {
    name: "Active AMC",
    value: "68",
    change: "+5%",
    icon: Calendar,
    color: "bg-pink-600",
  },
  {
    name: "Pending Complaints",
    value: "23",
    change: "-8%",
    icon: AlertCircle,
    color: "bg-rose-500",
  },
  {
    name: "Revenue (This Month)",
    value: "₹12.5L",
    change: "+18%",
    icon: DollarSign,
    color: "bg-pink-700",
  },
  {
    name: "Pending Quotations",
    value: "34",
    change: "+3%",
    icon: Clock,
    color: "bg-amber-500",
  },
  {
    name: "Active Clients",
    value: "89",
    change: "+7%",
    icon: Users,
    color: "bg-pink-600",
  },
  {
    name: "Pending Invoices",
    value: "17",
    change: "-12%",
    icon: DollarSign,
    color: "bg-amber-500",
  },
  {
    name: "Completed Works",
    value: "52",
    change: "+22%",
    icon: CheckCircle,
    color: "bg-pink-700",
  },
];

const revenueData = [
  { month: "Jan", revenue: 850000, expenses: 520000 },
  { month: "Feb", revenue: 920000, expenses: 580000 },
  { month: "Mar", revenue: 1050000, expenses: 620000 },
  { month: "Apr", revenue: 1180000, expenses: 680000 },
  { month: "May", revenue: 1250000, expenses: 720000 },
];

const complaintStatusData = [
  { name: "Resolved", value: 145, color: "#be185d" },
  { name: "In Progress", value: 23, color: "#9f1239" },
  { name: "Pending", value: 12, color: "#f59e0b" },
];

const amcVisitsData = [
  { month: "Jan", scheduled: 15, completed: 14 },
  { month: "Feb", scheduled: 18, completed: 16 },
  { month: "Mar", scheduled: 22, completed: 20 },
  { month: "Apr", scheduled: 25, completed: 22 },
  { month: "May", scheduled: 20, completed: 5 },
];

const recentActivities = [
  {
    id: 1,
    type: "enquiry",
    title: "New Enquiry from ABC Corp",
    time: "2 mins ago",
    status: "New",
  },
  {
    id: 2,
    type: "quotation",
    title: "Quotation Sent - DEF Solutions",
    time: "45 mins ago",
    status: "Sent",
  },
  {
    id: 3,
    type: "complaint",
    title: "New Complaint - GHI Industries",
    time: "2 hours ago",
    status: "Urgent",
  },
  {
    id: 4,
    type: "amc",
    title: "AMC Visit Scheduled - JKL Ltd",
    time: "4 hours ago",
    status: "Scheduled",
  },
  {
    id: 5,
    type: "invoice",
    title: "Invoice Generated - MNO Systems",
    time: "6 hours ago",
    status: "Paid",
  },
];

const criticalAlerts = [
  {
    id: 1,
    type: "critical",
    title: "Generator Failure - High Priority",
    client: "Global Tech Hub",
    assignee: "Amit Sharma",
    time: "10 mins ago",
    priority: "Critical",
  },
  {
    id: 2,
    type: "urgent",
    title: "AMC Visit Overdue",
    client: "ABC Corporation",
    assignee: "Rajesh Kumar",
    time: "5 hours ago",
    priority: "High",
  },
  {
    id: 3,
    type: "warning",
    title: "Payment Overdue - ₹1.5L",
    client: "DEF Solutions",
    assignee: "Finance Team",
    time: "1 day ago",
    priority: "High",
  },
];

const upcomingTasks = [
  {
    id: 1,
    task: "Site Visit - New Enquiry",
    client: "MNO Enterprises",
    date: "Today, 2:00 PM",
    assignee: "Priya Patel",
  },
  {
    id: 2,
    task: "AMC Quarterly Service",
    client: "PQR Industries",
    date: "Tomorrow, 10:00 AM",
    assignee: "Vikram Singh",
  },
  {
    id: 3,
    task: "Quotation Follow-up",
    client: "STU Solutions",
    date: "May 19, 3:00 PM",
    assignee: "Rajesh Kumar",
  },
  {
    id: 4,
    task: "Generator Installation",
    client: "VWX Corp",
    date: "May 20, 9:00 AM",
    assignee: "Amit Sharma",
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const soonRes = await getWarrantiesApi({ status: "Expiring Soon", limit: 3 });
        const expRes = await getWarrantiesApi({ status: "Expired", limit: 3 });
        
        const list: any[] = [];
        
        const staticAlerts = [
          {
            id: 1,
            type: "critical",
            title: "Generator Failure - High Priority",
            client: "Global Tech Hub",
            assignee: "Amit Sharma",
            time: "10 mins ago",
            priority: "Critical",
          },
          {
            id: 2,
            type: "urgent",
            title: "AMC Visit Overdue",
            client: "ABC Corporation",
            assignee: "Rajesh Kumar",
            time: "5 hours ago",
            priority: "High",
          },
          {
            id: 3,
            type: "warning",
            title: "Payment Overdue - ₹1.5L",
            client: "DEF Solutions",
            assignee: "Finance Team",
            time: "1 day ago",
            priority: "High",
          },
        ];

        if (soonRes.success) {
          soonRes.data.forEach((w: any) => {
            const clientName = typeof w.clientRef === "object" ? w.clientRef.companyName : "Client";
            list.push({
              id: `warr_soon_${w.id}`,
              type: "urgent",
              title: `Warranty Expiring Soon: ${w.product}`,
              client: `${clientName} (No: ${w.warrantyNo})`,
              assignee: "Account Manager",
              time: `Expires: ${new Date(w.endDate).toLocaleDateString()}`,
              priority: "High",
              link: `/warranty-management/${w.id}`
            });
          });
        }
        
        if (expRes.success) {
          expRes.data.forEach((w: any) => {
            const clientName = typeof w.clientRef === "object" ? w.clientRef.companyName : "Client";
            list.push({
              id: `warr_exp_${w.id}`,
              type: "critical",
              title: `Warranty Expired: ${w.product}`,
              client: `${clientName} (No: ${w.warrantyNo})`,
              assignee: "Account Manager",
              time: `Expired on ${new Date(w.endDate).toLocaleDateString()}`,
              priority: "Critical",
              link: `/warranty-management/${w.id}`
            });
          });
        }
        
        setAlerts([...list, ...staticAlerts]);
      } catch (err) {
        console.error("Failed to load dynamic alerts", err);
      }
    }
    loadAlerts();
  }, []);
  return (
    <div className="space-y-4">
      {/* Quick Overview Banner */}
      <div className="bg-gradient-to-r from-pink-700 via-pink-600 to-pink-600 rounded-2xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold mb-1">Today's Overview</h3>
            <p className="text-pink-100 text-[10px] font-medium uppercase tracking-wider">Saturday, May 16, 2026</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">23</p>
              <p className="text-pink-100 text-[10px] font-medium uppercase mt-0.5">Active Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">3</p>
              <p className="text-pink-100 text-[10px] font-medium uppercase mt-0.5">Alerts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">₹4.2L</p>
              <p className="text-pink-100 text-[10px] font-medium uppercase mt-0.5">Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-card rounded-xl shadow-sm border border-border p-3.5 hover:shadow transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">{stat.name}</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">{stat.change}</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-xl shadow-sm shrink-0`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Critical Alerts & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Critical Alerts */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Critical Alerts</h3>
            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {alerts.length} Active
            </span>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => alert.link && navigate(alert.link)}
                className={`p-3 rounded-xl border-l-4 transition-colors ${
                  alert.link ? "cursor-pointer hover:bg-muted/30" : ""
                } ${
                  alert.priority === "Critical"
                    ? "bg-red-500/10 border-red-500"
                    : "bg-orange-500/10 border-orange-500"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-bold text-foreground text-[13px]">{alert.title}</h4>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${
                      alert.priority === "Critical"
                        ? "bg-red-500/20 text-red-500"
                        : "bg-orange-500/20 text-orange-500"
                    }`}
                  >
                    {alert.priority}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-1 font-medium">{alert.client}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Assigned: {alert.assignee}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Upcoming Tasks</h3>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {upcomingTasks.length} Tasks
            </span>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-bold text-foreground text-[13px]">{task.task}</h4>
                  <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground mb-1 font-medium">{task.client}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-full overflow-hidden shrink-0 border border-primary/20 shadow-sm">
                      <img 
                        src={`https://i.pravatar.cc/150?u=${encodeURIComponent(task.assignee)}`} 
                        alt={task.assignee} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{task.assignee}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {task.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue vs Expenses - Compact */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Revenue</h3>
            <DollarSign className="h-4 w-4 text-pink-600" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={revenueData}>
              <CartesianGrid key="revenue-grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis key="revenue-xaxis" dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
              <YAxis key="revenue-yaxis" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} hide />
              <Tooltip
                key="revenue-tooltip"
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                  color: "var(--foreground)"
                }}
                itemStyle={{ color: "var(--foreground)" }}
              />
              <Line key="revenue-line" type="monotone" dataKey="revenue" stroke="#be185d" strokeWidth={2} dot={{ fill: "#be185d", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-pink-700">₹{(revenueData[revenueData.length - 1].revenue / 100000).toFixed(1)}L</span>
            <span className="text-xs text-green-600 font-medium">+18%</span>
          </div>
        </div>

        {/* Complaints - Compact */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Complaints</h3>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                key="complaint-pie"
                data={complaintStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={50}
                fill="#8884d8"
                dataKey="value"
              >
                {complaintStatusData.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                key="complaint-tooltip"
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {complaintStatusData.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name.split(' ')[0]}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AMC Visits - Compact */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">AMC Visits</h3>
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={amcVisitsData}>
              <CartesianGrid key="amc-grid" strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis key="amc-xaxis" dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
              <YAxis key="amc-yaxis" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} hide />
              <Tooltip
                key="amc-tooltip"
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px",
                }}
              />
              <Bar key="scheduled-bar" dataKey="scheduled" fill="#db2777" radius={[4, 4, 0, 0]} />
              <Bar key="completed-bar" dataKey="completed" fill="#9f1239" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#db2777]" />
                <span className="text-xs text-muted-foreground">Scheduled</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#9f1239]" />
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">{amcVisitsData[amcVisitsData.length - 1].completed}/{amcVisitsData[amcVisitsData.length - 1].scheduled}</span>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">
            Recent Activities
          </h3>
        </div>
        <div className="divide-y divide-border">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-border shadow-sm">
                <img 
                  src={
                    activity.type === 'enquiry' || activity.type === 'complaint'
                      ? `https://i.pravatar.cc/150?u=${activity.id}`
                      : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(activity.title.split(' - ')[1] || activity.title)}&backgroundColor=be185d&fontSize=40&fontWeight=700`
                  } 
                  alt="" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 font-medium">
                  {activity.type}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

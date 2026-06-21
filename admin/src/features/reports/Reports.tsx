import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Building,
  Layers,
  AlertCircle,
  MapPin,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
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
import {
  getParentCompaniesSummaryApi,
  getParentCompanyReportApi,
  ParentCompanySummary,
} from "../../api/client.api";

const COLORS = ["#be185d", "#4f46e5", "#10b981", "#f59e0b", "#ef4444"];

const monthlyRevenueData = [
  { month: "Jan", revenue: 850000, target: 900000 },
  { month: "Feb", revenue: 920000, target: 900000 },
  { month: "Mar", revenue: 1050000, target: 1000000 },
  { month: "Apr", revenue: 1180000, target: 1100000 },
  { month: "May", revenue: 1250000, target: 1200000 },
];

const complaintTrendData = [
  { month: "Jan", registered: 35, resolved: 32 },
  { month: "Feb", registered: 28, resolved: 30 },
  { month: "Mar", registered: 42, resolved: 38 },
  { month: "Apr", registered: 38, resolved: 40 },
  { month: "May", registered: 31, resolved: 29 },
];

const amcRevenueData = [
  { client: "ABC Corp", revenue: 120000 },
  { client: "XYZ Ind", revenue: 240000 },
  { client: "DEF Sol", revenue: 150000 },
  { client: "GHI Ent", revenue: 80000 },
  { client: "JKL Ltd", revenue: 180000 },
];

const revenueByCategoryData = [
  { name: "AMC Contracts", value: 3450000 },
  { name: "Repair Jobs", value: 1250000 },
  { name: "Projects", value: 2500000 },
];

const complaintsByCategoryData = [
  { name: "Electrical", count: 45 },
  { name: "HVAC/AC", count: 30 },
  { name: "Mechanical", count: 25 },
  { name: "Plumbing", count: 18 },
];

const amcStatusBreakdownData = [
  { name: "Active", count: 68, color: "#10b981" },
  { name: "Due for Renewal", count: 12, color: "#f59e0b" },
  { name: "Expired", count: 8, color: "#ef4444" },
];

const recentReports = [
  {
    id: 1,
    name: "Monthly Revenue Report - May 2026",
    type: "Revenue",
    date: "2026-05-16",
    status: "Generated",
  },
  {
    id: 2,
    name: "AMC Contract Summary - Q1 2026",
    type: "AMC",
    date: "2026-04-01",
    status: "Generated",
  },
  {
    id: 3,
    name: "Complaint Resolution Report - Apr 2026",
    type: "Complaints",
    date: "2026-05-01",
    status: "Generated",
  },
  {
    id: 4,
    name: "Invoice Status Report - May 2026",
    type: "Invoices",
    date: "2026-05-15",
    status: "Generated",
  },
];

export function Reports() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState("may");
  const [selectedReportType, setSelectedReportType] = useState("revenue");
  
  // Corporate Reports tab state
  const [activeTab, setActiveTab] = useState("revenue");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companiesSummary, setCompaniesSummary] = useState<ParentCompanySummary[]>([]);
  const [companyReport, setCompanyReport] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "corporate") {
      fetchCompaniesSummary();
    }
  }, [activeTab]);

  const fetchCompaniesSummary = async () => {
    setLoadingSummary(true);
    setError(null);
    try {
      const res = await getParentCompaniesSummaryApi();
      if (res.success) {
        setCompaniesSummary(res.data);
      } else {
        setError("Failed to fetch corporate companies summary.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while loading corporate reports.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSelectCompany = async (companyName: string) => {
    setSelectedCompany(companyName);
    setLoadingReport(true);
    setError(null);
    try {
      const res = await getParentCompanyReportApi(companyName);
      if (res.success) {
        setCompanyReport(res.data);
      } else {
        setError(`Failed to fetch report for ${companyName}`);
      }
    } catch (err) {
      console.error(err);
      setError(`An error occurred while loading report for ${companyName}`);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setCompanyReport(null);
    setError(null);
    fetchCompaniesSummary();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Generate business reports and insights</p>
        </div>
      </div>

      {/* Quick Stats Grid - Matched with Dashboard Layout & Sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-card rounded-xl border border-border p-3.5 hover:shadow transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground leading-tight">₹52.5L</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-pink-700 animate-pulse" />
                <span className="text-xs font-semibold text-pink-700">This Year</span>
              </div>
            </div>
            <div className="p-3 bg-pink-100 dark:bg-pink-950/30 rounded-xl shrink-0 text-pink-700 dark:text-pink-300">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-card rounded-xl border border-border p-3.5 hover:shadow transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Active Clients</p>
              <p className="text-2xl font-bold text-foreground leading-tight">89</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-600">+7% this month</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/30 rounded-xl shrink-0 text-indigo-700 dark:text-indigo-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-card rounded-xl border border-border p-3.5 hover:shadow transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Active AMC</p>
              <p className="text-2xl font-bold text-foreground leading-tight">68</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-semibold text-emerald-600">Contract Value: ₹77L</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl shrink-0 text-emerald-700 dark:text-emerald-300">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-card rounded-xl border border-border p-3.5 hover:shadow transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Growth Rate</p>
              <p className="text-2xl font-bold text-foreground leading-tight">+18%</p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs font-semibold text-fuchsia-600">Month over Month</span>
              </div>
            </div>
            <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-950/30 rounded-xl shrink-0 text-fuchsia-700 dark:text-fuchsia-300">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Generator */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow transition-shadow">
        <h3 className="text-base font-bold text-foreground mb-4">Generate Business Report</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 min-w-[200px]">
            <Select value={selectedReportType} onValueChange={setSelectedReportType}>
              <SelectTrigger className="w-full bg-background/50 border-border">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue Report</SelectItem>
                <SelectItem value="amc">AMC Summary</SelectItem>
                <SelectItem value="complaints">Complaint Report</SelectItem>
                <SelectItem value="invoices">Invoice Status</SelectItem>
                <SelectItem value="expenses">Expense Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full bg-background/50 border-border">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="may">May 2026</SelectItem>
                <SelectItem value="apr">April 2026</SelectItem>
                <SelectItem value="mar">March 2026</SelectItem>
                <SelectItem value="q1">Q1 2026</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-pink-700 hover:bg-pink-800 text-white rounded-xl shadow-sm font-semibold transition-all">
              <FileText className="h-4 w-4" />
              Generate PDF
            </Button>

            <Button variant="outline" className="flex-1 sm:flex-none flex items-center justify-center gap-2 border-border rounded-xl font-semibold bg-background hover:bg-muted text-foreground transition-all">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-2 md:grid-cols-4 p-1 bg-muted rounded-xl">
          <TabsTrigger value="revenue" className="rounded-lg text-xs font-semibold py-2">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="complaints" className="rounded-lg text-xs font-semibold py-2">Complaint Trends</TabsTrigger>
          <TabsTrigger value="amc" className="rounded-lg text-xs font-semibold py-2">AMC Performance</TabsTrigger>
          <TabsTrigger value="corporate" className="rounded-lg text-xs font-semibold py-2">Corporate Reports</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics Tab Content */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          {/* Revenue specific KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Average Monthly</p>
              <p className="text-xl font-bold text-foreground mt-1">₹10.5L</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Target Achieved</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">94.2%</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Outstanding Invoices</p>
              <p className="text-xl font-bold text-amber-600 mt-1">₹4.8L</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">YoY Growth</p>
              <p className="text-xl font-bold text-pink-700 mt-1">+24.8%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-6">
                Monthly Revenue vs Target
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Amount"]} />
                    <Legend />
                    <Line
                      key="revenue-line"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#be185d"
                      strokeWidth={3}
                      name="Actual Revenue"
                      dot={{ fill: "#be185d", r: 5 }}
                    />
                    <Line
                      key="target-line"
                      type="monotone"
                      dataKey="target"
                      stroke="#9f1239"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                      dot={{ fill: "#9f1239", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-6">
                Revenue Share by Category (Advanced)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {revenueByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Complaint Trends Tab Content */}
        <TabsContent value="complaints" className="mt-6 space-y-6">
          {/* Complaints specific KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Avg Resolution Time</p>
              <p className="text-xl font-bold text-foreground mt-1">1.8 Days</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">First Response Rate</p>
              <p className="text-xl font-bold text-indigo-600 mt-1">92.4%</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Customer Satisfaction</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">4.8 / 5.0</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Reopened Complaints</p>
              <p className="text-xl font-bold text-rose-600 mt-1">2.3%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-6">
                Complaint Registration vs Resolution Trends
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complaintTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar key="registered-bar" dataKey="registered" fill="#f59e0b" name="Registered" radius={[6, 6, 0, 0]} maxBarSize={30} />
                    <Bar key="resolved-bar" dataKey="resolved" fill="#be185d" name="Resolved" radius={[6, 6, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-6">
                Complaints Share by Category (Advanced)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complaintsByCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      dataKey="count"
                    >
                      {complaintsByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Complaints"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* AMC Performance Tab Content */}
        <TabsContent value="amc" className="mt-6 space-y-6">
          {/* AMC specific KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Renewal Rate</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">94.8%</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Contracts</p>
              <p className="text-xl font-bold text-foreground mt-1">68 Contracts</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Avg Contract Value</p>
              <p className="text-xl font-bold text-indigo-600 mt-1">₹1.13L</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Expiring in 30 Days</p>
              <p className="text-xl font-bold text-rose-600 mt-1">5 Contracts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-6">
                AMC Revenue by Client (Top 5)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={amcRevenueData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" stroke="#6b7280" fontSize={11} />
                    <YAxis dataKey="client" type="category" width={90} stroke="#6b7280" fontSize={11} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                    <Legend />
                    <Bar key="amc-revenue-bar" dataKey="revenue" fill="#be185d" name="AMC Revenue" radius={[0, 6, 6, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-sm font-bold text-foreground mb-6">
                AMC Contract Status Breakdown (Advanced)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={amcStatusBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {amcStatusBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Contracts"]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Corporate aggregation report */}
        <TabsContent value="corporate" className="mt-6 space-y-6">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 text-rose-700 dark:text-rose-300 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Error Loading Corporate Data</p>
                <p className="text-xs opacity-90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {selectedCompany ? (
            /* Corporate Detailed Report */
            loadingReport ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-pink-700" />
                <span className="text-sm font-semibold">Consolidating parent company reports...</span>
              </div>
            ) : companyReport ? (
              <div className="space-y-6">
                {/* Header card with back button */}
                <div className="bg-card rounded-xl shadow-sm border border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleBackToCompanies}
                      className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-all"
                      title="Back to Corporate Groups"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200/40">
                          Corporate Group
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mt-1">
                        {selectedCompany} Report
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Consolidated data across {companyReport.overview.totalBranches} branches
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-2 border-border" onClick={() => window.print()}>
                      <Download className="h-4 w-4" />
                      Print Summary
                    </Button>
                  </div>
                </div>

                {/* Consolidated KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* KPI 1 */}
                  <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm hover:shadow transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Branches</span>
                        <p className="text-2xl font-bold text-foreground mt-1">{companyReport.overview.totalBranches}</p>
                      </div>
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-700 dark:text-indigo-300">
                        <Building className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm hover:shadow transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Combined Projects</span>
                        <p className="text-2xl font-bold text-foreground mt-1">{companyReport.overview.totalProjects}</p>
                      </div>
                      <div className="p-2 bg-violet-50 dark:bg-violet-950/30 rounded-lg text-violet-700 dark:text-violet-300">
                        <Layers className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm hover:shadow transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active AMCs</span>
                        <p className="text-2xl font-bold text-foreground mt-1">{companyReport.overview.totalActiveAmc}</p>
                      </div>
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-700 dark:text-emerald-300">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* KPI 4 */}
                  <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm hover:shadow transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Open Complaints</span>
                        <p className="text-2xl font-bold text-foreground mt-1">{companyReport.overview.totalPendingComplaints}</p>
                      </div>
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-rose-700 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* KPI 5 */}
                  <div className="bg-card rounded-xl border border-border p-4.5 shadow-sm hover:shadow transition-shadow col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
                        <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(companyReport.overview.totalRevenue)}</p>
                      </div>
                      <div className="p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg text-pink-700 dark:text-pink-300">
                        <DollarSign className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <div className="bg-card rounded-xl shadow-sm border border-border p-5">
                    <h4 className="text-sm font-bold text-foreground mb-4">Consolidated Revenue by Branch</h4>
                    <div className="h-72">
                      {companyReport.branches.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={companyReport.branches}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="companyName" tickFormatter={(v) => v.replace(selectedCompany, "").trim() || v} stroke="#6b7280" fontSize={11} />
                            <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + "L" : v}`} />
                            <Tooltip formatter={(value: any) => [formatCurrency(value), "Approved Revenue"]} />
                            <Bar key="branch-revenue" dataKey="revenue" fill="#be185d" radius={[6, 6, 0, 0]} maxBarSize={50} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No branch data available</div>
                      )}
                    </div>
                  </div>

                  {/* Complaints/Enquiries Chart */}
                  <div className="bg-card rounded-xl shadow-sm border border-border p-5">
                    <h4 className="text-sm font-bold text-foreground mb-4">Complaints & Enquiries by Branch</h4>
                    <div className="h-72">
                      {companyReport.branches.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={companyReport.branches}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis dataKey="companyName" tickFormatter={(v) => v.replace(selectedCompany, "").trim() || v} stroke="#6b7280" fontSize={11} />
                            <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                            <Tooltip />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Bar key="active-complaints" dataKey="activeComplaintsCount" fill="#f59e0b" name="Complaints" radius={[4, 4, 0, 0]} maxBarSize={25} />
                            <Bar key="active-enquiries" dataKey="activeEnquiriesCount" fill="#3b82f6" name="Enquiries" radius={[4, 4, 0, 0]} maxBarSize={25} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No branch data available</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Branches Detail Table */}
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h4 className="text-base font-bold text-foreground">Branches Breakdown</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border">
                          <th className="px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Branch Name</th>
                          <th className="px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Contact Person</th>
                          <th className="px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Projects</th>
                          <th className="px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Complaints</th>
                          <th className="px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">AMC Status</th>
                          <th className="px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Revenue</th>
                          <th className="px-6 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {companyReport.branches.map((branch: any) => (
                          <tr key={branch.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4 text-sm font-semibold text-foreground">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-border shadow-sm bg-muted flex items-center justify-center">
                                  {branch.logoUrl ? (
                                    <img src={branch.logoUrl} alt={branch.companyName} className="h-full w-full object-cover" />
                                  ) : (
                                    <img
                                      src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(branch.companyName)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
                                      alt={branch.companyName}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                <span>{branch.companyName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                {branch.city}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{branch.contactPerson}</td>
                            <td className="px-6 py-4 text-sm text-foreground text-center font-medium">{branch.projectsCount}</td>
                            <td className="px-6 py-4 text-sm text-center">
                              {branch.activeComplaintsCount > 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300 border border-rose-200/30">
                                  {branch.activeComplaintsCount} Active
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                branch.amcStatus === "Active"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 border-emerald-200/40"
                                  : branch.amcStatus === "Expired"
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300 border-rose-200/40"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300 border-amber-200/40"
                              }`}>
                                {branch.amcStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground font-semibold text-right">{formatCurrency(branch.revenue)}</td>
                            <td className="px-6 py-4 text-sm text-center">
                              <button
                                onClick={() => navigate(`/clients/${branch.id}`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-pink-700 hover:text-pink-800 bg-pink-50 hover:bg-pink-100 border border-pink-200/30 hover:border-pink-300/60 rounded-lg transition-colors"
                              >
                                View Branch
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null
          ) : (
            /* Corporate Groups Summary */
            loadingSummary ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-pink-700" />
                <span className="text-sm font-semibold">Loading corporate structure...</span>
              </div>
            ) : companiesSummary.length > 0 ? (
              <div className="space-y-4">
                <div className="border border-border/85 bg-indigo-50/50 dark:bg-indigo-950/10 p-4 rounded-xl flex items-center gap-3">
                  <Building className="h-5 w-5 text-indigo-500" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Multi-Branch Corporate Groups</h4>
                    <p className="text-[10.5px] text-muted-foreground mt-0.5">
                      Select a parent company to view consolidated statistics, project summaries, pending complaints, and total combined revenue across all its registered branches.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companiesSummary.map((c) => (
                    <div
                      key={c.parentCompany}
                      onClick={() => handleSelectCompany(c.parentCompany)}
                      className="group relative bg-card/65 backdrop-blur-md rounded-2xl shadow-sm border border-border p-6 hover:shadow-md hover:border-pink-500/30 cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-xl bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                          {c.parentCompany.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 border border-indigo-100">
                            {c.branchesCount} Branches
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-lg font-bold text-foreground group-hover:text-pink-700 transition-colors">
                          {c.parentCompany}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">Consolidated branch group</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/60">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Projects</span>
                          <p className="text-sm font-semibold text-foreground mt-0.5">{c.totalProjects}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active AMC</span>
                          <p className="text-sm font-semibold text-foreground mt-0.5">{c.activeAmc}</p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between text-xs font-semibold text-pink-700 group-hover:translate-x-1 transition-transform">
                        <span>View Consolidated Analytics</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl bg-card">
                <Building className="h-12 w-12 text-muted-foreground mb-3 animate-bounce" />
                <h3 className="text-lg font-semibold text-foreground">No Corporate Groups Found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  To group clients under a parent company, edit a client profile and assign them a "Parent Company" name (e.g., SBI or TATA).
                </p>
              </div>
            ))}
        </TabsContent>
      </Tabs>

      {/* Recent Reports */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/20">
          <h3 className="text-lg font-semibold text-foreground">Recently Generated Reports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Report Name
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Generated On
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">
                    {report.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300 border border-blue-100">
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 border border-emerald-100">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button size="sm" variant="outline" className="flex items-center gap-2 border-border">
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

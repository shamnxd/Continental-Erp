import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { getDashboardApi } from "../../api/dashboard.api";
import { Eye, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import {
  TableClientCell,
  TablePrimarySecondary,
  TableStatusBadge,
  tableCellClass,
} from "../../components/tableCells";
import { useDebounce } from "../../hooks/useDebounce";

type AlertCategory = "all" | "warranty" | "amc" | "complaint" | "invoice";

const PAGE_SIZE = 10;

export function CriticalAlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadAlerts() {
      setIsLoading(true);
      try {
        const res = await getDashboardApi({ allAlerts: true });
        if (res.success && res.data.criticalAlerts) {
          setAlerts(res.data.criticalAlerts);
        }
      } catch (err) {
        console.error("Failed to load critical alerts", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAlerts();
  }, []);

  // Filter alerts by search term and category filter
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // 1. Category Filter
      let matchesCategory = true;
      if (categoryFilter !== "all") {
        const titleL = alert.title.toLowerCase();
        if (categoryFilter === "warranty") {
          matchesCategory = titleL.includes("warranty");
        } else if (categoryFilter === "amc") {
          matchesCategory = titleL.includes("amc");
        } else if (categoryFilter === "complaint") {
          matchesCategory = titleL.includes("complaint");
        } else if (categoryFilter === "invoice") {
          matchesCategory = titleL.includes("invoice");
        }
      }

      // 2. Search Query
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        alert.title.toLowerCase().includes(q) ||
        alert.client.toLowerCase().includes(q) ||
        alert.assignee.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [alerts, categoryFilter, debouncedSearch]);

  // Handle client-side pagination
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAlerts.slice(start, start + PAGE_SIZE);
  }, [filteredAlerts, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, debouncedSearch]);

  const columns: Column<any>[] = [
    {
      header: "Alert Detail",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.title} secondary={row.time} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Client / Reference",
      accessor: (row) => {
        const hasParenthesis = row.client.includes(" (");
        const clientName = hasParenthesis ? row.client.split(" (")[0] : row.client;
        const refNo = hasParenthesis ? row.client.slice(row.client.indexOf(" (") + 2, -1) : `Assigned: ${row.assignee}`;
        return (
          <TableClientCell
            name={clientName}
            subtitle={refNo}
            seed={clientName}
          />
        );
      },
      className: tableCellClass.wide,
    },
    {
      header: "Priority Status",
      accessor: (row) => {
        const tone = row.priority === "Critical" ? ("red" as const) : ("orange" as const);
        return <TableStatusBadge label={row.priority} tone={tone} />;
      },
      className: tableCellClass.narrow,
    },
    {
      header: "Actions",
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50"
          onClick={(e) => {
            e.stopPropagation();
            if (row.link) navigate(row.link);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      ),
      className: tableCellClass.narrow,
    },
  ];

  return (
    <ManagementListPage
      title="Critical & Urgent Alerts"
      subtitle="Overview of system critical delays, expired warranties, overdue AMC visits, and outstanding invoices."
      headerAction={
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 shrink-0 border-border hover:bg-muted text-muted-foreground hover:text-foreground font-semibold text-sm h-9"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      }
      searchPlaceholder="Search active system alerts..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        { value: "all", label: "All Alerts", count: alerts.length, tone: "pink" as const },
        { value: "warranty", label: "Warranties", count: alerts.filter((a) => a.title.toLowerCase().includes("warranty")).length, tone: "red" as const },
        { value: "amc", label: "AMC Visits", count: alerts.filter((a) => a.title.toLowerCase().includes("amc")).length, tone: "blue" as const },
        { value: "complaint", label: "Complaints", count: alerts.filter((a) => a.title.toLowerCase().includes("complaint")).length, tone: "amber" as const },
        { value: "invoice", label: "Invoices", count: alerts.filter((a) => a.title.toLowerCase().includes("invoice")).length, tone: "orange" as const },
      ]}
      filterValue={categoryFilter}
      onFilterChange={setCategoryFilter}
      columns={columns}
      data={paginatedAlerts}
      isLoading={isLoading}
      emptyMessage="No active critical system alerts found matching filters."
      currentPage={currentPage}
      totalPages={totalPages}
      total={filteredAlerts.length}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="alerts"
      onRowClick={(row) => row.link && navigate(row.link)}
    />
  );
}

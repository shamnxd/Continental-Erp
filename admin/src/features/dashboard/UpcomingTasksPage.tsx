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

type TaskCategory = "all" | "schedule" | "enquiry";

const PAGE_SIZE = 10;

export function UpcomingTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadTasks() {
      setIsLoading(true);
      try {
        const res = await getDashboardApi({ allTasks: true });
        if (res.success && res.data.upcomingTasks) {
          setTasks(res.data.upcomingTasks);
        }
      } catch (err) {
        console.error("Failed to load upcoming tasks", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTasks();
  }, []);

  // Filter tasks by search term and category filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Category Filter
      let matchesCategory = true;
      if (categoryFilter !== "all") {
        matchesCategory = task.type === categoryFilter;
      }

      // 2. Search Query
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        task.task.toLowerCase().includes(q) ||
        task.client.toLowerCase().includes(q) ||
        task.assignee.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [tasks, categoryFilter, debouncedSearch]);

  // Handle client-side pagination
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTasks.slice(start, start + PAGE_SIZE);
  }, [filteredTasks, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, debouncedSearch]);

  const columns: Column<any>[] = [
    {
      header: "Task Detail",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.task} secondary={row.date} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Client",
      accessor: (row) => (
        <TableClientCell
          name={row.client}
          seed={row.client}
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Assignee",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.assignee} />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Task Type",
      accessor: (row) => {
        const label = row.type === "enquiry" ? "Follow-up" : "Schedule";
        const tone = row.type === "enquiry" ? ("amber" as const) : ("blue" as const);
        return <TableStatusBadge label={label} tone={tone} />;
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
            if (row.type === "enquiry") {
              navigate(`/enquiries/${row.id}`);
            } else {
              navigate(`/schedules/${row.id}`);
            }
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
      title="Upcoming Tasks"
      subtitle="Overview of scheduled service visits, AMC visits, and pending enquiry follow-ups."
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
      searchPlaceholder="Search upcoming tasks..."
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      filterOptions={[
        { value: "all", label: "All Tasks", count: tasks.length, tone: "pink" as const },
        { value: "schedule", label: "Schedules", count: tasks.filter((t) => t.type === "schedule").length, tone: "blue" as const },
        { value: "enquiry", label: "Follow-ups", count: tasks.filter((t) => t.type === "enquiry").length, tone: "amber" as const },
      ]}
      filterValue={categoryFilter}
      onFilterChange={setCategoryFilter}
      columns={columns}
      data={paginatedTasks}
      isLoading={isLoading}
      emptyMessage="No upcoming tasks found matching filters."
      currentPage={currentPage}
      totalPages={totalPages}
      total={filteredTasks.length}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
      entityLabel="tasks"
      onRowClick={(row) => {
        if (row.type === "enquiry") {
          navigate(`/enquiries/${row.id}`);
        } else {
          navigate(`/schedules/${row.id}`);
        }
      }}
    />
  );
}

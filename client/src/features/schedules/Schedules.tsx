import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Eye,
  CalendarClock,
  CalendarDays,
  CalendarCheck2,
  PhoneCall,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { getAmcApi } from "../../api/amc.api";
import { getSchedulesApi } from "../../api/schedule.api";
import type { AmcContract, AmcContractStatus } from "../../interfaces/amc.interface";
import { calculatePreferredVisitDate } from "../../utils/calculateAmcVisits";
import { ManagementListPage } from "../../components/ManagementListPage";
import { Column } from "../../components/ReusableTable";
import {
  TableClientCell,
  TablePrimarySecondary,
  TableStatusBadge,
  tableCellClass,
} from "../../components/tableCells";
import { useDebounce } from "../../hooks/useDebounce";
import { AppRoute } from "../../constants/routes.enum";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ScheduleType =
  | "AMC Visit"
  | "Preferred Visit"
  | "Site Visit"
  | "Complaint Resolution"
  | "Follow-up"
  | "Project/Minor Job";

export interface ScheduleItem {
  id: string;
  scheduleId?: string; // raw schedule DB id (for detail page navigation)
  date: string;
  type: ScheduleType;
  title: string;
  clientName: string;
  status: string;
  reference: string;
  clientSubtitle?: string;
  eventSubtitle?: string;
  visitSlot?: string;
  contractStatus?: AmcContractStatus;
  amcId?: string;
  visitId?: string;
  enquiryId?: string;
  complaintId?: string;
  projectId?: string;
  minorjobId?: string;
  assignedTo?: string[];
}

type ScheduleTab = "visits" | "followups" | "preferred";

// Visit-sub-type filters
type VisitTypeFilter =
  | "all"
  | "AMC Visit"
  | "Site Visit"
  | "Complaint Resolution"
  | "Project/Minor Job";

// Follow-up status filters
type FollowUpStatusFilter = "all" | "Scheduled" | "Pending" | "In Progress" | "Completed" | "Cancelled";

// AMC preferred contract filters
type PreferredContractFilter = "all" | AmcContractStatus;

const PAGE_SIZE = 15;

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildPreferredVisitItems(contract: AmcContract): ScheduleItem[] {
  if (!contract.id || contract.status === "Expired") return [];
  const completed = Math.max(0, contract.visitsCompleted ?? 0);
  const total = Math.max(0, contract.totalVisits ?? 0);
  if (total <= 0 || completed >= total) return [];

  const items: ScheduleItem[] = [];
  for (let visitIndex = completed + 1; visitIndex <= total; visitIndex++) {
    const date = calculatePreferredVisitDate(
      contract.startDate,
      contract.endDate,
      visitIndex,
      total
    );
    if (!date) continue;
    items.push({
      id: `preferred-${contract.id}-${visitIndex}`,
      date,
      type: "Preferred Visit",
      title: contract.serviceType,
      visitSlot: `Visit ${visitIndex} of ${total}`,
      clientName: contract.clientName,
      clientSubtitle: contract.email?.trim() || contract.contactPerson,
      eventSubtitle: contract.serviceType,
      status: "Preferred",
      reference: contract.amcNo,
      contractStatus: contract.status,
      amcId: contract.id,
    });
  }
  return items;
}

function fmtDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function compareByDateDesc(a: ScheduleItem, b: ScheduleItem): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

const tabTriggerClass =
  "flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/30 data-[state=active]:shadow-none data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400 px-4 text-sm font-bold transition-all gap-2";

// ─── Main Component ─────────────────────────────────────────────────────────

export function Schedules() {
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [activeTab, setActiveTab] = useState<ScheduleTab>("visits");
  const [visitFilter, setVisitFilter] = useState<VisitTypeFilter>("all");
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpStatusFilter>("all");
  const [preferredFilter, setPreferredFilter] = useState<PreferredContractFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const items: ScheduleItem[] = [];

      const [schedulesRes, amcRes] = await Promise.all([
        getSchedulesApi({ limit: 1000 }),
        getAmcApi({ page: 1, limit: 500 }),
      ]);

      // AMC Preferred Visits (computed)
      if (amcRes.success) {
        for (const contract of amcRes.data) {
          items.push(...buildPreferredVisitItems(contract));
        }
      }

      // Scheduled entries from DB
      if (schedulesRes.success) {
        for (const sch of schedulesRes.data) {
          let itemType: ScheduleType = "Site Visit";
          if (sch.scheduleType === "Follow-up") {
            itemType = "Follow-up";
          } else if (sch.scheduleType === "AMC Visit") {
            itemType = "AMC Visit";
          } else if (sch.scheduleType === "Complaint Resolution") {
            itemType = "Complaint Resolution";
          } else if (
            sch.scheduleType === "Project Installation" ||
            sch.scheduleType === "Minor Job"
          ) {
            itemType = "Project/Minor Job";
          } else {
            itemType = "Site Visit";
          }

          items.push({
            id: `schedule-${sch.id}`,
            scheduleId: sch.id,
            date: sch.scheduledDate,
            type: itemType,
            title: sch.title,
            clientName: sch.clientName,
            clientSubtitle:
              sch.assignedTo && sch.assignedTo.length > 0
                ? `Assigned: ${sch.assignedTo.join(", ")}`
                : "",
            eventSubtitle: sch.notes || "",
            status: sch.status,
            reference: sch.entityNo,
            assignedTo: sch.assignedTo,
            amcId: sch.entityType === "amc" ? sch.entityId : undefined,
            visitId:
              sch.entityType === "amc" && sch.scheduleType === "AMC Visit"
                ? sch.id
                : undefined,
            enquiryId: sch.entityType === "enquiry" ? sch.entityId : undefined,
            complaintId:
              sch.entityType === "complaint" ? sch.entityId : undefined,
            projectId: sch.entityType === "project" ? sch.entityId : undefined,
            minorjobId:
              sch.entityType === "minorjob" ? sch.entityId : undefined,
          });
        }
      }

      items.sort(compareByDateDesc);
      setAllItems(items);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load schedules");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab, visitFilter, followUpFilter, preferredFilter]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const visitItems = useMemo(
    () => allItems.filter((i) => i.type !== "Preferred Visit" && i.type !== "Follow-up"),
    [allItems]
  );
  const followUpItems = useMemo(
    () => allItems.filter((i) => i.type === "Follow-up"),
    [allItems]
  );
  const preferredItems = useMemo(
    () => allItems.filter((i) => i.type === "Preferred Visit"),
    [allItems]
  );

  const tabSource =
    activeTab === "visits"
      ? visitItems
      : activeTab === "followups"
      ? followUpItems
      : preferredItems;

  const visitStats = useMemo(
    () => ({
      all: visitItems.length,
      amc: visitItems.filter((i) => i.type === "AMC Visit").length,
      site: visitItems.filter((i) => i.type === "Site Visit").length,
      complaint: visitItems.filter((i) => i.type === "Complaint Resolution").length,
      project: visitItems.filter((i) => i.type === "Project/Minor Job").length,
    }),
    [visitItems]
  );

  const followUpStats = useMemo(
    () => ({
      all: followUpItems.length,
      scheduled: followUpItems.filter((i) => i.status === "Scheduled").length,
      pending: followUpItems.filter((i) => i.status === "Pending").length,
      inProgress: followUpItems.filter((i) => i.status === "In Progress").length,
      completed: followUpItems.filter((i) => i.status === "Completed").length,
      cancelled: followUpItems.filter((i) => i.status === "Cancelled").length,
    }),
    [followUpItems]
  );

  const preferredStats = useMemo(
    () => ({
      all: preferredItems.length,
      active: preferredItems.filter((i) => i.contractStatus === "Active").length,
      renewal: preferredItems.filter((i) => i.contractStatus === "Due for Renewal").length,
      expired: preferredItems.filter((i) => i.contractStatus === "Expired").length,
    }),
    [preferredItems]
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return tabSource.filter((item) => {
      // Tab-specific filter
      if (activeTab === "visits") {
        if (visitFilter !== "all" && item.type !== visitFilter) return false;
      } else if (activeTab === "followups") {
        if (followUpFilter !== "all" && item.status !== followUpFilter) return false;
      } else {
        if (preferredFilter !== "all" && item.contractStatus !== preferredFilter) return false;
      }

      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.visitSlot?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [tabSource, debouncedSearch, activeTab, visitFilter, followUpFilter, preferredFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleOpen = (row: ScheduleItem) => {
    if (activeTab === "preferred") {
      // AMC preferred: go to AMC detail (existing behavior)
      if (row.amcId) {
        navigate(AppRoute.AMC_DETAIL.replace(":id", row.amcId));
      }
      return;
    }
    // Visit Schedules & Follow-up Schedules → go to detail page
    if (row.scheduleId) {
      navigate(`/schedules/${row.scheduleId}`);
    }
  };

  // ── Status tone helpers ────────────────────────────────────────────────────

  const scheduleStatusTone = (status: string): "muted" | "pink" | "amber" | "green" | "blue" => {
    if (status === "Scheduled") return "pink";
    if (status === "Pending") return "amber";
    if (status === "In Progress") return "blue";
    if (status === "Completed") return "green";
    return "muted";
  };

  const contractStatusTone = (status?: string): "green" | "amber" | "red" | "muted" => {
    if (status === "Active") return "green";
    if (status === "Due for Renewal") return "amber";
    if (status === "Expired") return "red";
    return "muted";
  };

  const typeBadgeColor = (type: ScheduleType): string => {
    if (type === "AMC Visit") return "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400";
    if (type === "Complaint Resolution") return "text-red-700 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400";
    if (type === "Project/Minor Job") return "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400";
    if (type === "Follow-up") return "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400";
    return "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400";
  };

  // ── Columns ────────────────────────────────────────────────────────────────

  const visitColumns: Column<ScheduleItem>[] = [
    {
      header: "Scheduled Date",
      accessor: (row) => (
        <div className="flex items-start gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
          <TablePrimarySecondary
            primary={fmtDate(row.date)}
            secondary={
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide ${typeBadgeColor(row.type)}`}>
                {row.type}
              </span>
            }
            primaryClassName="text-sm font-semibold text-pink-600 whitespace-nowrap"
          />
        </div>
      ),
      className: `${tableCellClass.medium}`,
    },
    {
      header: "Client",
      accessor: (row) => (
        <TableClientCell name={row.clientName} subtitle={row.clientSubtitle} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Reference / Description",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={row.reference}
          secondary={row.eventSubtitle ? `${row.title} · ${row.eventSubtitle}` : row.title}
          secondaryClassName="text-xs text-muted-foreground line-clamp-2 leading-snug max-w-[220px]"
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Status",
      accessor: (row) => (
        <TableStatusBadge label={row.status} tone={scheduleStatusTone(row.status)} />
      ),
      className: tableCellClass.narrow,
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: tableCellClass.actions,
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 border-pink-200 text-pink-700 hover:bg-pink-50"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen(row);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  const followUpColumns: Column<ScheduleItem>[] = [
    {
      header: "Follow-up Date",
      accessor: (row) => (
        <div className="flex items-start gap-2 min-w-0">
          <PhoneCall className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <TablePrimarySecondary
            primary={fmtDate(row.date)}
            secondary={row.reference}
            primaryClassName="text-sm font-semibold text-amber-600 whitespace-nowrap"
            secondaryClassName="text-[11px] text-muted-foreground font-medium"
          />
        </div>
      ),
      className: `${tableCellClass.medium}`,
    },
    {
      header: "Client",
      accessor: (row) => (
        <TableClientCell name={row.clientName} subtitle={row.clientSubtitle} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Notes / Subject",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={row.title}
          secondary={row.eventSubtitle || "—"}
          secondaryClassName="text-xs text-muted-foreground line-clamp-2 leading-snug max-w-[220px]"
        />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Status",
      accessor: (row) => (
        <TableStatusBadge label={row.status} tone={scheduleStatusTone(row.status)} />
      ),
      className: tableCellClass.narrow,
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: tableCellClass.actions,
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen(row);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  const preferredColumns: Column<ScheduleItem>[] = [
    {
      header: "Preferred Date",
      accessor: (row) => (
        <div className="flex items-start gap-2 min-w-0">
          <CalendarCheck2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <TablePrimarySecondary
            primary={fmtDate(row.date)}
            secondary={row.visitSlot}
            primaryClassName="text-sm font-semibold text-blue-600 whitespace-nowrap"
          />
        </div>
      ),
      className: tableCellClass.medium,
    },
    {
      header: "AMC Contract",
      accessor: (row) => (
        <TablePrimarySecondary primary={row.reference} secondary={row.eventSubtitle ?? row.title} />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Client",
      accessor: (row) => (
        <TableClientCell name={row.clientName} subtitle={row.clientSubtitle} />
      ),
      className: tableCellClass.wide,
    },
    {
      header: "Contract Status",
      accessor: (row) => (
        <TableStatusBadge
          label={row.contractStatus ?? "Preferred"}
          tone={row.contractStatus ? contractStatusTone(row.contractStatus) : "blue"}
        />
      ),
      className: tableCellClass.narrow,
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: tableCellClass.actions,
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
          onClick={(e) => {
            e.stopPropagation();
            handleOpen(row);
          }}
        >
          <Eye className="h-3.5 w-3.5" />
          View AMC
        </Button>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  const counts = useMemo(
    () => ({
      visits: visitItems.length,
      followups: followUpItems.length,
      preferred: preferredItems.length,
    }),
    [visitItems.length, followUpItems.length, preferredItems.length]
  );

  const currentColumns =
    activeTab === "visits"
      ? visitColumns
      : activeTab === "followups"
      ? followUpColumns
      : preferredColumns;

  const currentFilterOptions =
    activeTab === "visits"
      ? [
          { value: "all", label: "All", count: visitStats.all, tone: "primary" as const },
          { value: "AMC Visit", label: "AMC Visits", count: visitStats.amc, tone: "pink" as const },
          { value: "Site Visit", label: "Site Visits", count: visitStats.site, tone: "blue" as const },
          { value: "Complaint Resolution", label: "Complaints", count: visitStats.complaint, tone: "amber" as const },
          { value: "Project/Minor Job", label: "Projects/Jobs", count: visitStats.project, tone: "green" as const },
        ]
      : activeTab === "followups"
      ? [
          { value: "all", label: "All", count: followUpStats.all, tone: "primary" as const },
          { value: "Scheduled", label: "Scheduled", count: followUpStats.scheduled, tone: "pink" as const },
          { value: "Pending", label: "Pending", count: followUpStats.pending, tone: "amber" as const },
          { value: "In Progress", label: "In Progress", count: followUpStats.inProgress, tone: "blue" as const },
          { value: "Completed", label: "Completed", count: followUpStats.completed, tone: "green" as const },
        ]
      : [
          { value: "all", label: "All", count: preferredStats.all, tone: "primary" as const },
          { value: "Active", label: "Active", count: preferredStats.active, tone: "green" as const },
          { value: "Due for Renewal", label: "Due for Renewal", count: preferredStats.renewal, tone: "amber" as const },
          { value: "Expired", label: "Expired", count: preferredStats.expired, tone: "red" as const },
        ];

  const currentFilterValue =
    activeTab === "visits"
      ? visitFilter
      : activeTab === "followups"
      ? followUpFilter
      : preferredFilter;

  const handleFilterChange = (v: string) => {
    if (activeTab === "visits") setVisitFilter(v as VisitTypeFilter);
    else if (activeTab === "followups") setFollowUpFilter(v as FollowUpStatusFilter);
    else setPreferredFilter(v as PreferredContractFilter);
  };

  const emptyMessages: Record<ScheduleTab, string> = {
    visits: "No visit schedules found. Visit schedules are created from AMC, enquiry, complaint, project, or minor job detail pages.",
    followups: "No follow-up schedules found. Follow-ups are added from entity detail pages.",
    preferred: "No upcoming preferred AMC visits. Preferred visit dates are computed from active AMC contracts.",
  };

  return (
    <ManagementListPage
      title="Schedules"
      subtitle="Manage visit schedules, follow-ups, and AMC preferred visit dates"
      toolbar={
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as ScheduleTab);
            setCurrentPage(1);
          }}
        >
          <TabsList className="w-full h-12 bg-transparent p-0 rounded-none inline-flex flex-nowrap justify-start gap-6 border-b border-border pb-0 mb-1">
            <TabsTrigger value="visits" className={tabTriggerClass}>
              <CalendarClock className="h-4 w-4" />
              Visit Schedules
              <span className="tabular-nums text-muted-foreground font-semibold">
                ({counts.visits})
              </span>
            </TabsTrigger>
            <TabsTrigger value="followups" className={tabTriggerClass}>
              <PhoneCall className="h-4 w-4" />
              Follow-up Schedules
              <span className="tabular-nums text-muted-foreground font-semibold">
                ({counts.followups})
              </span>
            </TabsTrigger>
            <TabsTrigger value="preferred" className={tabTriggerClass}>
              <CalendarDays className="h-4 w-4" />
              AMC Preferred Visits
              <span className="tabular-nums text-muted-foreground font-semibold">
                ({counts.preferred})
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
      searchPlaceholder={
        activeTab === "preferred"
          ? "Search by AMC no., client, or visit slot..."
          : activeTab === "followups"
          ? "Search by client, reference, or notes..."
          : "Search by client, reference, or title..."
      }
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      columns={currentColumns}
      data={pageItems}
      isLoading={isLoading}
      rowKey={(row) => row.id}
      onRowClick={handleOpen}
      emptyMessage={emptyMessages[activeTab]}
      entityLabel={
        activeTab === "visits"
          ? "visit schedules"
          : activeTab === "followups"
          ? "follow-up schedules"
          : "preferred visits"
      }
      filterOptions={currentFilterOptions}
      filterValue={currentFilterValue}
      onFilterChange={handleFilterChange}
      onClearFilter={() => handleFilterChange("all")}
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
    />
  );
}

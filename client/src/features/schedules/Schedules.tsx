import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { Calendar, Eye, CalendarClock, CalendarDays, MoreVertical } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
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

export type ScheduleType =
  | "AMC Visit"
  | "Preferred Visit"
  | "Site Visit"
  | "Complaint Resolution"
  | "Follow-up"
  | "Project/Minor Job";

export interface ScheduleItem {
  id: string;
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
}

type ScheduleTab = "scheduled" | "preferred";

type ScheduledTypeFilter =
  | "all"
  | "AMC Visit"
  | "Site Visit"
  | "Complaint Resolution"
  | "Follow-up"
  | "Project/Minor Job";

type PreferredContractFilter = "all" | AmcContractStatus;

const PAGE_SIZE = 15;

const scheduledFilterLabels: Record<ScheduledTypeFilter, string> = {
  all: "All Types",
  "AMC Visit": "AMC Visits",
  "Site Visit": "Site Visits",
  "Complaint Resolution": "Complaints",
  "Follow-up": "Follow-ups",
  "Project/Minor Job": "Projects & Jobs",
};

const preferredFilterLabels: Record<PreferredContractFilter, string> = {
  all: "All Contracts",
  Active: "Active",
  "Due for Renewal": "Due for Renewal",
  Expired: "Expired",
};

const tabTriggerClass =
  "flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/30 data-[state=active]:shadow-none data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400 px-4 text-sm font-bold transition-all gap-2";

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

/** Latest dates first (highest / most recent at top). */
function compareByDateDesc(a: ScheduleItem, b: ScheduleItem): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export function Schedules() {
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [activeTab, setActiveTab] = useState<ScheduleTab>("scheduled");
  const [scheduledFilter, setScheduledFilter] = useState<ScheduledTypeFilter>("all");
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

      if (amcRes.success) {
        for (const contract of amcRes.data) {
          items.push(...buildPreferredVisitItems(contract));
        }
      }

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
            date: sch.scheduledDate,
            type: itemType,
            title: sch.title,
            clientName: sch.clientName,
            clientSubtitle: sch.clientRef || (sch.assignedTo && sch.assignedTo.length > 0 ? `Assigned: ${sch.assignedTo.join(", ")}` : ""),
            eventSubtitle: sch.notes || "",
            status: sch.status,
            reference: sch.entityNo,
            amcId: sch.entityType === "amc" ? sch.entityId : undefined,
            visitId: sch.entityType === "amc" && sch.scheduleType === "AMC Visit" ? sch.id : undefined,
            enquiryId: sch.entityType === "enquiry" ? sch.entityId : undefined,
            complaintId: sch.entityType === "complaint" ? sch.entityId : undefined,
            projectId: sch.entityType === "project" ? sch.entityId : undefined,
            minorjobId: sch.entityType === "minorjob" ? sch.entityId : undefined,
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
  }, [debouncedSearch, activeTab, scheduledFilter, preferredFilter]);

  const scheduledItems = useMemo(
    () => allItems.filter((i) => i.type !== "Preferred Visit"),
    [allItems]
  );

  const preferredItems = useMemo(
    () => allItems.filter((i) => i.type === "Preferred Visit"),
    [allItems]
  );

  const tabSource = activeTab === "preferred" ? preferredItems : scheduledItems;

  const scheduledStats = useMemo(
    () => ({
      all: scheduledItems.length,
      amc: scheduledItems.filter((i) => i.type === "AMC Visit").length,
      site: scheduledItems.filter((i) => i.type === "Site Visit").length,
      complaint: scheduledItems.filter((i) => i.type === "Complaint Resolution").length,
      followUp: scheduledItems.filter((i) => i.type === "Follow-up").length,
      projectJob: scheduledItems.filter((i) => i.type === "Project/Minor Job").length,
    }),
    [scheduledItems]
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
      if (activeTab === "scheduled") {
        if (scheduledFilter !== "all" && item.type !== scheduledFilter) return false;
      } else if (preferredFilter !== "all" && item.contractStatus !== preferredFilter) {
        return false;
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
  }, [tabSource, debouncedSearch, activeTab, scheduledFilter, preferredFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const counts = useMemo(
    () => ({
      scheduled: scheduledItems.length,
      preferred: preferredItems.length,
    }),
    [scheduledItems.length, preferredItems.length]
  );

  const handleOpen = (row: ScheduleItem) => {
    if (row.amcId && row.visitId) {
      navigate(AppRoute.AMC_VISIT_DETAIL.replace(":amcId", row.amcId).replace(":visitId", row.visitId));
    } else if (row.enquiryId) {
      navigate(AppRoute.ENQUIRY_DETAIL.replace(":id", row.enquiryId));
    } else if (row.complaintId) {
      navigate(AppRoute.COMPLAINT_DETAIL.replace(":id", row.complaintId));
    } else if (row.amcId) {
      navigate(AppRoute.AMC_DETAIL.replace(":id", row.amcId));
    } else if (row.projectId) {
      navigate(AppRoute.PROJECTS);
    } else if (row.minorjobId) {
      navigate(AppRoute.MINOR_JOBS);
    }
  };

  const renderActions = (row: ScheduleItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => handleOpen(row)} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4 text-blue-500" />
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const scheduleStatusTone = (status: string): "muted" | "pink" | "amber" | "green" => {
    if (status === "Scheduled") return "pink";
    if (status === "In Progress") return "amber";
    if (status === "Resolved" || status === "Completed") return "green";
    return "muted";
  };

  const contractStatusTone = (status?: string): "green" | "amber" | "red" | "muted" => {
    if (status === "Active") return "green";
    if (status === "Due for Renewal") return "amber";
    if (status === "Expired") return "red";
    return "muted";
  };

  const scheduledColumns: Column<ScheduleItem>[] = [
    {
      header: "Schedule",
      accessor: (row) => (
        <div className="flex items-start gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
          <TablePrimarySecondary
            primary={fmtDate(row.date)}
            secondary={row.type}
            primaryClassName="text-sm font-semibold text-pink-600 whitespace-nowrap"
            secondaryClassName="text-[10px] font-bold uppercase text-muted-foreground"
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
      header: "Event",
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
      accessor: (row) => <TableStatusBadge label={row.status} tone={scheduleStatusTone(row.status)} />,
      className: tableCellClass.narrow,
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: tableCellClass.actions,
      accessor: (row) => renderActions(row),
    },
  ];

  const preferredColumns: Column<ScheduleItem>[] = [
    {
      header: "Preferred date",
      accessor: (row) => (
        <div className="flex items-start gap-2 min-w-0">
          <CalendarDays className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
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
      header: "AMC contract",
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
      header: "Status",
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
      accessor: (row) => renderActions(row),
    },
  ];

  const isPreferredTab = activeTab === "preferred";

  return (
    <ManagementListPage
      title="Schedules"
      subtitle="Booked visits and preferred AMC dates, sorted with the latest dates first"
      toolbar={
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as ScheduleTab);
            setScheduledFilter("all");
            setPreferredFilter("all");
            setCurrentPage(1);
          }}
        >
          <TabsList className="w-full h-12 bg-transparent p-0 rounded-none inline-flex flex-nowrap justify-start gap-6 border-b border-border pb-0 mb-1">
            <TabsTrigger value="scheduled" className={tabTriggerClass}>
              <CalendarClock className="h-4 w-4" />
              Scheduled
              <span className="tabular-nums text-muted-foreground font-semibold">
                ({counts.scheduled})
              </span>
            </TabsTrigger>
            <TabsTrigger value="preferred" className={tabTriggerClass}>
              <CalendarDays className="h-4 w-4" />
              Preferred Visits
              <span className="tabular-nums text-muted-foreground font-semibold">
                ({counts.preferred})
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
      searchPlaceholder={
        isPreferredTab
          ? "Search by AMC no., client, or visit..."
          : "Search by client, reference, or title..."
      }
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      columns={isPreferredTab ? preferredColumns : scheduledColumns}
      data={pageItems}
      isLoading={isLoading}
      rowKey={(row) => row.id}
      onRowClick={handleOpen}
      emptyMessage={
        isPreferredTab
          ? "No preferred visit dates for active AMC contracts"
          : "No scheduled visits found"
      }
      entityLabel={isPreferredTab ? "preferred visits" : "scheduled items"}
      filterOptions={
        isPreferredTab
          ? [
              { value: "all", label: "All", count: preferredStats.all, tone: "primary" },
              { value: "Active", label: "Active", count: preferredStats.active, tone: "green" },
              {
                value: "Due for Renewal",
                label: "Due for Renewal",
                count: preferredStats.renewal,
                tone: "amber",
              },
              { value: "Expired", label: "Expired", count: preferredStats.expired, tone: "red" },
            ]
          : [
              { value: "all", label: "All", count: scheduledStats.all, tone: "primary" },
              { value: "AMC Visit", label: "AMC Visits", count: scheduledStats.amc, tone: "pink" },
              { value: "Site Visit", label: "Site Visits", count: scheduledStats.site, tone: "blue" },
              {
                value: "Complaint Resolution",
                label: "Complaints",
                count: scheduledStats.complaint,
                tone: "amber",
              },
              { value: "Follow-up", label: "Follow-ups", count: scheduledStats.followUp, tone: "pink" },
              {
                value: "Project/Minor Job",
                label: "Projects/Jobs",
                count: scheduledStats.projectJob,
                tone: "green",
              },
            ]
      }
      filterValue={isPreferredTab ? preferredFilter : scheduledFilter}
      onFilterChange={(v) =>
        isPreferredTab
          ? setPreferredFilter(v as PreferredContractFilter)
          : setScheduledFilter(v as ScheduledTypeFilter)
      }
      activeFilterLabel={
        isPreferredTab
          ? preferredFilter !== "all"
            ? preferredFilterLabels[preferredFilter]
            : undefined
          : scheduledFilter !== "all"
            ? scheduledFilterLabels[scheduledFilter]
            : undefined
      }
      onClearFilter={() =>
        isPreferredTab ? setPreferredFilter("all") : setScheduledFilter("all")
      }
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={PAGE_SIZE}
      onPageChange={setCurrentPage}
    />
  );
}


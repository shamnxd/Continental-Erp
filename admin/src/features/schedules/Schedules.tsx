import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Eye,
  CalendarClock,
  CalendarDays,
  CalendarCheck2,
  CalendarPlus,
  Loader2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import { getAmcApi } from "../../api/amc.api";
import { getSchedulesApi, createScheduleApi } from "../../api/schedule.api";
import { getStaffApi } from "../../api/staff.api";
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
  | "Project"
  | "Minor Job";

export interface ScheduleItem {
  id: string;
  scheduleId?: string;
  date: string;
  type: ScheduleType;
  title: string;
  clientName: string;
  clientLogoUrl?: string;
  status: string;
  reference: string;
  clientSubtitle?: string;
  eventSubtitle?: string;
  visitSlot?: string;
  visitIndex?: number;
  totalVisits?: number;
  contractStatus?: AmcContractStatus;
  amcId?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  contractNo?: string;
  assignedTo?: string[];
}

type ScheduleTab = "visits" | "followups" | "preferred";

type VisitTypeFilter =
  | "all"
  | "AMC Visit"
  | "Site Visit"
  | "Complaint Resolution"
  | "Project"
  | "Minor Job";

type VisitStatusFilter = "all" | "Scheduled" | "In Progress" | "Completed" | "Cancelled";

type FollowUpStatusFilter = "all" | "Scheduled" | "Pending" | "In Progress" | "Completed" | "Cancelled";

type PreferredContractFilter = "all" | AmcContractStatus;

const PAGE_SIZE = 15;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns only the NEXT preferred visit for each AMC contract. */
function buildNextPreferredVisitItem(contract: AmcContract): ScheduleItem | null {
  if (!contract.id || contract.status === "Expired") return null;
  const completed = Math.max(0, contract.visitsCompleted ?? 0);
  const total = Math.max(0, contract.totalVisits ?? 0);
  if (total <= 0 || completed >= total) return null;

  const nextIndex = completed + 1;
  const date = calculatePreferredVisitDate(
    contract.startDate,
    contract.endDate,
    nextIndex,
    total
  );
  if (!date) return null;

  return {
    id: `preferred-${contract.id}-${nextIndex}`,
    date,
    type: "Preferred Visit",
    title: contract.serviceType,
    visitSlot: `Visit ${nextIndex} of ${total}`,
    visitIndex: nextIndex,
    totalVisits: total,
    clientName: contract.clientName,
    clientLogoUrl: contract.clientLogoUrl,
    clientSubtitle: contract.email?.trim() || contract.contactPerson,
    eventSubtitle: contract.serviceType,
    status: "Preferred",
    reference: contract.amcNo,
    contractStatus: contract.status,
    amcId: contract.id,
    contractStartDate: contract.startDate,
    contractEndDate: contract.endDate,
    contractNo: contract.amcNo,
  };
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

function compareByDateAsc(a: ScheduleItem, b: ScheduleItem): number {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function compareByDateDesc(a: ScheduleItem, b: ScheduleItem): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

const tabTriggerClass =
  "flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/30 data-[state=active]:shadow-none data-[state=active]:text-pink-700 dark:data-[state=active]:text-pink-400 px-4 text-sm font-bold transition-all gap-2";

// ─── Main Component ─────────────────────────────────────────────────────────

export function Schedules() {
  const navigate = useNavigate();
  const [visitItems, setVisitItems] = useState<ScheduleItem[]>([]);
  const [followUpItems, setFollowUpItems] = useState<ScheduleItem[]>([]);
  const [preferredItems, setPreferredItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [activeTab, setActiveTab] = useState<ScheduleTab>("visits");
  // Visit tab: separate type dropdown + status chip filter
  const [visitTypeFilter, setVisitTypeFilter] = useState<VisitTypeFilter>("all");
  const [visitStatusFilter, setVisitStatusFilter] = useState<VisitStatusFilter>("Scheduled");
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpStatusFilter>("all");
  const [preferredFilter, setPreferredFilter] = useState<PreferredContractFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Schedule Visit dialog (convert preferred → scheduled)
  const [scheduleDialogItem, setScheduleDialogItem] = useState<ScheduleItem | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedStaffIds, setSchedStaffIds] = useState<string[]>([]);
  const [schedNotes, setSchedNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schedulesRes, amcRes, staffRes] = await Promise.all([
        getSchedulesApi({ limit: 1000 }),
        getAmcApi({ page: 1, limit: 500 }),
        getStaffApi({ limit: 200, activeOnly: true }),
      ]);

      if (staffRes.success) setStaffList(staffRes.data);

      // Visit items + Follow-up items from DB (split by scheduleType)
      const visits: ScheduleItem[] = [];
      const followUps: ScheduleItem[] = [];
      if (schedulesRes.success) {
        for (const sch of schedulesRes.data) {
          if (sch.scheduleType === "Follow-up") {
            followUps.push({
              id: `schedule-${sch.id}`,
              scheduleId: sch.id,
              date: sch.scheduledDate,
              type: "Follow-up",
              title: sch.title,
              clientName: sch.clientName,
              clientLogoUrl: sch.clientLogoUrl,
              clientSubtitle: sch.assignedTo?.length ? `Assigned: ${sch.assignedTo.join(", ")}` : "",
              eventSubtitle: sch.notes || "",
              status: sch.status,
              reference: sch.entityNo,
              assignedTo: sch.assignedTo,
            });
            continue;
          }
          let itemType: ScheduleType = "Site Visit";
          if (sch.scheduleType === "AMC Visit") itemType = "AMC Visit";
          else if (sch.scheduleType === "Complaint Resolution") itemType = "Complaint Resolution";
          else if (sch.scheduleType === "Project Installation") itemType = "Project";
          else if (sch.scheduleType === "Minor Job") itemType = "Minor Job";
          else itemType = "Site Visit";

          visits.push({
            id: `schedule-${sch.id}`,
            scheduleId: sch.id,
            date: sch.scheduledDate,
            type: itemType,
            title: sch.title,
            clientName: sch.clientName,
            clientLogoUrl: sch.clientLogoUrl,
            clientSubtitle: sch.assignedTo?.length ? `Assigned: ${sch.assignedTo.join(", ")}` : "",
            eventSubtitle: sch.notes || "",
            status: sch.status,
            reference: sch.entityNo,
            assignedTo: sch.assignedTo,
          });
        }
      }
      visits.sort(compareByDateAsc); // ascending = most urgent/nearest first
      followUps.sort(compareByDateDesc);
      setVisitItems(visits);
      setFollowUpItems(followUps);

      // Preferred: only NEXT visit per contract, sorted ascending (nearest first)
      const preferred: ScheduleItem[] = [];
      if (amcRes.success) {
        for (const contract of amcRes.data) {
          const item = buildNextPreferredVisitItem(contract);
          if (item) preferred.push(item);
        }
      }
      preferred.sort(compareByDateAsc);
      setPreferredItems(preferred);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load schedules");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, activeTab, visitTypeFilter, visitStatusFilter, followUpFilter, preferredFilter]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const visitStats = useMemo(() => ({
    // counts by status (for chip display)
    all: visitItems.length,
    scheduled: visitItems.filter((i) => i.status === "Scheduled").length,
    inProgress: visitItems.filter((i) => i.status === "In Progress").length,
    completed: visitItems.filter((i) => i.status === "Completed").length,
    cancelled: visitItems.filter((i) => i.status === "Cancelled").length,
    // counts by type (for dropdown labels)
    amc: visitItems.filter((i) => i.type === "AMC Visit").length,
    site: visitItems.filter((i) => i.type === "Site Visit").length,
    complaint: visitItems.filter((i) => i.type === "Complaint Resolution").length,
    project: visitItems.filter((i) => i.type === "Project").length,
    minorJob: visitItems.filter((i) => i.type === "Minor Job").length,
  }), [visitItems]);

  const followUpStats = useMemo(() => ({
    all: followUpItems.length,
    scheduled: followUpItems.filter((i) => i.status === "Scheduled").length,
    pending: followUpItems.filter((i) => i.status === "Pending").length,
    inProgress: followUpItems.filter((i) => i.status === "In Progress").length,
    completed: followUpItems.filter((i) => i.status === "Completed").length,
  }), [followUpItems]);

  const preferredStats = useMemo(() => ({
    all: preferredItems.length,
    active: preferredItems.filter((i) => i.contractStatus === "Active").length,
    renewal: preferredItems.filter((i) => i.contractStatus === "Due for Renewal").length,
  }), [preferredItems]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const tabSource =
    activeTab === "visits" ? visitItems :
    activeTab === "followups" ? followUpItems :
    preferredItems;

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return tabSource.filter((item) => {
      if (activeTab === "visits") {
        // Type dropdown filter
        if (visitTypeFilter !== "all" && item.type !== visitTypeFilter) return false;
        // Status chip filter
        if (visitStatusFilter !== "all" && item.status !== visitStatusFilter) return false;
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
  }, [tabSource, debouncedSearch, activeTab, visitTypeFilter, visitStatusFilter, followUpFilter, preferredFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleRowClick = (row: ScheduleItem) => {
    if (activeTab === "preferred") {
      if (row.amcId) navigate(AppRoute.AMC_DETAIL.replace(":id", row.amcId));
      return;
    }
    if (row.scheduleId) navigate(`/schedules/${row.scheduleId}`);
  };

  // ── Schedule Visit conversion dialog ──────────────────────────────────────

  const openScheduleDialog = (item: ScheduleItem) => {
    setScheduleDialogItem(item);
    setSchedDate(item.date); // pre-fill with preferred date
    setSchedStaffIds([]);
    setSchedNotes("");
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleDialogItem || !schedDate) return;
    setIsSaving(true);
    try {
      const staffNames = schedStaffIds
        .map((sid) => staffList.find((s) => (s.id || s._id) === sid)?.fullName)
        .filter(Boolean);

      const res = await createScheduleApi({
        entityType: "amc",
        entityId: scheduleDialogItem.amcId,
        entityNo: scheduleDialogItem.contractNo || scheduleDialogItem.reference,
        clientName: scheduleDialogItem.clientName,
        title: `${scheduleDialogItem.title} — ${scheduleDialogItem.visitSlot}`,
        scheduleType: "AMC Visit",
        scheduledDate: new Date(schedDate).toISOString(),
        status: "Scheduled",
        assignedStaffIds: schedStaffIds,
        assignedTo: staffNames,
        notes: schedNotes,
      });

      if (res.success) {
        toast.success("Visit scheduled successfully");
        setScheduleDialogItem(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule visit");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Status helpers ─────────────────────────────────────────────────────────

  const scheduleStatusTone = (status: string): "muted" | "pink" | "amber" | "green" | "blue" => {
    if (status === "Scheduled") return "pink";
    if (status === "Pending") return "amber";
    if (status === "In Progress") return "blue";
    if (status === "Completed") return "green";
    return "muted";
  };

  const contractStatusTone = (status?: string): "green" | "amber" | "muted" => {
    if (status === "Active") return "green";
    if (status === "Due for Renewal") return "amber";
    return "muted";
  };

  const typeBadgeColor = (type: ScheduleType): string => {
    if (type === "AMC Visit") return "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400";
    if (type === "Complaint Resolution") return "text-red-700 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400";
    if (type === "Project") return "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400";
    if (type === "Minor Job") return "text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400";
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
      className: tableCellClass.medium,
    },
    {
      header: "Client",
      accessor: (row) => <TableClientCell name={row.clientName} subtitle={row.clientSubtitle} logoUrl={row.clientLogoUrl} />,
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
      accessor: (row) => <TableStatusBadge label={row.status} tone={scheduleStatusTone(row.status)} />,
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
          onClick={(e) => { e.stopPropagation(); handleRowClick(row); }}
        >
          <Eye className="h-3.5 w-3.5" />View
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
            secondaryClassName="text-[11px] text-muted-foreground font-medium"
          />
        </div>
      ),
      className: tableCellClass.medium,
    },
    {
      header: "AMC Contract",
      accessor: (row) => (
        <TablePrimarySecondary
          primary={row.reference}
          secondary={row.eventSubtitle ?? row.title}
        />
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Client",
      accessor: (row) => <TableClientCell name={row.clientName} subtitle={row.clientSubtitle} logoUrl={row.clientLogoUrl} />,
      className: tableCellClass.wide,
    },
    {
      header: "Status",
      accessor: (row) => (
        <TableStatusBadge
          label={row.contractStatus ?? "Active"}
          tone={contractStatusTone(row.contractStatus)}
        />
      ),
      className: tableCellClass.narrow,
    },
    {
      header: <span className="sr-only">Actions</span>,
      className: "w-[200px]",
      accessor: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] font-semibold gap-1 border-green-200 text-green-700 hover:bg-green-50 px-2.5"
            onClick={() => openScheduleDialog(row)}
          >
            <CalendarPlus className="h-3.5 w-3.5" />Schedule Visit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] font-semibold gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 px-2.5"
            onClick={() => row.amcId && navigate(AppRoute.AMC_DETAIL.replace(":id", row.amcId))}
          >
            <Eye className="h-3.5 w-3.5" />View AMC
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    visits: visitItems.filter((i) => i.status !== "Completed" && i.status !== "Cancelled").length,
    followups: followUpItems.filter((i) => i.status !== "Completed" && i.status !== "Cancelled").length,
    preferred: preferredItems.length,
  }), [visitItems, followUpItems, preferredItems]);

  // Follow-up columns (same structure as visit columns with amber accent)
  const followUpColumns: Column<ScheduleItem>[] = [
    {
      header: "Follow-up Date",
      accessor: (row) => (
        <div className="flex items-start gap-2 min-w-0">
          <CalendarClock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <TablePrimarySecondary
            primary={fmtDate(row.date)}
            secondary={row.reference}
            primaryClassName="text-sm font-semibold text-amber-600 whitespace-nowrap"
            secondaryClassName="text-[11px] text-muted-foreground font-medium"
          />
        </div>
      ),
      className: tableCellClass.medium,
    },
    {
      header: "Client",
      accessor: (row) => <TableClientCell name={row.clientName} subtitle={row.clientSubtitle} logoUrl={row.clientLogoUrl} />,
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
      accessor: (row) => <TableStatusBadge label={row.status} tone={scheduleStatusTone(row.status)} />,
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
          onClick={(e) => { e.stopPropagation(); if (row.scheduleId) navigate(`/schedules/${row.scheduleId}`); }}
        >
          <Eye className="h-3.5 w-3.5" />View
        </Button>
      ),
    },
  ];

  const currentColumns =
    activeTab === "visits" ? visitColumns :
    activeTab === "followups" ? followUpColumns :
    preferredColumns;

  // Chip filter options: visits = status, followups = status, preferred = contract status
  const currentFilterOptions =
    activeTab === "visits"
      ? [
          { value: "all", label: "All", count: visitStats.all, tone: "primary" as const },
          { value: "Scheduled", label: "Scheduled", count: visitStats.scheduled, tone: "pink" as const },
          { value: "In Progress", label: "In Progress", count: visitStats.inProgress, tone: "blue" as const },
          { value: "Completed", label: "Completed", count: visitStats.completed, tone: "green" as const },
          { value: "Cancelled", label: "Cancelled", count: visitStats.cancelled, tone: "muted" as const },
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
        ];

  const currentFilterValue =
    activeTab === "visits" ? visitStatusFilter :
    activeTab === "followups" ? followUpFilter :
    preferredFilter;

  const handleFilterChange = (v: string) => {
    if (activeTab === "visits") setVisitStatusFilter(v as VisitStatusFilter);
    else if (activeTab === "followups") setFollowUpFilter(v as FollowUpStatusFilter);
    else setPreferredFilter(v as PreferredContractFilter);
  };

  const staffNameById = staffList.reduce((acc, curr) => {
    const sid = curr.id || curr._id;
    if (sid) acc[sid] = curr.fullName;
    return acc;
  }, {} as Record<string, string>);

  const emptyMessages: Record<ScheduleTab, string> = {
    visits: "No visit schedules found. Visit schedules are created from AMC, enquiry, complaint, project, or minor job detail pages.",
    followups: "No follow-up schedules found. Follow-ups are added from entity detail pages (enquiry, complaint, AMC, project, etc.).",
    preferred: "No upcoming preferred AMC visits. Preferred visit dates are computed from active AMC contracts.",
  };

  return (
    <>
      <ManagementListPage
        title="Schedules"
        subtitle="Manage service visit schedules and upcoming AMC preferred visit dates"
        toolbar={
          <Tabs
            value={activeTab}
            onValueChange={(v) => { setActiveTab(v as ScheduleTab); setCurrentPage(1); }}
          >
            <TabsList className="w-full h-12 bg-transparent p-0 rounded-none inline-flex flex-nowrap justify-start gap-6 border-b border-border pb-0 mb-1">
              <TabsTrigger value="visits" className={tabTriggerClass}>
                <CalendarClock className="h-4 w-4" />
                Visit Schedules
                <span className="tabular-nums text-muted-foreground font-semibold">({counts.visits})</span>
              </TabsTrigger>
              <TabsTrigger value="followups" className={tabTriggerClass}>
                <CalendarClock className="h-4 w-4" />
                Follow-up Schedules
                <span className="tabular-nums text-muted-foreground font-semibold">({counts.followups})</span>
              </TabsTrigger>
              <TabsTrigger value="preferred" className={tabTriggerClass}>
                <CalendarDays className="h-4 w-4" />
                AMC Preferred Visits
                <span className="tabular-nums text-muted-foreground font-semibold">({counts.preferred})</span>
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
        onRowClick={handleRowClick}
        emptyMessage={emptyMessages[activeTab]}
        entityLabel={activeTab === "visits" ? "visit schedules" : activeTab === "followups" ? "follow-up schedules" : "preferred visits"}
        filterOptions={currentFilterOptions}
        filterValue={currentFilterValue}
        onFilterChange={handleFilterChange}
        extraFilters={
          activeTab === "visits" ? (
            <Select
              value={visitTypeFilter}
              onValueChange={(v) => { setVisitTypeFilter(v as VisitTypeFilter); setCurrentPage(1); }}
            >
              <SelectTrigger className="!h-11 !rounded-xl !px-4 text-sm w-[180px] border-input">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types ({visitStats.all})</SelectItem>
                <SelectItem value="AMC Visit">AMC Visit ({visitStats.amc})</SelectItem>
                <SelectItem value="Site Visit">Site Visit ({visitStats.site})</SelectItem>
                <SelectItem value="Complaint Resolution">Complaints ({visitStats.complaint})</SelectItem>
                <SelectItem value="Project">Project ({visitStats.project})</SelectItem>
                <SelectItem value="Minor Job">Minor Job ({visitStats.minorJob})</SelectItem>
              </SelectContent>
            </Select>
          ) : null
        }
        onClearFilter={() => handleFilterChange("all")}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {/* Schedule Visit Dialog */}
      <Dialog open={!!scheduleDialogItem} onOpenChange={(open) => !open && setScheduleDialogItem(null)}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <CalendarPlus className="h-4 w-4 text-green-600" />
              Schedule AMC Visit
            </DialogTitle>
          </DialogHeader>
          {scheduleDialogItem && (
            <form onSubmit={handleScheduleVisit} className="space-y-4 mt-2">
              {/* Info card */}
              <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5 text-xs space-y-1">
                <div className="font-bold text-foreground">{scheduleDialogItem.reference} — {scheduleDialogItem.visitSlot}</div>
                <div className="text-muted-foreground">{scheduleDialogItem.clientName}</div>
                <div className="text-muted-foreground">{scheduleDialogItem.title}</div>
                <div className="text-blue-600 font-semibold">Preferred date: {fmtDate(scheduleDialogItem.date)}</div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="schedDate" className="text-xs font-semibold">Visit Date *</Label>
                <Input
                  id="schedDate"
                  type="date"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <StaffSelectDropdown
                  selected={schedStaffIds}
                  onChange={setSchedStaffIds}
                  label="Assign Staff"
                  placement="top"
                  nameById={staffNameById}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="schedNotes" className="text-xs font-semibold">Notes (Optional)</Label>
                <textarea
                  id="schedNotes"
                  value={schedNotes}
                  onChange={(e) => setSchedNotes(e.target.value)}
                  placeholder="Instructions or preparation notes..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink-600/30 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <Button type="button" variant="outline" size="sm" onClick={() => setScheduleDialogItem(null)} className="h-8 text-xs">Cancel</Button>
                <Button type="submit" size="sm" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs font-semibold gap-1.5">
                  {isSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Scheduling...</> : <><CalendarPlus className="h-3.5 w-3.5" />Schedule Visit</>}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  Plus,
  Calendar,
  User,
  AlertCircle,
  MoreVertical,
  Check,
  CheckCircle2,
  Eye,
  Loader2,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FolderDot,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { StaffSelectDropdown } from "../../components/StaffSelectDropdown";
import { FilterStatChips } from "../../components/FilterStatChips";

import {
  getSchedulesApi,
  createScheduleApi,
  updateScheduleApi,
  completeScheduleApi,
} from "../../api/schedule.api";
import { getComplaintsApi, updateComplaintApi } from "../../api/complaint.api";
import { getProjectsApi, updateProjectApi } from "../../api/project.api";
import { getMinorJobsApi, updateMinorJobApi } from "../../api/minorJob.api";
import { getStaffApi } from "../../api/staff.api";
import { Schedule } from "../../interfaces/schedule.interface";
import { Complaint } from "../../interfaces/complaint.interface";
import { Project } from "../../interfaces/project.interface";
import { MinorJob } from "../../interfaces/minorJob.interface";
import { toast } from "sonner";

// ─── Unified Task Interface ──────────────────────────────────────────────────

interface KanbanTask {
  id: string; // "schedule-<id>" | "complaint-<id>" | "project-<id>" | "minorjob-<id>"
  dbId: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignee: string;
  assignedStaffIds: string[];
  dueDate: string;
  type: "Schedule" | "Complaint" | "Project" | "Minor Job" | "Custom";
  stage: "todo" | "in-progress" | "review";
  reference: string;
  rawStatus: string;
  clientName: string;
  notes?: string;
  smrId?: string | null;
  entityType?: string;
}

interface Column {
  id: "todo" | "in-progress" | "review";
  title: string;
  color: string;
  borderColor: string;
}

const KANBAN_COLUMNS: Column[] = [
  { id: "todo", title: "To Do", color: "bg-slate-50/50 dark:bg-slate-900/40", borderColor: "border-t-blue-500" },
  { id: "in-progress", title: "In Progress", color: "bg-slate-50/50 dark:bg-slate-900/40", borderColor: "border-t-amber-500" },
  { id: "review", title: "Review / Completion", color: "bg-slate-50/50 dark:bg-slate-900/40", borderColor: "border-t-indigo-500" },
];

export function Kanban() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Custom Task Dialog
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskStaffIds, setTaskStaffIds] = useState<string[]>([]);
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Completion Dialog (Schedules)
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [completionDateInput, setCompletionDateInput] = useState("");
  const [completionTimeInput, setCompletionTimeInput] = useState("");
  const [completionNotesInput, setCompletionNotesInput] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  // ─── Data Loading ──────────────────────────────────────────────────────────

  const loadAllData = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const [schedulesRes, complaintsRes, projectsRes, minorJobsRes, staffRes] = await Promise.all([
        getSchedulesApi({ limit: 1000 }),
        getComplaintsApi({ limit: 1000 }),
        getProjectsApi({ limit: 1000 }),
        getMinorJobsApi({ limit: 1000 }),
        getStaffApi({ limit: 200, activeOnly: true }),
      ]);

      if (staffRes.success) setStaffList(staffRes.data);

      const loadedTasks: KanbanTask[] = [];

      // 1. Map Schedules
      if (schedulesRes.success) {
        schedulesRes.data.forEach((s) => {
          // Check completed/cancelled logic
          const isCompletedWithSMR = s.status === "Completed" && s.smrId;
          const isCancelled = s.status === "Cancelled";
          if (isCompletedWithSMR || isCancelled) return;

          let stage: KanbanTask["stage"] = "todo";
          if (s.status === "In Progress") {
            stage = "in-progress";
          } else if (s.status === "Pending" || s.status === "Completed") {
            stage = "review";
          }

          const isCustom = s.entityId === "custom";

          loadedTasks.push({
            id: `schedule-${s.id}`,
            dbId: s.id!,
            title: s.title,
            description: s.notes || "",
            priority: "Medium", // Schedules default to Medium, can map if needed
            assignee: s.assignedTo?.join(", ") || "Unassigned",
            assignedStaffIds: s.assignedStaffIds || [],
            dueDate: s.scheduledDate ? s.scheduledDate.split("T")[0] : "",
            type: isCustom ? "Custom" : "Schedule",
            stage,
            reference: isCustom ? "CUSTOM" : s.entityNo,
            rawStatus: s.status,
            clientName: s.clientName,
            notes: s.notes,
            smrId: s.smrId,
            entityType: s.entityType,
          });
        });
      }

      // 2. Map Complaints
      if (complaintsRes.success) {
        complaintsRes.data.forEach((c) => {
          if (c.status === "Resolved") return; // complete resolution is hidden

          let stage: KanbanTask["stage"] = "todo";
          if (c.status === "In Progress") stage = "in-progress";

          loadedTasks.push({
            id: `complaint-${c.id}`,
            dbId: c.id!,
            title: c.issue,
            description: c.description || "",
            priority: (c.priority as any) || "Medium",
            assignee: c.assignedTo?.join(", ") || "Unassigned",
            assignedStaffIds: c.assignedStaffIds || [],
            dueDate: c.expectedResolution ? c.expectedResolution.split("T")[0] : "",
            type: "Complaint",
            stage,
            reference: c.complaintNo,
            rawStatus: c.status,
            clientName: c.clientName,
          });
        });
      }

      // 3. Map Projects
      if (projectsRes.success) {
        projectsRes.data.forEach((p) => {
          if (p.status === "Completed") return;

          let stage: KanbanTask["stage"] = "todo";
          if (p.status === "Active") stage = "in-progress";

          loadedTasks.push({
            id: `project-${p.id}`,
            dbId: p.id!,
            title: p.name,
            description: `Value: ₹${p.value.toLocaleString("en-IN")}`,
            priority: "High",
            assignee: "Manager",
            assignedStaffIds: [],
            dueDate: p.expectedCompletionDate ? p.expectedCompletionDate.split("T")[0] : "",
            type: "Project",
            stage,
            reference: p.projectNo,
            rawStatus: p.status,
            clientName: typeof p.clientRef === "object" && p.clientRef ? p.clientRef.companyName : "—",
          });
        });
      }

      // 4. Map Minor Jobs
      if (minorJobsRes.success) {
        minorJobsRes.data.forEach((j) => {
          if (j.status === "Completed") return;

          let stage: KanbanTask["stage"] = "todo";
          if (j.status === "In Progress") stage = "in-progress";

          loadedTasks.push({
            id: `minorjob-${j.id}`,
            dbId: j.id!,
            title: j.description,
            description: `Scheduled Date: ${j.scheduledDate ? new Date(j.scheduledDate).toLocaleDateString() : "—"}`,
            priority: "Medium",
            assignee: j.assignedTo || "Unassigned",
            assignedStaffIds: j.assignedStaffId ? [j.assignedStaffId] : [],
            dueDate: j.scheduledDate ? j.scheduledDate.split("T")[0] : "",
            type: "Minor Job",
            stage,
            reference: j.jobNo,
            rawStatus: j.status,
            clientName: typeof j.clientRef === "object" && j.clientRef ? j.clientRef.companyName : "—",
          });
        });
      }

      setTasks(loadedTasks);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load Kanban tasks");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData(true);
  }, [loadAllData]);

  // ─── Task Transition Logic ─────────────────────────────────────────────────

  const handleTransition = async (task: KanbanTask, targetStage: KanbanTask["stage"]) => {
    if (task.stage === targetStage) return;

    // Handle Schedule completion when moving to review
    if ((task.type === "Schedule" || task.type === "Custom") && targetStage === "review") {
      setCompleteTaskId(task.id);
      const now = new Date();
      setCompletionDateInput(now.toISOString().split("T")[0]);
      setCompletionTimeInput(now.toTimeString().slice(0, 5));
      setCompletionNotesInput("");
      setCompletionFiles([]);
      return;
    }

    try {
      let success = false;
      const dbId = task.dbId;

      if (task.type === "Schedule" || task.type === "Custom") {
        let newStatus: Schedule["status"] = "Scheduled";
        if (targetStage === "in-progress") newStatus = "In Progress";
        else if (targetStage === "todo") newStatus = "Scheduled";

        const res = await updateScheduleApi(dbId, { status: newStatus });
        success = res.success;
      } else if (task.type === "Complaint") {
        let newStatus: Complaint["status"] = "Pending";
        if (targetStage === "in-progress") newStatus = "In Progress";
        else if (targetStage === "review") newStatus = "Resolved";

        const res = await updateComplaintApi(dbId, { status: newStatus });
        success = res.success;
      } else if (task.type === "Project") {
        let newStatus = "Planning";
        if (targetStage === "in-progress") newStatus = "Active";
        else if (targetStage === "review") newStatus = "Completed";

        const res = await updateProjectApi(dbId, { status: newStatus as any });
        success = res.success;
      } else if (task.type === "Minor Job") {
        let newStatus = "Open";
        if (targetStage === "in-progress") newStatus = "In Progress";
        else if (targetStage === "review") newStatus = "Completed";

        const res = await updateMinorJobApi(dbId, { status: newStatus as any });
        success = res.success;
      }

      if (success) {
        toast.success(`Task stage updated successfully`);
        loadAllData(false);
      } else {
        toast.error("Failed to sync stage transition");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task stage");
    }
  };

  // ─── Drag & Drop Handlers ──────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: KanbanTask["stage"]) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData("taskId") || draggedTaskId;
    setDraggedTaskId(null);

    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.stage === targetColumnId) return;

    await handleTransition(task, targetColumnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  // ─── Add Custom Task ───────────────────────────────────────────────────────

  const handleAddCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate) {
      toast.error("Title and Due Date are required");
      return;
    }
    setIsSavingTask(true);
    try {
      const selectedStaffNames = taskStaffIds
        .map((sid) => staffList.find((s) => (s.id || s._id) === sid)?.fullName)
        .filter(Boolean);

      const res = await createScheduleApi({
        entityType: "project", // dummy entity required by DB validator
        entityId: "custom",
        entityNo: "CUSTOM",
        clientName: "Internal Tasks",
        title: taskTitle,
        scheduleType: "Follow-up",
        scheduledDate: new Date(taskDueDate).toISOString(),
        status: "Scheduled",
        assignedStaffIds: taskStaffIds,
        assignedTo: selectedStaffNames,
        notes: taskDescription.trim(),
      });

      if (res.success) {
        toast.success("Custom task added to board");
        setIsAddTaskOpen(false);
        setTaskTitle("");
        setTaskDescription("");
        setTaskDueDate("");
        setTaskStaffIds([]);
        loadAllData(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create custom task");
    } finally {
      setIsSavingTask(false);
    }
  };

  // ─── Schedule Completion Dialog Submit ─────────────────────────────────────

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTaskId || !completionDateInput) return;

    setIsCompleting(true);
    const targetTask = tasks.find((t) => t.id === completeTaskId);
    if (!targetTask) {
      setIsCompleting(false);
      return;
    }

    try {
      const completedAt = new Date(`${completionDateInput}T${completionTimeInput || "00:00"}`).toISOString();

      const res = await completeScheduleApi(targetTask.dbId, {
        completedAt,
        completionNotes: completionNotesInput.trim(),
        files: completionFiles,
      });

      if (res.success) {
        toast.success("Task completed successfully");
        setCompleteTaskId(null);
        loadAllData(false);

        // Optional SMR creation helper logic
        if (targetTask.type === "Schedule" && targetTask.entityType === "amc") {
          toast("Would you like to create an SMR report?", {
            action: {
              label: "Create SMR",
              onClick: () => navigate(`/amc/${targetTask.clientName}/visits/${targetTask.dbId}/smr/create`),
            },
            duration: 8000,
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete task");
    } finally {
      setIsCompleting(false);
    }
  };

  // ─── Helper Mappers ────────────────────────────────────────────────────────

  const getTypeStyle = (type: string) => {
    const map: Record<string, string> = {
      Schedule: "bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30",
      Complaint: "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
      Project: "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30",
      "Minor Job": "bg-teal-500/10 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30",
      Custom: "bg-pink-500/10 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30",
    };
    return map[type] ?? "bg-muted text-muted-foreground border-border";
  };

  const getPriorityStyle = (priority: string) => {
    const map: Record<string, string> = {
      Critical: "bg-red-650 text-white font-bold border-transparent",
      High: "bg-orange-500/10 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30",
      Medium: "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
      Low: "bg-slate-500/10 text-slate-600 border-slate-200 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/30",
    };
    return map[priority] ?? "bg-muted text-muted-foreground border-border";
  };

  const staffNameById = useMemo(() => {
    return staffList.reduce((acc, curr) => {
      const sid = curr.id || curr._id;
      if (sid) acc[sid] = curr.fullName;
      return acc;
    }, {} as Record<string, string>);
  }, [staffList]);

  // ─── Filtering ─────────────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.clientName && t.clientName.toLowerCase().includes(q)) ||
          (t.reference && t.reference.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tasks, typeFilter, priorityFilter, searchQuery]);

  const currentFilterOptions = useMemo(() => {
    const baseTasks = tasks.filter((t) => {
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          (t.clientName && t.clientName.toLowerCase().includes(q)) ||
          (t.reference && t.reference.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return [
      { value: "all", label: "All Tasks", count: baseTasks.length, tone: "pink" as const },
      { value: "Schedule", label: "Schedules", count: baseTasks.filter((t) => t.type === "Schedule").length, tone: "blue" as const },
      { value: "Complaint", label: "Complaints", count: baseTasks.filter((t) => t.type === "Complaint").length, tone: "red" as const },
      { value: "Project", label: "Projects", count: baseTasks.filter((t) => t.type === "Project").length, tone: "green" as const },
      { value: "Minor Job", label: "Minor Jobs", count: baseTasks.filter((t) => t.type === "Minor Job").length, tone: "amber" as const },
      { value: "Custom", label: "Custom Tasks", count: baseTasks.filter((t) => t.type === "Custom").length, tone: "muted" as const },
    ];
  }, [tasks, priorityFilter, searchQuery]);

  const tasksByColumn = useMemo(() => {
    return {
      todo: filteredTasks.filter((t) => t.stage === "todo"),
      "in-progress": filteredTasks.filter((t) => t.stage === "in-progress"),
      review: filteredTasks.filter((t) => t.stage === "review"),
    };
  }, [filteredTasks]);

  const stats = useMemo(() => {
    return {
      total: filteredTasks.length,
      todo: filteredTasks.filter((t) => t.stage === "todo").length,
      inProgress: filteredTasks.filter((t) => t.stage === "in-progress").length,
      review: filteredTasks.filter((t) => t.stage === "review").length,
    };
  }, [filteredTasks]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-pink-700" />
        <span className="text-sm">Loading task board...</span>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Kanban Task Board</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Concurrently synchronized task workspace across schedules, complaints, projects, and custom works.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadAllData(true)}
            className="h-9 gap-1.5 border-border hover:bg-muted text-muted-foreground hover:text-foreground font-semibold text-sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsAddTaskOpen(true)}
            className="bg-pink-700 hover:bg-pink-800 text-white font-semibold h-9 gap-1.5 transition-all text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Custom Task
          </Button>
        </div>
      </div>

      {/* Main Card Wrapper */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 space-y-4">
        {/* Search & Priority Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search tasks by title, client, or reference number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-lg text-sm"
            />
          </div>
          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
          >
            <SelectTrigger className="!h-11 rounded-lg px-4 text-sm w-[180px] border-input">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter Chips */}
        <FilterStatChips
          options={currentFilterOptions}
          value={typeFilter}
          onChange={setTypeFilter}
        />

        {/* Column Boards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          {KANBAN_COLUMNS.map((column) => {
            const colTasks = tasksByColumn[column.id] || [];
            const isOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className={`flex flex-col min-h-[550px] rounded-lg border border-border border-t-4 ${column.borderColor} ${column.color} transition-all ${
                  isOver ? "ring-2 ring-pink-500/20 bg-pink-500/5" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragLeave={handleDragLeave}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/10 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm tracking-wide">{column.title}</h3>
                    <span className="text-xs font-bold text-muted-foreground bg-background border border-border px-2.5 py-0.5 rounded-full shadow-2xs">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
                  {colTasks.length === 0 ? (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-5 opacity-40 border border-dashed border-border/50 rounded-xl bg-card/10">
                      <AlertCircle className="h-7 w-7 text-muted-foreground mb-1.5" />
                      <p className="text-xs font-semibold">No active tasks here</p>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="bg-card rounded-lg border border-border p-3 h-[160px] flex flex-col justify-between shadow-sm hover:shadow-md hover:border-pink-650/40 dark:hover:border-pink-900/50 transition-all cursor-grab active:cursor-grabbing group relative"
                      >
                        {/* Section 1: Reference and navigation */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5 min-w-0">
                            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase bg-muted/60 px-1.5 py-0.5 rounded border border-border/30 shrink-0">
                              {task.reference}
                            </span>

                            {/* Transitions Navigation Buttons */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {column.id !== "todo" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                                  title="Move back"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const prev: Record<string, KanbanTask["stage"]> = {
                                      "in-progress": "todo",
                                      review: "in-progress",
                                    };
                                    handleTransition(task, prev[column.id]);
                                  }}
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </Button>
                              )}
                              {column.id !== "review" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                                  title="Move forward"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next: Record<string, KanbanTask["stage"]> = {
                                      todo: "in-progress",
                                      "in-progress": "review",
                                    };
                                    handleTransition(task, next[column.id]);
                                  }}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <h4 className="font-semibold text-foreground text-xs leading-snug group-hover:text-pink-700 transition-colors line-clamp-1 pr-6" title={task.title}>
                            {task.title}
                          </h4>
                        </div>

                        {/* Section 2: Client Subtitle & Description */}
                        <div className="space-y-1 min-w-0">
                          {task.clientName && (
                            <div className="text-[10px] text-muted-foreground truncate font-medium bg-muted/40 px-2 py-0.5 rounded border border-border/20 w-fit">
                              Client: <span className="font-semibold text-foreground">{task.clientName}</span>
                            </div>
                          )}
                          {task.description ? (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 leading-normal">
                              {task.description}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground/40 italic">No details provided</p>
                          )}
                        </div>

                        {/* Section 3: Badges/Tags */}
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wide shrink-0 ${getTypeStyle(task.type)}`}>
                            {task.type}
                          </span>
                          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wide shrink-0 ${getPriorityStyle(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Section 4: Card Footer */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-border/30 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="h-3 w-3 text-pink-700 shrink-0" />
                            <span className="text-[10px] font-medium text-muted-foreground truncate" title={task.assignee}>
                              {task.assignee}
                            </span>
                          </div>

                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold shrink-0">
                              <Calendar className="h-3 w-3 text-pink-650" />
                              {new Date(task.dueDate).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          )}
                        </div>

                        {/* View Details Link Overlay */}
                        {task.type !== "Custom" && (
                          <div className="absolute right-2 top-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6 border-pink-200 text-pink-700 hover:bg-pink-50"
                              asChild
                              title="Open Detail Page"
                            >
                              <Link to={
                                task.type === "Complaint"
                                  ? `/complaints/${task.dbId}`
                                  : task.type === "Project"
                                  ? `/projects/${task.dbId}`
                                  : task.type === "Minor Job"
                                  ? `/minor-jobs/${task.dbId}`
                                  : `/schedules/${task.dbId}`
                              }>
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-pink-700" />
              Add Custom Task
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddCustomTask} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">Task Title *</Label>
              <Input
                id="title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task description or checklist..."
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dueDate" className="text-xs font-semibold">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Priority</Label>
                <Select
                  value={taskPriority}
                  onValueChange={(val) => setTaskPriority(val as any)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <StaffSelectDropdown
                selected={taskStaffIds}
                onChange={setTaskStaffIds}
                label="Assign Staff"
                placement="top"
                nameById={staffNameById}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-semibold">Description / Notes (Optional)</Label>
              <Textarea
                id="desc"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Add checklist, notes, context..."
                className="text-xs min-h-[70px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddTaskOpen(false)} className="h-8 text-xs">Cancel</Button>
              <Button type="submit" size="sm" disabled={isSavingTask} className="bg-pink-700 hover:bg-pink-800 text-white h-8 text-xs font-semibold gap-1.5">
                {isSavingTask ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : <><Plus className="h-3.5 w-3.5" />Add Task</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mark Complete Dialog (Schedules) */}
      <Dialog open={completeTaskId !== null} onOpenChange={(open) => !open && setCompleteTaskId(null)}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />Mark Schedule as Completed
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCompleteSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="completionDate" className="text-xs font-semibold text-foreground">
                  Completion Date *
                </Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={completionDateInput}
                  onChange={(e) => setCompletionDateInput(e.target.value)}
                  className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="completionTime" className="text-xs font-semibold text-foreground">
                  Time
                </Label>
                <Input
                  id="completionTime"
                  type="time"
                  value={completionTimeInput}
                  onChange={(e) => setCompletionTimeInput(e.target.value)}
                  className="h-9 text-xs [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="completionNotes" className="text-xs font-semibold text-foreground">
                Completion Notes (Optional)
              </Label>
              <Textarea
                id="completionNotes"
                placeholder="Work done, outcomes, observations..."
                value={completionNotesInput}
                onChange={(e) => setCompletionNotesInput(e.target.value)}
                className="text-xs min-h-[80px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="completionFiles" className="text-xs font-semibold text-foreground">
                Completion Images / Attachments (Optional)
              </Label>
              <Input
                id="completionFiles"
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    setCompletionFiles(Array.from(files));
                  } else {
                    setCompletionFiles([]);
                  }
                }}
                className="border-0 bg-transparent shadow-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 file:bg-pink-50 file:text-pink-700 file:border-0 file:rounded-md file:px-3 file:py-1.5 file:mr-3 hover:file:bg-pink-100 dark:file:bg-pink-950/40 dark:file:text-pink-400 cursor-pointer"
              />
              {completionFiles.length > 0 && (
                <div className="text-[10px] text-muted-foreground bg-muted/20 p-2 rounded-lg border border-border/40 mt-1.5 space-y-1">
                  <p className="font-semibold uppercase tracking-wider text-[9px]">Selected Files ({completionFiles.length}):</p>
                  <div className="max-h-[80px] overflow-y-auto space-y-1 pr-1">
                    {completionFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 bg-card px-2 py-1 rounded border border-border/30">
                        <span className="truncate max-w-[200px] font-medium text-foreground">{file.name}</span>
                        <span className="shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCompleteTaskId(null)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCompleting}
                className="bg-pink-700 hover:bg-pink-800 text-white h-8 text-xs font-semibold"
              >
                {isCompleting ? "Saving..." : "Mark as Completed"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

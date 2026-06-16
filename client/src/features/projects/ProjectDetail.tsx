import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Building,
  IndianRupee,
  FolderKanban,
  Handshake,
  Loader2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Upload,
  Download,
  ListTodo,
  ShoppingBag,
  ShieldCheck,
  Link as LinkIcon,
  Trash
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Schedules } from "../../components/Schedules";
import { RemarksChat } from "../../components/RemarksChat";
import { toast } from "sonner";

// APIs
import { getProjectByIdApi, updateProjectApi, uploadProjectHandoverApi } from "../../api/project.api";
import { getProjectTasksApi, createProjectTaskApi, updateProjectTaskApi, deleteProjectTaskApi } from "../../api/projectTask.api";
import { getSubcontractsApi, createSubcontractApi, updateSubcontractApi, deleteSubcontractApi, uploadSubcontractReportApi } from "../../api/subcontract.api";
import { getPurchaseOrdersApi, createPurchaseOrderApi, updatePurchaseOrderApi, deletePurchaseOrderApi, uploadPurchaseOrderPdfApi } from "../../api/purchaseOrder.api";

import { getQuotationByIdApi } from "../../api/quotation.api";
import { getStaffApi } from "../../api/staff.api";
import { addRemarkApi } from "../../api/remark.api";

// Interfaces
import { Project } from "../../interfaces/project.interface";
import { ProjectTask } from "../../interfaces/projectTask.interface";
import { Subcontract } from "../../interfaces/subcontract.interface";
import { PurchaseOrder } from "../../interfaces/purchaseOrder.interface";
import { Quotation } from "../../interfaces/quotation.interface";
import { Staff } from "../../interfaces/staff.interface";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Planning: "bg-blue-500/10 text-blue-500",
    Active: "bg-green-500/10 text-green-500",
    "On Hold": "bg-amber-500/10 text-amber-500",
    Completed: "bg-muted text-muted-foreground",
  };
  return colors[status] ?? "bg-muted text-muted-foreground";
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New States for Sub-resources
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [subcontracts, setSubcontracts] = useState<Subcontract[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [linkedQuotation, setLinkedQuotation] = useState<Quotation | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // Project Completion Dialog State
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [actualCompletionDate, setActualCompletionDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isCompleting, setIsCompleting] = useState(false);

  // Handover Doc Upload States
  const [isUploadingHandover, setIsUploadingHandover] = useState(false);
  const handoverInputRef = useRef<HTMLInputElement>(null);

  // Task Dialog States
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [taskStatus, setTaskStatus] = useState<"Todo" | "In Progress" | "Review" | "Completed">("Todo");
  const [taskAssignedStaffId, setTaskAssignedStaffId] = useState("none");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskCompletedNotes, setTaskCompletedNotes] = useState("");
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Completed Notes Prompt State for drag-and-drop
  const [isTaskCompletePromptOpen, setIsTaskCompletePromptOpen] = useState(false);
  const [promptTaskId, setPromptTaskId] = useState("");
  const [promptTargetStatus, setPromptTargetStatus] = useState<"Todo" | "In Progress" | "Review" | "Completed">("Completed");
  const [promptNotes, setPromptNotes] = useState("");

  // Subcontract Dialog States
  const [isSubcontractDialogOpen, setIsSubcontractDialogOpen] = useState(false);
  const [editingSubcontract, setEditingSubcontract] = useState<Subcontract | null>(null);
  const [subcontractorName, setSubcontractorName] = useState("");
  const [subcontractScope, setSubcontractScope] = useState("");
  const [subcontractValue, setSubcontractValue] = useState(0);
  const [subcontractStatus, setSubcontractStatus] = useState<"Pending" | "Active" | "Completed">("Pending");
  const [isSavingSubcontract, setIsSavingSubcontract] = useState(false);

  // Purchase Order Dialog States
  const [isPoDialogOpen, setIsPoDialogOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [poVendorName, setPoVendorName] = useState("");
  const [poStatus, setPoStatus] = useState<"Pending" | "Approved" | "Ordered" | "Delivered">("Pending");
  const [poItems, setPoItems] = useState<Array<{ description: string; qty: number; rate: number; total: number }>>([
    { description: "", qty: 1, rate: 0, total: 0 }
  ]);
  const [isSavingPo, setIsSavingPo] = useState(false);
  const [poFile, setPoFile] = useState<File | null>(null);
  const [subcontractFile, setSubcontractFile] = useState<File | null>(null);

  // Project Edit Dialog States
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStartDate, setEditProjectStartDate] = useState("");
  const [editProjectExpectedCompletionDate, setEditProjectExpectedCompletionDate] = useState("");
  const [editProjectValue, setEditProjectValue] = useState<number>(0);
  const [isSavingProjectDetails, setIsSavingProjectDetails] = useState(false);


  useEffect(() => {
    async function loadProject() {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await getProjectByIdApi(id);
        if (res.success) {
          setProject(res.data);
          if (res.data.quotationRef) {
            try {
              const qRes = await getQuotationByIdApi(res.data.quotationRef);
              if (qRes.success) {
                setLinkedQuotation(qRes.data);
              }
            } catch (qErr) {
              console.error("Failed to load linked quotation", qErr);
            }
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [id]);

  useEffect(() => {
    async function loadProjectSubData() {
      if (!id) return;
      try {
        const [tasksRes, subRes, poRes, staffRes] = await Promise.all([
          getProjectTasksApi(id),
          getSubcontractsApi(id),
          getPurchaseOrdersApi(id),
          getStaffApi({ limit: 200, activeOnly: true })
        ]);
        if (tasksRes.success) setTasks(tasksRes.data);
        if (subRes.success) setSubcontracts(subRes.data);
        if (poRes.success) setPurchaseOrders(poRes.data);
        if (staffRes.success) setStaffList(staffRes.data);
      } catch (err) {
        console.error("Failed to load project sub-resources", err);
      }
    }
    if (project) {
      loadProjectSubData();
    }
  }, [id, project]);

  // Reload Helpers
  const reloadTasks = async () => {
    if (!id) return;
    const res = await getProjectTasksApi(id);
    if (res.success) setTasks(res.data);
  };

  const reloadSubcontracts = async () => {
    if (!id) return;
    const res = await getSubcontractsApi(id);
    if (res.success) setSubcontracts(res.data);
  };

  const reloadPos = async () => {
    if (!id) return;
    const res = await getPurchaseOrdersApi(id);
    if (res.success) setPurchaseOrders(res.data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
        <span className="text-sm">Project not found</span>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const clientName = typeof project.clientRef === "object" ? project.clientRef.companyName : "Unknown Client";
  const contactPerson = typeof project.clientRef === "object" ? project.clientRef.contactPerson : "—";
  const clientPhone = typeof project.clientRef === "object" ? project.clientRef.phone : "";
  const clientEmail = typeof project.clientRef === "object" ? project.clientRef.email : "";
  const clientLocation = typeof project.clientRef === "object"
    ? `${project.clientRef.address || ""}, ${project.clientRef.city}`
    : "—";

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "Completed") {
      setCompletionNotes("");
      setIsCompleteDialogOpen(true);
      return;
    }

    try {
      const res = await updateProjectApi(project.id, { status: newStatus as any });
      if (res.success) {
        setProject(res.data);
        toast.success("Status updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update project status");
    }
  };

  const handleCompleteProject = async () => {
    setIsCompleting(true);
    try {
      const res = await updateProjectApi(project.id, {
        status: "Completed",
        actualCompletionDate: new Date(actualCompletionDate).toISOString()
      });
      if (res.success) {
        setProject(res.data);
        if (completionNotes.trim()) {
          try {
            await addRemarkApi("project", project.id, `Project Completed. Notes: ${completionNotes.trim()}`);
          } catch (remarkErr) {
            console.error("Failed to log completion remark", remarkErr);
          }
        }
        toast.success("Project marked as Completed");
        setIsCompleteDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete project");
    } finally {
      setIsCompleting(false);
    }
  };

  // Handover Document Operations
  const handleHandoverUploadClick = () => handoverInputRef.current?.click();

  const handleHandoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploadingHandover(true);
    try {
      const res = await uploadProjectHandoverApi(project.id, file);
      if (res.success) {
        setProject(res.data);
        toast.success("Handover report uploaded successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload handover report");
    } finally {
      setIsUploadingHandover(false);
    }
  };

  const handleDownloadHandover = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Task Dialog Operations
  const openAddTaskDialog = (colStatus: typeof taskStatus = "Todo") => {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDesc("");
    setTaskPriority("Medium");
    setTaskStatus(colStatus);
    setTaskAssignedStaffId("none");
    setTaskDueDate("");
    setTaskCompletedNotes("");
    setIsTaskDialogOpen(true);
  };

  const openEditTaskDialog = (t: ProjectTask) => {
    setEditingTask(t);
    setTaskTitle(t.title);
    setTaskDesc(t.description || "");
    setTaskPriority(t.priority);
    setTaskStatus(t.status);
    setTaskAssignedStaffId(t.assignedStaffId || "none");
    setTaskDueDate(t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "");
    setTaskCompletedNotes(t.completedWorkNotes || "");
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsSavingTask(true);
    try {
      const isAssigned = taskAssignedStaffId && taskAssignedStaffId !== "none";
      const staff = isAssigned ? staffList.find(s => (s.id || (s as any)._id) === taskAssignedStaffId) : undefined;
      const data: Partial<ProjectTask> = {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        priority: taskPriority,
        status: taskStatus,
        assignedStaffId: isAssigned ? taskAssignedStaffId : undefined,
        assignedTo: staff ? staff.fullName : undefined,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        completedWorkNotes: taskStatus === "Completed" ? taskCompletedNotes.trim() || undefined : undefined
      };

      let res;
      if (editingTask?.id) {
        res = await updateProjectTaskApi(project.id, editingTask.id, data);
      } else {
        res = await createProjectTaskApi(project.id, data);
      }

      if (res.success) {
        toast.success(editingTask ? "Task updated" : "Task created");
        setIsTaskDialogOpen(false);
        reloadTasks();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save task");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await deleteProjectTaskApi(project.id, taskId);
      if (res.success) {
        toast.success("Task deleted");
        reloadTasks();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetCol: typeof taskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    const t = tasks.find(x => x.id === taskId);
    if (!t || t.status === targetCol) return;

    if (targetCol === "Completed") {
      setPromptTaskId(taskId);
      setPromptTargetStatus(targetCol);
      setPromptNotes("");
      setIsTaskCompletePromptOpen(true);
    } else {
      try {
        const res = await updateProjectTaskApi(project.id, taskId, { status: targetCol });
        if (res.success) {
          toast.success(`Task moved to ${targetCol}`);
          reloadTasks();
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to move task");
      }
    }
  };

  const handleSavePromptNotes = async () => {
    try {
      const res = await updateProjectTaskApi(project.id, promptTaskId, {
        status: promptTargetStatus,
        completedWorkNotes: promptNotes.trim() || undefined
      });
      if (res.success) {
        toast.success("Task marked as Completed");
        setIsTaskCompletePromptOpen(false);
        reloadTasks();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete task");
    }
  };

  // Subcontract Dialog Operations
  const openAddSubcontractDialog = () => {
    setEditingSubcontract(null);
    setSubcontractorName("");
    setSubcontractScope("");
    setSubcontractValue(0);
    setSubcontractStatus("Pending");
    setSubcontractFile(null);
    setIsSubcontractDialogOpen(true);
  };

  const openEditSubcontractDialog = (sub: Subcontract) => {
    setEditingSubcontract(sub);
    setSubcontractorName(sub.contractorName);
    setSubcontractScope(sub.scopeOfWork);
    setSubcontractValue(sub.value);
    setSubcontractStatus(sub.status);
    setSubcontractFile(null);
    setIsSubcontractDialogOpen(true);
  };

  const handleSaveSubcontract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcontractorName.trim()) {
      toast.error("Contractor name is required");
      return;
    }
    if (!subcontractScope.trim()) {
      toast.error("Scope of work is required");
      return;
    }
    if (subcontractValue <= 0) {
      toast.error("Contract value must be greater than 0");
      return;
    }

    setIsSavingSubcontract(true);
    try {
      const data: Partial<Subcontract> = {
        contractorName: subcontractorName.trim(),
        scopeOfWork: subcontractScope.trim(),
        value: subcontractValue,
        status: subcontractStatus,
        completionReportUrl: editingSubcontract?.completionReportUrl || undefined
      };

      let res;
      if (editingSubcontract?.id) {
        res = await updateSubcontractApi(project.id, editingSubcontract.id, data);
      } else {
        res = await createSubcontractApi(project.id, data);
      }

      if (res.success) {
        toast.success(editingSubcontract ? "Subcontract updated" : "Subcontract added");
        setIsSubcontractDialogOpen(false);
        reloadSubcontracts();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save subcontract");
    } finally {
      setIsSavingSubcontract(false);
    }
  };

  const handleDeleteSubcontract = async (subId: string) => {
    if (!window.confirm("Are you sure you want to delete this subcontract?")) return;
    try {
      const res = await deleteSubcontractApi(project.id, subId);
      if (res.success) {
        toast.success("Subcontract deleted");
        reloadSubcontracts();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete subcontract");
    }
  };


  // Project Edit Handlers
  const openEditProjectDialog = () => {
    setEditProjectName(project?.name || "");
    setEditProjectStartDate(project?.startDate ? project.startDate.split("T")[0] : "");
    setEditProjectExpectedCompletionDate(project?.expectedCompletionDate ? project.expectedCompletionDate.split("T")[0] : "");
    setEditProjectValue(project?.value || 0);
    setIsEditProjectDialogOpen(true);
  };

  const handleSaveProjectDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;
    if (!editProjectName.trim()) {
      toast.error("Project name is required");
      return;
    }
    setIsSavingProjectDetails(true);
    try {
      const res = await updateProjectApi(project.id, {
        name: editProjectName.trim(),
        startDate: editProjectStartDate,
        expectedCompletionDate: editProjectExpectedCompletionDate || undefined,
        value: editProjectValue,
      });
      if (res.success) {
        toast.success("Project details updated successfully");
        setIsEditProjectDialogOpen(false);
        // Reload project
        const fresh = await getProjectByIdApi(project.id);
        if (fresh.success) setProject(fresh.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update project details");
    } finally {
      setIsSavingProjectDetails(false);
    }
  };

  // Subcontractor Report Upload Handler
  const handleUploadSubcontractReport = async (subId: string, file: File) => {
    if (!project?.id) return;
    try {
      const res = await uploadSubcontractReportApi(project.id, subId, file);
      if (res.success) {
        toast.success("Subcontractor completion report uploaded successfully");
        reloadSubcontracts();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload completion report");
    }
  };


  const openEditPoDialog = (po: PurchaseOrder) => {
    setEditingPo(po);
    setPoVendorName(po.vendorName);
    setPoStatus(po.status);
    setPoItems(po.items.map(item => ({
      description: item.description,
      qty: item.qty,
      rate: item.rate,
      total: item.total
    })));
    setPoFile(null);
    setIsPoDialogOpen(true);
  };

  // PO Dialog Operations
  const openAddPoDialog = () => {
    setEditingPo(null);
    setPoVendorName("");
    setPoStatus("Pending");
    setPoItems([{ description: "", qty: 1, rate: 0, total: 0 }]);
    setPoFile(null);
    setIsPoDialogOpen(true);
  };

  const addPoItemRow = () => {
    setPoItems([...poItems, { description: "", qty: 1, rate: 0, total: 0 }]);
  };

  const removePoItemRow = (idx: number) => {
    if (poItems.length === 1) return;
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handlePoItemChange = (idx: number, field: "description" | "qty" | "rate", val: any) => {
    const next = [...poItems];
    if (field === "description") {
      next[idx].description = val;
    } else if (field === "qty") {
      next[idx].qty = Math.max(1, Number(val));
      next[idx].total = next[idx].qty * next[idx].rate;
    } else if (field === "rate") {
      next[idx].rate = Math.max(0, Number(val));
      next[idx].total = next[idx].qty * next[idx].rate;
    }
    setPoItems(next);
  };

  const handleSavePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poVendorName.trim()) {
      toast.error("Vendor name is required");
      return;
    }

    const itemsValid = poItems.every(item => item.description.trim() && item.qty > 0 && item.rate >= 0);
    if (!itemsValid) {
      toast.error("All items must have a valid description, qty > 0 and rate >= 0");
      return;
    }

    const poAmount = poItems.reduce((acc, curr) => acc + curr.qty * curr.rate, 0);

    setIsSavingPo(true);
    try {
      const data = {
        vendorName: poVendorName.trim(),
        status: poStatus,
        amount: poAmount,
        items: poItems.map(item => ({
          description: item.description.trim(),
          qty: item.qty,
          rate: item.rate,
          total: item.qty * item.rate
        }))
      };

      let res;
      if (editingPo?.id) {
        res = await updatePurchaseOrderApi(project.id, editingPo.id, data);
      } else {
        res = await createPurchaseOrderApi(project.id, data);
      }

      if (res.success) {
        const poId = res.data.id || (res.data as any)._id;
        if (poFile && poId) {
          try {
            await uploadPurchaseOrderPdfApi(project.id, poId, poFile);
          } catch (uploadErr) {
            console.error("Document upload failed:", uploadErr);
            toast.error("Purchase order saved, but request document upload failed");
          }
        }
        toast.success(editingPo ? "Purchase order updated" : "Purchase order issued");
        setIsPoDialogOpen(false);
        setPoFile(null);
        reloadPos();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save purchase order");
    } finally {
      setIsSavingPo(false);
    }
  };

  const handlePoStatusChange = async (po: PurchaseOrder, newStatus: string) => {
    if (!po.id) return;
    try {
      const res = await updatePurchaseOrderApi(project.id, po.id, { status: newStatus as any });
      if (res.success) {
        toast.success(`Purchase order status updated to ${newStatus}`);
        reloadPos();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleDeletePo = async (poId: string) => {
    if (!window.confirm("Are you sure you want to delete this purchase order?")) return;
    try {
      const res = await deletePurchaseOrderApi(project.id, poId);
      if (res.success) {
        toast.success("Purchase order deleted");
        reloadPos();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete purchase order");
    }
  };


  // Tasks Filter Helper for Kanban Board
  const getTasksByStatus = (status: typeof taskStatus) => {
    return tasks.filter(t => t.status === status);
  };

  return (
    <div className="h-full bg-background">
      <ScrollArea className="h-full">
        <div className="p-2 lg:p-4">
          <div className="mx-auto space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              {/* Header Card */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/projects")}
                      className="gap-2 h-9 px-3 hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="font-medium">Back</span>
                    </Button>
                    <div className="h-8 w-px bg-border hidden md:block" />
                    <div>
                      <h1 className="text-xl font-bold text-foreground tracking-tight">{project.projectNo}</h1>
                      <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                        {clientName}
                      </p>
                    </div>
                  </div>
                   <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                    {project.status !== "Completed" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setCompletionNotes("");
                          setIsCompleteDialogOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark as Completed
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openEditProjectDialog}
                      className="border-pink-200 text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/20 font-semibold h-9 gap-1.5"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Project
                    </Button>

                    <Select
                      value={project.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className={`h-9 w-[150px] text-xs font-bold uppercase border-0 ${getStatusColor(project.status)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm font-semibold text-foreground bg-pink-50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 px-3 py-1.5 rounded-lg border border-pink-100 dark:border-pink-900/30">
                      Value: {fmtCurrency(project.value)}
                    </span>
                  </div>
                </div>

                {/* Tabs Selector */}
                <div className="px-4 lg:px-5">
                  <TabsList className="w-fit h-12 bg-transparent p-0 rounded inline-flex flex-nowrap justify-start gap-4 lg:gap-6 overflow-x-auto max-w-full">
                    <TabsTrigger
                      value="overview"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/20 dark:data-[state=active]:text-pink-400 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="tasks"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/20 dark:data-[state=active]:text-pink-400 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Tasks Board
                    </TabsTrigger>
                    <TabsTrigger
                      value="pos"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/20 dark:data-[state=active]:text-pink-400 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Purchase Orders
                    </TabsTrigger>
                    <TabsTrigger
                      value="subcontracts"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/20 dark:data-[state=active]:text-pink-400 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Subcontractors
                    </TabsTrigger>
                    <TabsTrigger
                      value="schedules"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/20 dark:data-[state=active]:text-pink-400 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Schedules
                    </TabsTrigger>
                    <TabsTrigger
                      value="remarks"
                      className="flex-none w-auto shrink-0 h-full rounded-md !border-b-2 border-0 border-transparent data-[state=active]:border-pink-600 data-[state=active]:text-pink-700 data-[state=active]:bg-pink-50/50 dark:data-[state=active]:bg-pink-950/20 dark:data-[state=active]:text-pink-400 data-[state=active]:shadow-none px-4 text-sm font-bold transition-all"
                    >
                      Remarks
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="m-0 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Project Details Box */}
                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4 lg:col-span-2">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                        <FolderKanban className="h-4.5 w-4.5 text-pink-700" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Project Details</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Project Name</span>
                        <span className="font-semibold text-foreground text-base">{project.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Project Number</span>
                        <span className="font-semibold text-foreground text-base">{project.projectNo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Start Date</span>
                        <div className="mt-1 flex items-center gap-1.5 text-foreground font-semibold">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Expected Completion</span>
                        <div className="mt-1 flex items-center gap-1.5 text-foreground font-semibold">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {project.expectedCompletionDate
                              ? new Date(project.expectedCompletionDate).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                      {project.actualCompletionDate && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Actual Completion Date</span>
                          <div className="mt-1 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{new Date(project.actualCompletionDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Project Value</span>
                        <div className="mt-1 flex items-center gap-1.5 text-pink-700 dark:text-pink-400 font-bold text-base">
                          <IndianRupee className="h-4.5 w-4.5" />
                          <span>{fmtCurrency(project.value)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Info Box */}
                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Building className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Client Info</h3>
                    </div>

                    <div className="text-sm space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Company / Client</span>
                        <span className="font-semibold text-foreground text-base">{clientName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Person</span>
                        <span className="font-semibold text-foreground">{contactPerson}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Phone</span>
                        <span className="font-semibold text-foreground">{clientPhone || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Email</span>
                        <span className="font-semibold text-foreground">{clientEmail || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Location</span>
                        <span className="font-semibold text-foreground text-xs">{clientLocation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Linked Commercials */}
                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <LinkIcon className="h-4 w-4 text-indigo-600" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Linked Commercials</h3>
                    </div>
                    {project.quotationRef ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Quotation Reference</p>
                            <p className="font-semibold text-sm text-foreground mt-0.5">
                              {linkedQuotation ? linkedQuotation.quotationNo : "Quotation Sheet"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/quotations/${project.quotationRef}`)}
                            className="gap-1.5 h-8 text-xs font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Quotation
                          </Button>
                        </div>

                        {linkedQuotation?.enquiryId && linkedQuotation?.costingId && (
                          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase font-bold">Costing Sheet Reference</p>
                              <p className="font-semibold text-sm text-foreground mt-0.5">
                                Costing Sheet (Rev {linkedQuotation.costingRevision ?? 1})
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(`/enquiries/${linkedQuotation.enquiryId}`, {
                                  state: { activeTab: "costing" }
                                })
                              }
                              className="gap-1.5 h-8 text-xs font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Costing Sheet
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground italic text-xs">
                        No quotation or costing sheet linked directly to this project.
                      </div>
                    )}
                  </div>

                  {/* Handover Reports */}
                  <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Handover Documents</h3>
                      </div>
                      <input
                        type="file"
                        ref={handoverInputRef}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={handleHandoverUpload}
                      />
                      <Button
                        size="sm"
                        onClick={handleHandoverUploadClick}
                        disabled={isUploadingHandover}
                        className="gap-1.5 h-8 bg-pink-700 hover:bg-pink-800 text-white font-semibold text-xs"
                      >
                        {isUploadingHandover ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Upload Report
                      </Button>
                    </div>

                    {project.handoverDocs && project.handoverDocs.length > 0 ? (
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                        {project.handoverDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-semibold text-xs text-foreground truncate">{doc.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadHandover(doc.url)}
                              className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground italic text-xs border border-dashed border-border rounded-lg">
                        No handover reports or commissioning documents uploaded.
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* KANBAN TASKS TAB */}
              <TabsContent value="tasks" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-pink-700" />
                    <h3 className="text-base font-bold text-foreground">Project Tasks</h3>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openAddTaskDialog("Todo")}
                    className="bg-pink-700 hover:bg-pink-800 text-white font-semibold h-8 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </Button>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  {(["Todo", "In Progress", "Review", "Completed"] as const).map(col => {
                    const colTasks = getTasksByStatus(col);
                    const colColors: Record<string, string> = {
                      Todo: "border-t-blue-500",
                      "In Progress": "border-t-amber-500",
                      Review: "border-t-indigo-500",
                      Completed: "border-t-emerald-500",
                    };
                    return (
                      <div
                        key={col}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col)}
                        className={`bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-border border-t-4 ${colColors[col] || "border-t-border"} flex flex-col gap-3 min-h-[450px] transition-all`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40">
                          <span>{col}</span>
                          <span className="bg-slate-200 dark:bg-slate-800 text-foreground px-2 py-0.5 rounded-full text-[10px]">
                            {colTasks.length}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-1">
                          {colTasks.map(t => {
                            const pColors: Record<string, string> = {
                              Critical: "border-l-red-600 dark:border-l-red-500 bg-red-500/5",
                              High: "border-l-orange-500 dark:border-l-orange-400 bg-orange-500/5",
                              Medium: "border-l-amber-500 dark:border-l-amber-400 bg-amber-500/5",
                              Low: "border-l-blue-500 dark:border-l-blue-400 bg-blue-500/5",
                            };
                            return (
                              <div
                                key={t.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, t.id!)}
                                className={`bg-card p-3 rounded-lg border border-border/80 shadow-sm cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-700 transition-all border-l-4 ${pColors[t.priority] || "border-l-slate-400"} space-y-2`}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <h4 className="font-semibold text-xs text-foreground leading-tight line-clamp-2">
                                    {t.title}
                                  </h4>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                                    t.priority === "Critical" ? "bg-red-500/10 text-red-600" :
                                    t.priority === "High" ? "bg-orange-500/10 text-orange-650" :
                                    t.priority === "Medium" ? "bg-amber-500/10 text-amber-600" :
                                    "bg-blue-500/10 text-blue-600"
                                  }`}>
                                    {t.priority}
                                  </span>
                                </div>
                                {t.description && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                                    {t.description}
                                  </p>
                                )}
                                <div className="text-[10px] text-muted-foreground flex justify-between items-center pt-1 border-t border-border/40">
                                  <span>{t.assignedTo || "Unassigned"}</span>
                                  {t.dueDate && (
                                    <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                                  )}
                                </div>
                                <div className="flex justify-end gap-1.5 pt-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditTaskDialog(t)}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteTask(t.id!)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-750"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* PURCHASE ORDERS TAB */}
              <TabsContent value="pos" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-pink-700" />
                    <h3 className="text-base font-bold text-foreground">Material Purchase Orders</h3>
                  </div>
                  <Button
                    size="sm"
                    onClick={openAddPoDialog}
                    className="bg-pink-700 hover:bg-pink-800 text-white font-semibold h-8 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Issue PO
                  </Button>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border text-xs uppercase font-bold text-muted-foreground">
                        <th className="p-3">PO Number</th>
                        <th className="p-3">Vendor Name</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Date Issued</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-border/60">
                      {purchaseOrders.map(po => (
                        <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td
                            className="p-3 font-semibold text-foreground cursor-pointer hover:text-pink-707 hover:underline"
                            onClick={() => navigate(`/projects/${project.id}/purchase-orders/${po.id}`)}
                          >
                            {po.poNo}
                          </td>
                          <td className="p-3 font-medium text-foreground">{po.vendorName}</td>
                          <td className="p-3 font-semibold text-pink-700 dark:text-pink-400">{fmtCurrency(po.amount)}</td>
                          <td className="p-3">
                            <Select
                              value={po.status}
                              onValueChange={(val) => handlePoStatusChange(po, val)}
                            >
                              <SelectTrigger className={`h-7 w-[100px] text-[10px] font-bold uppercase ${
                                po.status === "Delivered" ? "bg-emerald-500/10 text-emerald-600" :
                                po.status === "Ordered" ? "bg-indigo-500/10 text-indigo-650" :
                                po.status === "Approved" ? "bg-blue-500/10 text-blue-600" :
                                "bg-amber-500/10 text-amber-600"
                              }`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="text-xs">
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Ordered">Ordered</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/projects/${project.id}/purchase-orders/${po.id}`)}
                              className="h-7 px-2.5 text-[10px] font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditPoDialog(po)}
                              className="h-7 px-2.5 text-[10px] font-semibold border-pink-700/20 text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/20"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" /> {po.status === "Pending" ? "Edit" : "Revise"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePo(po.id!)}
                              className="h-7 w-7 p-0 text-red-650 hover:text-red-750 inline-flex items-center justify-center animate-none"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {purchaseOrders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                            No purchase orders issued for this project.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* SUBCONTRACTORS TAB */}
              <TabsContent value="subcontracts" className="m-0 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-pink-700" />
                    <h3 className="text-base font-bold text-foreground">Subcontractor Allocations</h3>
                  </div>
                  <Button
                    size="sm"
                    onClick={openAddSubcontractDialog}
                    className="bg-pink-700 hover:bg-pink-800 text-white font-semibold h-8 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Subcontractor
                  </Button>
                </div>

                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-border text-xs uppercase font-bold text-muted-foreground">
                        <th className="p-3">Contractor Name</th>
                        <th className="p-3">Scope of Work</th>
                        <th className="p-3">Value</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Completion Report</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-border/60">
                      {subcontracts.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td
                            className="p-3 font-semibold text-foreground cursor-pointer hover:text-pink-705 hover:underline"
                            onClick={() => navigate(`/projects/${project.id}/subcontracts/${sub.id}`)}
                          >
                            {sub.contractorName}
                          </td>
                          <td className="p-3 text-foreground line-clamp-1 max-w-[200px]">{sub.scopeOfWork}</td>
                          <td className="p-3 font-semibold text-pink-705 dark:text-pink-400">{fmtCurrency(sub.value)}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                              sub.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" :
                              sub.status === "Active" ? "bg-blue-500/10 text-blue-600" :
                              "bg-amber-500/10 text-amber-600"
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {sub.completionReportUrl ? (
                                <>
                                  <a
                                    href={sub.completionReportUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-pink-700 dark:text-pink-400 hover:underline font-semibold flex items-center gap-1"
                                  >
                                    <LinkIcon className="h-3 w-3" /> View Report
                                  </a>
                                  <label className="cursor-pointer text-muted-foreground hover:text-pink-750 transition-colors ml-1" title="Replace completion report">
                                    <Upload className="h-3.5 w-3.5" />
                                    <input
                                      type="file"
                                      accept=".pdf,image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadSubcontractReport(sub.id!, file);
                                      }}
                                    />
                                  </label>
                                </>
                              ) : (
                                <label className="cursor-pointer text-pink-700 hover:text-pink-805 font-semibold flex items-center gap-1 transition-colors">
                                  <Upload className="h-3.5 w-3.5" /> Upload
                                  <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadSubcontractReport(sub.id!, file);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right space-x-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/projects/${project.id}/subcontracts/${sub.id}`)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="View details & remarks"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditSubcontractDialog(sub)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSubcontract(sub.id!)}
                              className="h-7 w-7 p-0 text-red-655 hover:text-red-755"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {subcontracts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                            No subcontractors contract arranged for this project.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* SCHEDULES TAB */}
              <TabsContent value="schedules" className="m-0">
                <Schedules
                  entityId={project.id}
                  entityType="project"
                  entityNo={project.projectNo}
                  clientName={clientName}
                  title={project.name}
                  isClosed={project.status === "Completed"}
                />
              </TabsContent>

              {/* REMARKS TAB */}
              <TabsContent value="remarks" className="m-0">
                <RemarksChat
                  entityType="project"
                  entityId={project.id}
                  disabled={project.status === "Completed"}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>

      {/* MARK AS COMPLETED DIALOG */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground">Complete Project {project.projectNo}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Confirm that all installation work is finished. This records completion date and notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            <div>
              <Label htmlFor="actualCompletionDate">Actual Completion Date *</Label>
              <Input
                id="actualCompletionDate"
                type="date"
                value={actualCompletionDate}
                onChange={(e) => setActualCompletionDate(e.target.value)}
                className="mt-1 text-sm h-9"
                required
              />
            </div>
            <div>
              <Label htmlFor="completionNotes">Completion / Handover Notes</Label>
              <Textarea
                id="completionNotes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Installation comments, handoff details..."
                className="mt-1 text-sm"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsCompleteDialogOpen(false)} disabled={isCompleting} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCompleteProject}
                disabled={isCompleting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 text-xs"
              >
                {isCompleting ? "Saving..." : "Complete Project"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* TASK ADD/EDIT DIALOG */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingTask ? `Edit Task: ${editingTask.title}` : "Create Project Task"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveTask} className="space-y-3.5 mt-3">
            <div>
              <Label htmlFor="taskTitle">Task Title *</Label>
              <Input
                id="taskTitle"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="mt-1 text-sm h-9"
                required
              />
            </div>
            <div>
              <Label htmlFor="taskDesc">Description</Label>
              <Textarea
                id="taskDesc"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Scope or technical brief details..."
                className="mt-1 text-sm"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority *</Label>
                <Select value={taskPriority} onValueChange={(val: any) => setTaskPriority(val)}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
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

              <div>
                <Label>Status *</Label>
                <Select value={taskStatus} onValueChange={(val: any) => setTaskStatus(val)}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo">Todo</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assign Staff</Label>
                <Select value={taskAssignedStaffId || "none"} onValueChange={setTaskAssignedStaffId}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {staffList.map(s => {
                      const staffId = s.id || (s as any)._id || "none";
                      return (
                        <SelectItem key={staffId} value={staffId}>
                          {s.fullName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="taskDueDate">Due Date</Label>
                <Input
                  id="taskDueDate"
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="mt-1 text-sm h-9"
                />
              </div>
            </div>

            {taskStatus === "Completed" && (
              <div>
                <Label htmlFor="taskCompletedNotes">Completed Work Notes</Label>
                <Textarea
                  id="taskCompletedNotes"
                  value={taskCompletedNotes}
                  onChange={(e) => setTaskCompletedNotes(e.target.value)}
                  placeholder="Completed actions, parts installed, tests results..."
                  className="mt-1 text-sm"
                  rows={2}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)} disabled={isSavingTask} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingTask}
                className="bg-pink-700 hover:bg-pink-805 text-white font-semibold h-9 text-xs"
              >
                {isSavingTask ? "Saving..." : editingTask ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DRAG AND DROP COMPLETE NOTES PROMPT */}
      <Dialog open={isTaskCompletePromptOpen} onOpenChange={setIsTaskCompletePromptOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground text-sm font-bold">Mark Task as Completed</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Add any comments about the completed work before finalizing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            <div>
              <Label htmlFor="promptNotes">Completed Work Notes</Label>
              <Textarea
                id="promptNotes"
                value={promptNotes}
                onChange={(e) => setPromptNotes(e.target.value)}
                placeholder="What details were resolved during this task?"
                className="mt-1 text-sm"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsTaskCompletePromptOpen(false)} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSavePromptNotes}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 text-xs"
              >
                Confirm Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUBCONTRACT ADD/EDIT DIALOG */}
      <Dialog open={isSubcontractDialogOpen} onOpenChange={setIsSubcontractDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingSubcontract ? "Edit Subcontractor Allocation" : "Assign Subcontractor"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSubcontract} className="space-y-3.5 mt-3">
            <div>
              <Label htmlFor="subcontractorName">Contractor Name *</Label>
              <Input
                id="subcontractorName"
                value={subcontractorName}
                onChange={(e) => setSubcontractorName(e.target.value)}
                placeholder="Company or Contractor Name..."
                className="mt-1 text-sm h-9"
                required
              />
            </div>

            <div>
              <Label htmlFor="subcontractScope">Scope of Work *</Label>
              <Textarea
                id="subcontractScope"
                value={subcontractScope}
                onChange={(e) => setSubcontractScope(e.target.value)}
                placeholder="Describe scope, duties, or deliverables..."
                className="mt-1 text-sm"
                rows={2}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="subcontractValue">Contract Value (INR) *</Label>
                <Input
                  id="subcontractValue"
                  type="number"
                  value={subcontractValue || ""}
                  onChange={(e) => setSubcontractValue(Number(e.target.value))}
                  className="mt-1 text-sm h-9"
                  required
                />
              </div>

              <div>
                <Label>Status *</Label>
                <Select value={subcontractStatus} onValueChange={(val: any) => setSubcontractStatus(val)}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>



            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsSubcontractDialogOpen(false)} disabled={isSavingSubcontract} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingSubcontract}
                className="bg-pink-700 hover:bg-pink-805 text-white font-semibold h-9 text-xs"
              >
                {isSavingSubcontract ? "Saving..." : editingSubcontract ? "Update Allocation" : "Assign Contractor"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PO ADD/EDIT DIALOG */}
      <Dialog open={isPoDialogOpen} onOpenChange={setIsPoDialogOpen}>
        <DialogContent className="max-w-xl bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingPo ? "Edit Purchase Order" : "Issue Material Purchase Order"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePo} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="poVendorName">Vendor Name *</Label>
                <Input
                  id="poVendorName"
                  value={poVendorName}
                  onChange={(e) => setPoVendorName(e.target.value)}
                  placeholder="AC Supplier Ltd..."
                  className="mt-1 text-sm h-9"
                  required
                />
              </div>

              <div>
                <Label>Status *</Label>
                <Select value={poStatus} onValueChange={(val: any) => setPoStatus(val)}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Ordered">Ordered</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Line Items</Label>
                <Button type="button" size="sm" onClick={addPoItemRow} className="h-7 px-2 bg-pink-700 hover:bg-pink-800 text-white font-semibold text-[10px] gap-1">
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {poItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-border">
                    <div className="flex-1">
                      <Input
                        value={item.description}
                        onChange={(e) => handlePoItemChange(idx, "description", e.target.value)}
                        placeholder="Item Description..."
                        className="text-xs h-8"
                        required
                      />
                    </div>
                    <div className="w-16">
                      <Input
                        type="number"
                        min="1"
                        value={item.qty || ""}
                        onChange={(e) => handlePoItemChange(idx, "qty", e.target.value)}
                        placeholder="Qty"
                        className="text-xs h-8 text-center"
                        required
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="0"
                        value={item.rate || ""}
                        onChange={(e) => handlePoItemChange(idx, "rate", e.target.value)}
                        placeholder="Rate"
                        className="text-xs h-8 text-right"
                        required
                      />
                    </div>
                    <div className="w-28 text-right text-xs font-semibold text-foreground pr-1 shrink-0">
                      {fmtCurrency(item.qty * item.rate)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removePoItemRow(idx)}
                      disabled={poItems.length === 1}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-950 p-3 rounded-lg border border-border">
              <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Grand Total:</span>
              <span className="font-bold text-base text-pink-700 dark:text-pink-400">
                {fmtCurrency(poItems.reduce((acc, curr) => acc + curr.qty * curr.rate, 0))}
              </span>
            </div>

            <div>
              <Label htmlFor="poFileField">Order Request / Signed PDF Document</Label>
              <div className="flex items-center gap-3 mt-1">
                <label className="cursor-pointer bg-pink-700 hover:bg-pink-800 text-white text-xs font-semibold px-3 py-2 rounded-md flex items-center gap-1.5 transition-all shrink-0">
                  <Upload className="h-3.5 w-3.5" />
                  Choose File
                  <input
                    id="poFileField"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setPoFile(e.target.files?.[0] || null)}
                  />
                </label>
                <span className="text-xs text-muted-foreground truncate">
                  {poFile ? poFile.name : "No file chosen"}
                </span>
              </div>
              {editingPo?.pdfUrl && !poFile && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  Current document: <a href={editingPo.pdfUrl} target="_blank" rel="noreferrer" className="text-pink-705 underline font-semibold">View current file</a>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsPoDialogOpen(false)} disabled={isSavingPo} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingPo}
                className="bg-pink-700 hover:bg-pink-805 text-white font-semibold h-9 text-xs"
              >
                {isSavingPo ? "Issuing..." : editingPo ? "Update Order" : "Issue Purchase Order"}
              </Button>
            </div>
          </form>
        </DialogContent>
       </Dialog>


      {/* EDIT PROJECT DETAILS DIALOG */}
      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent className="max-w-md bg-card border border-border shadow-lg p-5">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Project Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Modify the core info and value of the project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProjectDetails} className="space-y-4 mt-3">
            <div>
              <Label htmlFor="editProjectNameInput">Project Name *</Label>
              <Input
                id="editProjectNameInput"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                className="mt-1 text-sm h-9 text-foreground"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="editProjectStartDateInput">Start Date *</Label>
                <Input
                  id="editProjectStartDateInput"
                  type="date"
                  value={editProjectStartDate}
                  onChange={(e) => setEditProjectStartDate(e.target.value)}
                  className="mt-1 text-sm h-9 text-foreground"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editProjectExpectedCompletionInput">Expected Completion</Label>
                <Input
                  id="editProjectExpectedCompletionInput"
                  type="date"
                  value={editProjectExpectedCompletionDate}
                  onChange={(e) => setEditProjectExpectedCompletionDate(e.target.value)}
                  className="mt-1 text-sm h-9 text-foreground"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editProjectValueInput">Project Value (INR) *</Label>
              <Input
                id="editProjectValueInput"
                type="number"
                min="0"
                value={editProjectValue || ""}
                onChange={(e) => setEditProjectValue(Number(e.target.value))}
                className="mt-1 text-sm h-9 text-foreground"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => setIsEditProjectDialogOpen(false)} disabled={isSavingProjectDetails} className="h-9 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingProjectDetails}
                className="bg-pink-700 hover:bg-pink-800 text-white font-semibold h-9 text-xs"
              >
                {isSavingProjectDetails ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

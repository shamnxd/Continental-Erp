import { Request, Response, NextFunction } from "express";
import { ScheduleModel } from "../models/Schedule";
import { ComplaintModel } from "../models/Complaint";
import { ProjectModel } from "../models/Project";
import { MinorJobModel } from "../models/MinorJob";
import { ComplaintRequestModel } from "../models/ComplaintRequest";
import { StatusCode } from "../constants/statusCodes";

interface KanbanTask {
  id: string;
  dbId: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  assignee: string;
  assignedStaffIds: string[];
  dueDate: string;
  type: "Schedule" | "Complaint" | "Project" | "Minor Job" | "Custom" | "Customer Complaint";
  stage: "todo" | "in-progress" | "review";
  reference: string;
  rawStatus: string;
  clientName: string;
  notes?: string;
  smrId?: string | null;
  entityType?: string;
}

export class KanbanController {
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const type = req.query.type as string | undefined;
      const priority = req.query.priority as string | undefined;
      const stage = req.query.stage as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;

      const [schedules, complaints, projects, minorJobs, complaintRequests] = await Promise.all([
        ScheduleModel.find({}).lean().exec(),
        ComplaintModel.find({}).lean().exec(),
        ProjectModel.find({}).populate("clientRef").lean().exec(),
        MinorJobModel.find({}).populate("clientRef").lean().exec(),
        ComplaintRequestModel.find({ status: "Pending" }).lean().exec(),
      ]);

      const loadedTasks: KanbanTask[] = [];

      // 1. Schedules
      schedules.forEach((s: any) => {
        const isCompletedWithSMR = s.status === "Completed" && s.smrId;
        const isCancelled = s.status === "Cancelled";
        if (isCompletedWithSMR || isCancelled) return;

        let stageName: KanbanTask["stage"] = "todo";
        if (s.status === "In Progress") {
          stageName = "in-progress";
        } else if (s.status === "Pending" || s.status === "Completed") {
          stageName = "review";
        }

        const isCustom = s.entityId === "custom";

        loadedTasks.push({
          id: `schedule-${s._id}`,
          dbId: s._id.toString(),
          title: s.title,
          description: s.notes || "",
          priority: "Medium",
          assignee: s.assignedTo?.join(", ") || "Unassigned",
          assignedStaffIds: s.assignedStaffIds || [],
          dueDate: s.scheduledDate ? new Date(s.scheduledDate).toISOString().split("T")[0] : "",
          type: isCustom ? "Custom" : "Schedule",
          stage: stageName,
          reference: isCustom ? "CUSTOM" : s.entityNo,
          rawStatus: s.status,
          clientName: s.clientName,
          notes: s.notes,
          smrId: s.smrId ? s.smrId.toString() : null,
          entityType: s.entityType,
        });
      });

      // 2. Complaints
      complaints.forEach((c: any) => {
        if (c.status === "Resolved") return;

        let stageName: KanbanTask["stage"] = "todo";
        if (c.status === "In Progress") stageName = "in-progress";

        loadedTasks.push({
          id: `complaint-${c._id}`,
          dbId: c._id.toString(),
          title: c.issue,
          description: c.description || "",
          priority: (c.priority as any) || "Medium",
          assignee: c.assignedTo?.join(", ") || "Unassigned",
          assignedStaffIds: c.assignedStaffIds || [],
          dueDate: c.expectedResolution ? new Date(c.expectedResolution).toISOString().split("T")[0] : "",
          type: "Complaint",
          stage: stageName,
          reference: c.complaintNo,
          rawStatus: c.status,
          clientName: c.clientName,
        });
      });

      // 3. Projects
      projects.forEach((p: any) => {
        if (p.status === "Completed") return;

        let stageName: KanbanTask["stage"] = "todo";
        if (p.status === "Active") stageName = "in-progress";

        loadedTasks.push({
          id: `project-${p._id}`,
          dbId: p._id.toString(),
          title: p.name,
          description: `Value: ₹${p.value.toLocaleString("en-IN")}`,
          priority: "High",
          assignee: "Manager",
          assignedStaffIds: [],
          dueDate: p.expectedCompletionDate ? new Date(p.expectedCompletionDate).toISOString().split("T")[0] : "",
          type: "Project",
          stage: stageName,
          reference: p.projectNo,
          rawStatus: p.status,
          clientName: p.clientRef && typeof p.clientRef === "object" ? p.clientRef.companyName : "—",
        });
      });

      // 4. Minor Jobs
      minorJobs.forEach((j: any) => {
        if (j.status === "Completed") return;

        let stageName: KanbanTask["stage"] = "todo";
        if (j.status === "In Progress") stageName = "in-progress";

        loadedTasks.push({
          id: `minorjob-${j._id}`,
          dbId: j._id.toString(),
          title: j.description,
          description: j.scheduledDate ? `Scheduled Date: ${new Date(j.scheduledDate).toLocaleDateString()}` : "—",
          priority: "Medium",
          assignee: j.assignedTo || "Unassigned",
          assignedStaffIds: j.assignedStaffId ? [j.assignedStaffId] : [],
          dueDate: j.scheduledDate ? new Date(j.scheduledDate).toISOString().split("T")[0] : "",
          type: "Minor Job",
          stage: stageName,
          reference: j.jobNo,
          rawStatus: j.status,
          clientName: j.clientRef && typeof j.clientRef === "object" ? j.clientRef.companyName : "—",
        });
      });

      // 5. Customer Complaints (Complaint Requests)
      complaintRequests.forEach((r: any) => {
        if (r.status !== "Pending") return;

        loadedTasks.push({
          id: `complaintrequest-${r._id}`,
          dbId: r._id.toString(),
          title: r.issue,
          description: r.description || "",
          priority: "Medium",
          assignee: "Unassigned",
          assignedStaffIds: [],
          dueDate: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
          type: "Customer Complaint",
          stage: "todo",
          reference: `REQ-${r._id.toString().slice(-6).toUpperCase()}`,
          rawStatus: r.status,
          clientName: r.clientName,
        });
      });

      // Apply filtering
      let filtered = loadedTasks;

      if (type && type !== "all") {
        filtered = filtered.filter((t) => t.type === type);
      }

      if (priority && priority !== "all") {
        filtered = filtered.filter((t) => t.priority === priority);
      }

      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.clientName.toLowerCase().includes(q) ||
            t.reference.toLowerCase().includes(q)
        );
      }

      // Sort logically based on priority and time:
      // Category 1 (Urgent): Overdue or due today
      // Category 2 (Future): Due in the future
      // Category 3 (No date): No due date configured
      const todayStr = new Date().toISOString().split("T")[0];
      const priorityWeights: Record<string, number> = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Low: 1
      };

      filtered.sort((a, b) => {
        const getCategory = (task: typeof a) => {
          if (!task.dueDate) return 3; // No date
          return task.dueDate <= todayStr ? 1 : 2; // Urgent vs Future
        };

        const catA = getCategory(a);
        const catB = getCategory(b);

        if (catA !== catB) {
          return catA - catB; // Class 1 before Class 2, Class 2 before Class 3
        }

        const weightA = priorityWeights[a.priority] ?? 2;
        const weightB = priorityWeights[b.priority] ?? 2;

        if (catA === 1) {
          // Both are urgent (overdue or due today): Sort by priority (descending), then due date (ascending)
          if (weightA !== weightB) {
            return weightB - weightA;
          }
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (catA === 2) {
          // Both are future tasks: Sort by due date (ascending), then priority (descending)
          const timeA = new Date(a.dueDate).getTime();
          const timeB = new Date(b.dueDate).getTime();
          if (timeA !== timeB) {
            return timeA - timeB;
          }
          return weightB - weightA;
        } else {
          // Both have no due date: Sort by priority (descending)
          return weightB - weightA;
        }
      });

      // Calculate counts for FilterStatChips (filtered by search and priority, but NOT by type)
      const baseTasksForCounts = loadedTasks.filter((t) => {
        if (priority && priority !== "all" && t.priority !== priority) return false;
        if (search && search.trim()) {
          const q = search.toLowerCase().trim();
          return (
            t.title.toLowerCase().includes(q) ||
            t.clientName.toLowerCase().includes(q) ||
            t.reference.toLowerCase().includes(q)
          );
        }
        return true;
      });

      const counts = {
        all: baseTasksForCounts.length,
        Schedule: baseTasksForCounts.filter((t) => t.type === "Schedule").length,
        Complaint: baseTasksForCounts.filter((t) => t.type === "Complaint").length,
        Project: baseTasksForCounts.filter((t) => t.type === "Project").length,
        "Minor Job": baseTasksForCounts.filter((t) => t.type === "Minor Job").length,
        "Customer Complaint": baseTasksForCounts.filter((t) => t.type === "Customer Complaint").length,
        Custom: baseTasksForCounts.filter((t) => t.type === "Custom").length,
      };

      // Paginate and structure the response
      if (stage && stage !== "all") {
        const stageTasks = filtered.filter((t) => t.stage === stage);
        const start = (page - 1) * limit;
        const paginated = stageTasks.slice(start, start + limit);
        const hasMore = start + limit < stageTasks.length;

        res.status(StatusCode.OK).json({
          success: true,
          counts,
          data: paginated,
          hasMore,
          total: stageTasks.length,
        });
      } else {
        const todoTasks = filtered.filter((t) => t.stage === "todo");
        const inProgressTasks = filtered.filter((t) => t.stage === "in-progress");
        const reviewTasks = filtered.filter((t) => t.stage === "review");

        res.status(StatusCode.OK).json({
          success: true,
          counts,
          data: {
            todo: {
              data: todoTasks.slice(0, limit),
              hasMore: todoTasks.length > limit,
              total: todoTasks.length,
            },
            "in-progress": {
              data: inProgressTasks.slice(0, limit),
              hasMore: inProgressTasks.length > limit,
              total: inProgressTasks.length,
            },
            review: {
              data: reviewTasks.slice(0, limit),
              hasMore: reviewTasks.length > limit,
              total: reviewTasks.length,
            },
          },
        });
      }
    } catch (error) {
      next(error);
    }
  };
}

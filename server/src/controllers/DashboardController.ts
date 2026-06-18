import { Request, Response, NextFunction } from "express";
import { EnquiryModel } from "../models/Enquiry";
import { AmcModel } from "../models/Amc";
import { ComplaintModel } from "../models/Complaint";
import { ClientModel } from "../models/Client";
import { ScheduleModel } from "../models/Schedule";
import { WarrantyModel } from "../models/Warranty";
import { StatusCode } from "../constants/statusCodes";

function calculateChange(thisMonth: number, lastMonth: number): string {
  if (lastMonth === 0) {
    return thisMonth > 0 ? "+100%" : "0%";
  }
  const diff = thisMonth - lastMonth;
  const pct = Math.round((diff / lastMonth) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function formatRelativeTime(date: Date | string): string {
  const diffMs = new Date().getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? "s" : ""} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export class DashboardController {
  public getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      const thisMonthStartStr = startOfThisMonth.toISOString().split("T")[0];
      const thisMonthEndStr = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString().split("T")[0];
      const lastMonthStartStr = startOfLastMonth.toISOString().split("T")[0];
      const lastMonthEndStr = endOfLastMonth.toISOString().split("T")[0];

      // ─── 1. Fetch Overview Banner Details ──────────────────────────────────
      const activeSchedulesCount = await ScheduleModel.countDocuments({
        status: { $in: ["Scheduled", "In Progress", "Pending"] }
      });

      // ─── 2. Fetch Stats Grid (Current Metrics vs Last Month) ───────────────
      // Enquiries
      const [enqTotal, enqThisMonth, enqLastMonth] = await Promise.all([
        EnquiryModel.countDocuments(),
        EnquiryModel.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
        EnquiryModel.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
      ]);

      // Active AMC
      const [amcActive, amcThisMonth, amcLastMonth] = await Promise.all([
        AmcModel.countDocuments({ status: "Active" }),
        AmcModel.countDocuments({ status: "Active", createdAt: { $gte: startOfThisMonth } }),
        AmcModel.countDocuments({ status: "Active", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
      ]);

      // Pending Complaints
      const [compPending, compThisMonth, compLastMonth] = await Promise.all([
        ComplaintModel.countDocuments({ status: { $in: ["Pending", "In Progress"] } }),
        ComplaintModel.countDocuments({ status: { $in: ["Pending", "In Progress"] }, createdAt: { $gte: startOfThisMonth } }),
        ComplaintModel.countDocuments({ status: { $in: ["Pending", "In Progress"] }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
      ]);

      const revThisMonth = 0;
      const revLastMonth = 0;

      // Pending Quotations
      const [quotPending, quotThisMonth, quotLastMonth] = [0, 0, 0];

      // Active Clients
      const [clientTotal, clientThisMonth, clientLastMonth] = await Promise.all([
        ClientModel.countDocuments(),
        ClientModel.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
        ClientModel.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
      ]);

      const invPending = 0;
      const invThisMonth = 0;
      const invLastMonth = 0;

      // Completed Works
      const [compWorksTotal, compWorksThisMonth, compWorksLastMonth] = await Promise.all([
        ScheduleModel.countDocuments({ status: "Completed" }),
        ScheduleModel.countDocuments({ status: "Completed", completedAt: { $gte: startOfThisMonth } }),
        ScheduleModel.countDocuments({ status: "Completed", completedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
      ]);

      // Format Revenue Display Value
      const formatRevValue = (val: number) => {
        if (val >= 100000) {
          return `₹${(val / 100000).toFixed(1)}L`;
        }
        return `₹${val.toLocaleString("en-IN")}`;
      };

      const stats = [
        { name: "Total Enquiries", value: String(enqTotal), change: calculateChange(enqThisMonth, enqLastMonth), icon: "FileText", color: "bg-pink-700" },
        { name: "Active AMC", value: String(amcActive), change: calculateChange(amcThisMonth, amcLastMonth), icon: "Calendar", color: "bg-pink-600" },
        { name: "Pending Complaints", value: String(compPending), change: calculateChange(compThisMonth, compLastMonth), icon: "AlertCircle", color: "bg-rose-500" },
        { name: "Revenue (This Month)", value: formatRevValue(revThisMonth), change: calculateChange(revThisMonth, revLastMonth), icon: "DollarSign", color: "bg-pink-700" },
        { name: "Pending Quotations", value: String(quotPending), change: calculateChange(quotThisMonth, quotLastMonth), icon: "Clock", color: "bg-amber-500" },
        { name: "Active Clients", value: String(clientTotal), change: calculateChange(clientThisMonth, clientLastMonth), icon: "Users", color: "bg-pink-600" },
        { name: "Pending Invoices", value: String(invPending), change: calculateChange(invThisMonth, invLastMonth), icon: "DollarSign", color: "bg-amber-500" },
        { name: "Completed Works", value: String(compWorksTotal), change: calculateChange(compWorksThisMonth, compWorksLastMonth), icon: "CheckCircle", color: "bg-pink-700" }
      ];

      // ─── 3. Fetch Last 5 Months Revenue & Expenses ─────────────────────────
      const monthsData = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        monthsData.push({
          month: monthNames[d.getMonth()],
          startStr: mStart.toISOString().split("T")[0],
          endStr: mEnd.toISOString().split("T")[0],
          mStart,
          mEnd
        });
      }

      const revenueData = monthsData.map((m) => ({
        month: m.month,
        revenue: 0,
        expenses: 0
      }));

      // ─── 4. Fetch Complaints Status Pie Chart Data ────────────────────────
      const [resolvedCount, inProgressCount, pendingCount] = await Promise.all([
        ComplaintModel.countDocuments({ status: "Resolved" }),
        ComplaintModel.countDocuments({ status: "In Progress" }),
        ComplaintModel.countDocuments({ status: "Pending" })
      ]);
      const complaintStatusData = [
        { name: "Resolved", value: resolvedCount, color: "#be185d" },
        { name: "In Progress", value: inProgressCount, color: "#9f1239" },
        { name: "Pending", value: pendingCount, color: "#f59e0b" }
      ];

      // ─── 5. Fetch AMC Visits Scheduled vs Completed ────────────────────────
      const amcVisitsData = await Promise.all(
        monthsData.map(async (m) => {
          const visits = await ScheduleModel.find({
            entityType: "amc",
            scheduledDate: { $gte: m.mStart, $lte: m.mEnd }
          }).lean().exec();
          return {
            month: m.month,
            scheduled: visits.filter(v => v.status !== "Cancelled").length,
            completed: visits.filter(v => v.status === "Completed").length
          };
        })
      );

      // ─── 6. Fetch Dynamic Critical Alerts ──────────────────────────────────
      const allAlerts = req.query.allAlerts === "true";
      const limitVal = allAlerts ? 100 : 3;

      const alerts: any[] = [];
      const [soonWarranties, expiredWarranties, overdueAmc, overdueComp] = await Promise.all([
        WarrantyModel.find({ status: "Expiring Soon" }).populate("clientRef").limit(limitVal).lean().exec(),
        WarrantyModel.find({ status: "Expired" }).populate("clientRef").limit(limitVal).lean().exec(),
        ScheduleModel.find({ entityType: "amc", scheduledDate: { $lt: now }, status: { $in: ["Scheduled", "In Progress", "Pending"] } }).limit(limitVal).lean().exec(),
        ComplaintModel.find({ expectedResolution: { $lt: now }, status: { $in: ["Pending", "In Progress"] } }).limit(limitVal).lean().exec(),
      ]);

      soonWarranties.forEach((w: any) => {
        alerts.push({
          id: `warr_soon_${w._id}`,
          type: "urgent",
          title: `Warranty Expiring Soon: ${w.product}`,
          client: `${w.clientRef?.companyName || "Client"} (No: ${w.warrantyNo})`,
          assignee: "Account Manager",
          time: `Expires: ${new Date(w.endDate).toLocaleDateString("en-IN")}`,
          priority: "High",
          link: `/warranty-management/${w._id}`
        });
      });

      expiredWarranties.forEach((w: any) => {
        alerts.push({
          id: `warr_exp_${w._id}`,
          type: "critical",
          title: `Warranty Expired: ${w.product}`,
          client: `${w.clientRef?.companyName || "Client"} (No: ${w.warrantyNo})`,
          assignee: "Account Manager",
          time: `Expired: ${new Date(w.endDate).toLocaleDateString("en-IN")}`,
          priority: "Critical",
          link: `/warranty-management/${w._id}`
        });
      });

      overdueAmc.forEach((s: any) => {
        alerts.push({
          id: `overdue_amc_${s._id}`,
          type: "urgent",
          title: `AMC Visit Overdue: ${s.title}`,
          client: s.clientName,
          assignee: s.assignedTo?.join(", ") || "Unassigned",
          time: `Scheduled: ${new Date(s.scheduledDate).toLocaleDateString("en-IN")}`,
          priority: "High",
          link: `/schedules/${s._id}`
        });
      });

      overdueComp.forEach((c: any) => {
        alerts.push({
          id: `overdue_comp_${c._id}`,
          type: "critical",
          title: `Complaint Overdue: ${c.issue}`,
          client: c.clientName,
          assignee: c.assignedTo?.join(", ") || "Unassigned",
          time: `Target: ${new Date(c.expectedResolution).toLocaleDateString("en-IN")}`,
          priority: c.priority === "Critical" ? "Critical" : "High",
          link: `/complaints/${c._id}`
        });
      });


      // ─── 7. Fetch Recent Activities Log ───────────────────────────────────
      const [latestEnquiries, latestComplaints, latestAmcs] = await Promise.all([
        EnquiryModel.find().sort({ createdAt: -1 }).limit(3).lean().exec(),
        ComplaintModel.find().sort({ createdAt: -1 }).limit(3).lean().exec(),
        AmcModel.find().sort({ createdAt: -1 }).limit(3).lean().exec(),
      ]);

      const activities: any[] = [];
      latestEnquiries.forEach((e: any) => {
        activities.push({
          id: `act_enq_${e._id}`,
          type: "enquiry",
          title: `New Enquiry: ${e.requirement}`,
          client: e.clientName,
          date: e.createdAt,
          time: formatRelativeTime(e.createdAt),
          status: e.status
        });
      });
      latestComplaints.forEach((c: any) => {
        activities.push({
          id: `act_comp_${c._id}`,
          type: "complaint",
          title: `Complaint registered: ${c.issue}`,
          client: c.clientName,
          date: c.createdAt,
          time: formatRelativeTime(c.createdAt),
          status: c.status
        });
      });
      latestAmcs.forEach((a: any) => {
        activities.push({
          id: `act_amc_${a._id}`,
          type: "amc",
          title: `AMC registered: ${a.amcNo}`,
          client: a.clientName,
          date: a.createdAt,
          time: formatRelativeTime(a.createdAt),
          status: a.status
        });
      });

      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recentActivities = activities.slice(0, 5);

      // ─── 8. Fetch Upcoming Tasks (Schedules + Enquiry Follow-ups) ────────
      const [upcomingSchedules, upcomingEnquiries] = await Promise.all([
        ScheduleModel.find({
          scheduledDate: { $gte: now },
          status: { $in: ["Scheduled", "In Progress", "Pending"] }
        }).lean().exec(),
        EnquiryModel.find({
          followUpDate: { $gte: now },
          status: { $ne: "Closed" }
        }).lean().exec()
      ]);

      const mergedUpcoming: any[] = [];

      upcomingSchedules.forEach((s: any) => {
        mergedUpcoming.push({
          id: s._id.toString(),
          task: s.title,
          client: s.clientName,
          date: s.scheduledDate,
          assignee: s.assignedTo?.join(", ") || "Unassigned",
          type: "schedule"
        });
      });

      upcomingEnquiries.forEach((e: any) => {
        mergedUpcoming.push({
          id: e._id.toString(),
          task: `Follow-up: ${e.requirement || e.description}`,
          client: e.clientName || "Client",
          date: e.followUpDate,
          assignee: e.assignedTo || "Unassigned",
          type: "enquiry"
        });
      });

      // Sort by date ascending (closest task first)
      mergedUpcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Take top 4 (or up to 100 if allTasks is true) and format for response
      const upcomingTasksLimit = req.query.allTasks === "true" ? 100 : 4;
      const upcomingTasks = mergedUpcoming.slice(0, upcomingTasksLimit).map((item) => {
        const timeStr = new Date(item.date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
        const dateStr = new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        return {
          id: item.id,
          task: item.task,
          client: item.client,
          date: `${dateStr}, ${timeStr}`,
          assignee: item.assignee,
          type: item.type
        };
      });

      // ─── Send Structured Response ─────────────────────────────────────────
      res.status(StatusCode.OK).json({
        success: true,
        data: {
          overview: {
            activeTasks: activeSchedulesCount,
            alertsCount: alerts.length,
            revenueThisMonth: formatRevValue(revThisMonth)
          },
          stats,
          revenueData,
          complaintStatusData,
          amcVisitsData,
          criticalAlerts: alerts,
          recentActivities,
          upcomingTasks
        }
      });

    } catch (error) {
      next(error);
    }
  };
}

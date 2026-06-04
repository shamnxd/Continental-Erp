import { Response, NextFunction } from "express";
import { container } from "tsyringe";
import { StaffAuthenticatedRequest } from "../middleware/staff.middleware";
import { IStaffRepository } from "../interfaces/repositories/IStaffRepository";
import { ILeaveRequestRepository } from "../interfaces/repositories/ILeaveRequestRepository";
import { ILeaveRequest } from "../interfaces/models/ILeaveRequest";
import { AppError } from "../errors/AppError";
import { StatusCode } from "../constants/statusCodes";
import { ComplaintModel } from "../models/Complaint";
import { AmcVisitModel } from "../models/AmcVisit";
import mongoose from "mongoose";

export class StaffPortalController {
  /** GET /api/v1/staff/portal/me */
  public getMe = async (req: StaffAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const staffRepo = container.resolve<IStaffRepository>("StaffRepository");
      const staff = await staffRepo.findById(req.staff!.id);
      if (!staff) throw new AppError("Staff not found", StatusCode.NOT_FOUND);

      const { passwordHash, refreshToken, ...safeStaff } = staff as any;
      res.status(StatusCode.OK).json({ success: true, data: safeStaff });
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/staff/portal/tasks */
  public getTasks = async (req: StaffAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const staffId = req.staff!.id;
      const objectId = new mongoose.Types.ObjectId(staffId);

      const [complaints, amcVisits] = await Promise.all([
        ComplaintModel.find({ assignedStaffIds: staffId })
          .sort({ createdAt: -1 })
          .select("complaintNo clientName issue status priority createdAt location")
          .lean(),
        AmcVisitModel.find({ assignedStaffIds: objectId })
          .sort({ scheduledDate: 1 })
          .populate({ path: "amcId", select: "contractNo clientName siteAddress" })
          .select("scheduledDate status notes amcId")
          .lean(),
      ]);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          complaints: complaints.map((c: any) => ({
            id: c._id.toString(),
            type: "complaint",
            title: c.issue,
            reference: c.complaintNo,
            client: c.clientName,
            status: c.status,
            priority: c.priority,
            date: c.createdAt,
            location: c.location,
          })),
          amcVisits: amcVisits.map((v: any) => ({
            id: v._id.toString(),
            type: "amc_visit",
            title: "AMC Service Visit",
            reference: (v.amcId as any)?.contractNo || "—",
            client: (v.amcId as any)?.clientName || "—",
            status: v.status,
            date: v.scheduledDate,
            location: (v.amcId as any)?.siteAddress || "—",
            notes: v.notes,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/staff/portal/leaves */
  public getLeaves = async (req: StaffAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leaveRepo = container.resolve<ILeaveRequestRepository>("LeaveRequestRepository");
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await leaveRepo.findPaginated({ staffId: req.staff!.id, page, limit });
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  /** POST /api/v1/staff/portal/leaves */
  public createLeave = async (req: StaffAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { leaveType, fromDate, toDate, reason } = req.body;
      if (!leaveType || !fromDate || !toDate) {
        throw new AppError("leaveType, fromDate, and toDate are required", StatusCode.BAD_REQUEST);
      }

      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new AppError("Invalid date format", StatusCode.BAD_REQUEST);
      }
      if (from > to) {
        throw new AppError("fromDate must be before toDate", StatusCode.BAD_REQUEST);
      }

      const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      const leaveRepo = container.resolve<ILeaveRequestRepository>("LeaveRequestRepository");
      const leave = await leaveRepo.create({
        staffId: req.staff!.id,
        staffName: req.staff!.fullName,
        staffNo: req.staff!.staffNo,
        leaveType,
        fromDate: from,
        toDate: to,
        days,
        reason: reason || "",
        status: "Pending",
      } as ILeaveRequest);

      res.status(StatusCode.CREATED).json({ success: true, data: leave });
    } catch (error) {
      next(error);
    }
  };
}

import { Response, NextFunction } from "express";
import { container } from "tsyringe";
import { StaffAuthenticatedRequest } from "../middleware/staff.middleware";
import { IStaffRepository } from "../interfaces/repositories/IStaffRepository";
import { ILeaveRequestRepository } from "../interfaces/repositories/ILeaveRequestRepository";
import { ILeaveRequest } from "../interfaces/models/ILeaveRequest";
import { AppError } from "../errors/AppError";
import { StatusCode } from "../constants/statusCodes";
import { ComplaintModel } from "../models/Complaint";
import { ScheduleModel } from "../models/Schedule";
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
      const schedules = await ScheduleModel.find({ assignedStaffIds: staffId })
        .sort({ scheduledDate: 1 })
        .lean();

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          complaints: schedules
            .filter((s: any) => s.entityType === "complaint")
            .map((s: any) => ({
              id: s._id.toString(),
              type: "complaint",
              title: s.title,
              reference: s.entityNo,
              client: s.clientName,
              status: s.status,
              priority: "Medium",
              date: s.scheduledDate,
              location: s.notes || "",
            })),
          amcVisits: schedules
             .filter((s: any) => s.entityType === "amc")
             .map((s: any) => ({
               id: s._id.toString(),
               type: "amc_visit",
               title: s.title,
               reference: s.entityNo,
               client: s.clientName,
               status: s.status,
               date: s.scheduledDate,
               location: s.notes || "",
               notes: s.notes || "",
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

import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable, container } from "tsyringe";
import bcrypt from "bcryptjs";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IStaff, StaffWorkHistoryItem } from "../interfaces/models/IStaff";
import { CreateStaffDto, UpdateStaffDto } from "../dtos/staff.dto";
import { GetStaffQuery, PaginatedStaff, IStaffRepository } from "../interfaces/repositories/IStaffRepository";
import { StatusCode } from "../constants/statusCodes";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AuditLogger } from "../utils/AuditLogger";
import { AppError } from "../errors/AppError";
import mongoose from "mongoose";
import { ComplaintModel } from "../models/Complaint";
import { ScheduleModel } from "../models/Schedule";
import { StaffModel } from "../models/Staff";

@autoInjectable()
export class StaffController {
  constructor(
    @inject("CreateStaffUseCase")
    private _createStaffUseCase?: IUseCase<CreateStaffDto, IStaff>,
    @inject("GetStaffUseCase")
    private _getStaffUseCase?: IUseCase<GetStaffQuery, PaginatedStaff>,
    @inject("GetStaffByIdUseCase")
    private _getStaffByIdUseCase?: IUseCase<string, IStaff | null>,
    @inject("UpdateStaffUseCase")
    private _updateStaffUseCase?: IUseCase<{ id: string; data: UpdateStaffDto }, IStaff | null>,
    @inject("DeleteStaffUseCase")
    private _deleteStaffUseCase?: IUseCase<string, boolean>,
    @inject("GetStaffWorkHistoryUseCase")
    private _getStaffWorkHistoryUseCase?: IUseCase<string, StaffWorkHistoryItem[]>
  ) {}

  public getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [total, permanent, outsource] = await Promise.all([
        StaffModel.countDocuments({}),
        StaffModel.countDocuments({ employmentType: "Permanent" }),
        StaffModel.countDocuments({ employmentType: "Outsource" }),
      ]);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          total,
          permanent,
          outsource,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const staff = await this._createStaffUseCase!.execute(req.body as CreateStaffDto);

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Create Staff",
        "Staff",
        `Created staff member: ${staff.fullName} (${staff.staffNo})`
      );

      res.status(StatusCode.CREATED).json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetStaffQuery = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string | undefined,
        employmentType: req.query.employmentType as string | undefined,
        activeOnly: req.query.activeOnly !== "false"
      };
      const result = await this._getStaffUseCase!.execute(query);
      const dataWithCounts = await Promise.all(
        result.data.map(async (staff) => {
          if (!staff.id) return { ...staff, pendingWorksCount: 0 };
          const pendingWorksCount = await ScheduleModel.countDocuments({
            assignedStaffIds: staff.id,
            status: { $in: ["Scheduled", "Assigned", "Pending", "In Progress"] }
          });
          return {
            ...staff,
            pendingWorksCount
          };
        })
      );
      res.status(StatusCode.OK).json({ success: true, ...result, data: dataWithCounts });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const staff = await this._getStaffByIdUseCase!.execute(req.params.id);
      if (!staff) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Staff not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  };

  public getWorkHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const history = await this._getStaffWorkHistoryUseCase!.execute(req.params.id);
      res.status(StatusCode.OK).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const staff = await this._updateStaffUseCase!.execute({
        id: req.params.id,
        data: req.body as UpdateStaffDto
      });
      if (!staff) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Staff not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Update Staff",
        "Staff",
        `Updated staff member details: ${staff.fullName} (${staff.staffNo})`
      );

      res.status(StatusCode.OK).json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const id = req.params.id;
      const staff = await this._getStaffByIdUseCase!.execute(id);
      const staffInfo = staff ? `${staff.fullName} (${staff.staffNo})` : id;

      await this._deleteStaffUseCase!.execute(id);

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Delete Staff",
        "Staff",
        `Deleted staff member: ${staffInfo}`
      );

      res.status(StatusCode.OK).json({ success: true, message: "Staff deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  public changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { password } = req.body;

      if (!password || typeof password !== "string" || password.trim().length < 6) {
        throw new AppError("Password must be at least 6 characters", StatusCode.BAD_REQUEST);
      }

      const staffRepo = container.resolve<IStaffRepository>("StaffRepository");
      const staff = await staffRepo.findById(id);
      if (!staff) throw new AppError("Staff not found", StatusCode.NOT_FOUND);

      const passwordHash = await bcrypt.hash(password.trim(), 10);
      await staffRepo.update(id, { passwordHash } as any);

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Change Staff Password",
        "Staff",
        `Password changed for staff: ${staff.fullName} (${staff.staffNo})`
      );

      res.status(StatusCode.OK).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  };

  public getSchedules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const staffId = req.params.id;
      const schedules = await ScheduleModel.find({ assignedStaffIds: staffId })
        .sort({ scheduledDate: 1 })
        .lean();

      const data = {
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
      };

      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}

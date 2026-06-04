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
import { AmcVisitModel } from "../models/AmcVisit";

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
          const objectId = new mongoose.Types.ObjectId(staff.id);
          const [complaintsCount, amcVisitsCount] = await Promise.all([
            ComplaintModel.countDocuments({ assignedStaffIds: staff.id, status: { $ne: "Resolved" } }),
            AmcVisitModel.countDocuments({ assignedStaffIds: objectId, status: { $in: ["Scheduled", "Assigned", "Pending"] } })
          ]);
          return {
            ...staff,
            pendingWorksCount: complaintsCount + amcVisitsCount
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

      const data = {
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
      };

      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}

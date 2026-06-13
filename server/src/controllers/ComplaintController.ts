import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IComplaint } from "../interfaces/models/IComplaint";
import { CreateComplaintDto, UpdateComplaintDto } from "../dtos/complaint.dto";
import { GetComplaintsQuery, PaginatedComplaints } from "../interfaces/repositories/IComplaintRepository";
import { StatusCode } from "../constants/statusCodes";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AuditLogger } from "../utils/AuditLogger";
import { ComplaintModel } from "../models/Complaint";

@autoInjectable()
export class ComplaintController {
  constructor(
    @inject("CreateComplaintUseCase")
    private _createComplaintUseCase?: IUseCase<CreateComplaintDto, IComplaint>,
    @inject("GetComplaintsUseCase")
    private _getComplaintsUseCase?: IUseCase<GetComplaintsQuery, PaginatedComplaints>,
    @inject("GetComplaintByIdUseCase")
    private _getComplaintByIdUseCase?: IUseCase<string, IComplaint | null>,
    @inject("UpdateComplaintUseCase")
    private _updateComplaintUseCase?: IUseCase<{ id: string; data: UpdateComplaintDto }, IComplaint | null>,
    @inject("DeleteComplaintUseCase")
    private _deleteComplaintUseCase?: IUseCase<string, boolean>
  ) {}

  public getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [total, pending, inProgress, resolved, critical] = await Promise.all([
        ComplaintModel.countDocuments({}),
        ComplaintModel.countDocuments({ status: "Pending" }),
        ComplaintModel.countDocuments({ status: "In Progress" }),
        ComplaintModel.countDocuments({ status: "Resolved" }),
        ComplaintModel.countDocuments({ priority: "Critical" }),
      ]);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          total,
          pending,
          inProgress,
          resolved,
          critical,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateComplaintDto;
      const complaint = await this._createComplaintUseCase!.execute(dto);

      await AuditLogger.log(
        req.user?.name || "Unknown Admin",
        "Create Complaint",
        "Complaints",
        `Created complaint: ${complaint.complaintNo} - ${complaint.issue}`
      );

      res.status(StatusCode.CREATED).json({
        success: true,
        data: complaint
      });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetComplaintsQuery = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        clientId: req.query.clientId as string | undefined
      };
      const result = await this._getComplaintsUseCase!.execute(query);
      res.status(StatusCode.OK).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const complaint = await this._getComplaintByIdUseCase!.execute(req.params.id);
      if (!complaint) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Complaint not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: complaint });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const dto = req.body as UpdateComplaintDto;
      const complaint = await this._updateComplaintUseCase!.execute({ id, data: dto });
      if (!complaint) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Complaint not found" });
        return;
      }

      await AuditLogger.log(
        req.user?.name || "Unknown Admin",
        "Update Complaint",
        "Complaints",
        `Updated complaint: ${complaint.complaintNo} - ${complaint.issue}`
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: complaint
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const complaint = await this._getComplaintByIdUseCase!.execute(id);
      const complaintNo = complaint ? complaint.complaintNo : id;

      const success = await this._deleteComplaintUseCase!.execute(id);
      if (!success) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Complaint not found" });
        return;
      }

      await AuditLogger.log(
        req.user?.name || "Unknown Admin",
        "Delete Complaint",
        "Complaints",
        `Deleted complaint: ${complaintNo}`
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: "Complaint deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  };
}

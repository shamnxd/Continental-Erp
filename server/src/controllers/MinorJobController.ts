import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IMinorJob } from "../interfaces/models/IMinorJob";
import { CreateMinorJobDto, UpdateMinorJobDto, GetMinorJobsQueryDto } from "../dtos/minorJob.dto";
import { PaginatedMinorJobs } from "../interfaces/repositories/IMinorJobRepository";
import { StatusCode } from "../constants/statusCodes";
import { AuditLogger } from "../utils/AuditLogger";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

@autoInjectable()
export class MinorJobController {
  constructor(
    @inject("CreateMinorJobUseCase") private _createMinorJobUseCase?: IUseCase<CreateMinorJobDto, IMinorJob>,
    @inject("GetMinorJobsUseCase") private _getMinorJobsUseCase?: IUseCase<GetMinorJobsQueryDto, PaginatedMinorJobs>,
    @inject("GetMinorJobByIdUseCase") private _getMinorJobByIdUseCase?: IUseCase<string, IMinorJob | null>,
    @inject("UpdateMinorJobUseCase") private _updateMinorJobUseCase?: IUseCase<{ id: string; data: UpdateMinorJobDto }, IMinorJob | null>,
    @inject("DeleteMinorJobUseCase") private _deleteMinorJobUseCase?: IUseCase<string, boolean>
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const job = await this._createMinorJobUseCase!.execute(req.body);
      
      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Create Minor Job",
        "MinorJobs",
        `Created minor job: ${job.jobNo}`
      );

      res.status(StatusCode.CREATED).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetMinorJobsQueryDto = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string | undefined,
        clientId: req.query.clientId as string | undefined,
      };

      const result = await this._getMinorJobsUseCase!.execute(query);
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await this._getMinorJobByIdUseCase!.execute(req.params.id);
      if (!job) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Minor job not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const job = await this._updateMinorJobUseCase!.execute({
        id: req.params.id,
        data: req.body
      });

      if (!job) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Minor job not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Update Minor Job",
        "MinorJobs",
        `Updated minor job: ${job.jobNo}`
      );

      res.status(StatusCode.OK).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const deleted = await this._deleteMinorJobUseCase!.execute(req.params.id);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Minor job not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Delete Minor Job",
        "MinorJobs",
        `Deleted minor job ID: ${req.params.id}`
      );

      res.status(StatusCode.OK).json({ success: true, message: "Minor job deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}

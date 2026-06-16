import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { ISchedule } from "../interfaces/models/ISchedule";
import { CreateScheduleDto, UpdateScheduleDto, GetSchedulesQuery } from "../dtos/schedule.dto";
import { PaginatedSchedules } from "../interfaces/repositories/IScheduleRepository";
import { StatusCode } from "../constants/statusCodes";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AuditLogger } from "../utils/AuditLogger";
import { IScheduleRepository } from "../interfaces/repositories/IScheduleRepository";

@autoInjectable()
export class ScheduleController {
  constructor(
    @inject("CreateScheduleUseCase")
    private _createScheduleUseCase?: IUseCase<{ data: CreateScheduleDto; user: string }, ISchedule>,
    @inject("GetSchedulesUseCase")
    private _getSchedulesUseCase?: IUseCase<GetSchedulesQuery, PaginatedSchedules>,
    @inject("UpdateScheduleUseCase")
    private _updateScheduleUseCase?: IUseCase<{ id: string; data: UpdateScheduleDto; user: string }, ISchedule | null>,
    @inject("DeleteScheduleUseCase")
    private _deleteScheduleUseCase?: IUseCase<{ id: string; user: string }, boolean>,
    @inject("ScheduleRepository")
    private _scheduleRepository?: IScheduleRepository
  ) {}

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateScheduleDto;
      const user = req.user?.name || "Admin";
      const schedule = await this._createScheduleUseCase!.execute({ data: dto, user });

      await AuditLogger.log(
        user,
        "Create Schedule",
        "Schedules",
        `Created schedule: ${schedule.scheduleType} for ${schedule.entityType} ${schedule.entityNo}`
      );

      res.status(StatusCode.CREATED).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetSchedulesQuery = {
        entityType: req.query.entityType as any,
        entityId: req.query.entityId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 1000
      };
      const result = await this._getSchedulesUseCase!.execute(query);
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
      const { id } = req.params;
      const schedule = await this._scheduleRepository!.findById(id);
      if (!schedule) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Schedule not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const dto = req.body as UpdateScheduleDto;
      const user = req.user?.name || "Admin";
      const schedule = await this._updateScheduleUseCase!.execute({ id, data: dto, user });
      if (!schedule) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Schedule not found" });
        return;
      }

      await AuditLogger.log(
        user,
        "Update Schedule",
        "Schedules",
        `Updated schedule: ${schedule.scheduleType} for ${schedule.entityType} ${schedule.entityNo}`
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const user = req.user?.name || "Admin";

      const success = await this._deleteScheduleUseCase!.execute({ id, user });
      if (!success) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Schedule not found" });
        return;
      }

      await AuditLogger.log(
        user,
        "Delete Schedule",
        "Schedules",
        `Deleted schedule with ID: ${id}`
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: "Schedule deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  };
}

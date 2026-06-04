import { Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IAuditLogRepository } from "../interfaces/repositories/IAuditLogRepository";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusCode } from "../constants/statusCodes";
import { AppError } from "../errors/AppError";

@autoInjectable()
export class AuditLogController {
  constructor(
    @inject("AuditLogRepository")
    private _auditLogRepository?: IAuditLogRepository
  ) {}

  public getLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Double check permission
      if (req.user?.permissions && !req.user.permissions.administration) {
        throw new AppError("Access denied: Administration permission required", StatusCode.FORBIDDEN);
      }

      const { search, module, user, page, limit } = req.query;

      const parsedPage = page ? parseInt(page as string, 10) : 1;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 15;

      const result = await this._auditLogRepository!.findPaginated({
        search: search as string,
        module: module as string,
        user: user as string,
        page: parsedPage,
        limit: parsedLimit,
      });

      res.status(StatusCode.OK).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        counts: result.counts,
      });
    } catch (error) {
      next(error);
    }
  };
}

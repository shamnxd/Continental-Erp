import { Response, NextFunction } from "express";
import { container } from "tsyringe";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ILeaveRequestRepository } from "../interfaces/repositories/ILeaveRequestRepository";
import { LeaveStatus } from "../interfaces/models/ILeaveRequest";
import { AppError } from "../errors/AppError";
import { StatusCode } from "../constants/statusCodes";
import { AuditLogger } from "../utils/AuditLogger";

export class LeaveController {
  /** GET /api/v1/leaves */
  public getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const leaveRepo = container.resolve<ILeaveRequestRepository>("LeaveRequestRepository");
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
      const status = req.query.status as string | undefined;
      const staffId = req.query.staffId as string | undefined;

      const result = await leaveRepo.findPaginated({ staffId, status, page, limit });
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  /** PUT /api/v1/leaves/:id/status */
  public updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body;

      const validStatuses: LeaveStatus[] = ["Approved", "Rejected", "Pending"];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, StatusCode.BAD_REQUEST);
      }

      const leaveRepo = container.resolve<ILeaveRequestRepository>("LeaveRequestRepository");
      const updated = await leaveRepo.updateStatus(id, status as LeaveStatus, adminNote);
      if (!updated) throw new AppError("Leave request not found", StatusCode.NOT_FOUND);

      await AuditLogger.log(
        req.user?.name || "Admin",
        "Leave Request Decision",
        "Administration",
        `Leave request for ${updated.staffName} (${updated.staffNo}) was ${status}${adminNote ? ` with note: "${adminNote}"` : ""}`
      );

      res.status(StatusCode.OK).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };
}

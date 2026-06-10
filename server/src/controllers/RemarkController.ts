import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IRemark, RemarkEntityType } from "../interfaces/models/IRemark";
import { AddRemarkDto } from "../dtos/remark.dto";
import { AddRemarkInput } from "../usecases/remarks/AddRemarkUseCase";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusCode } from "../constants/statusCodes";
import { persistUploadedFile } from "../usecases/enquiries/AddEnquiryDrawingUseCase";

@autoInjectable()
export class RemarkController {
  constructor(
    @inject("GetRemarksUseCase")
    private _getRemarksUseCase?: IUseCase<{ entityType: RemarkEntityType; entityId: string }, IRemark[]>,
    @inject("AddRemarkUseCase")
    private _addRemarkUseCase?: IUseCase<AddRemarkInput, IRemark>,
  ) {}

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { entityType, entityId } = req.query as { entityType: string; entityId: string };
      if (!entityType || !entityId) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "entityType and entityId are required" });
        return;
      }
      const remarks = await this._getRemarksUseCase!.execute({
        entityType: entityType as RemarkEntityType,
        entityId,
      });
      res.status(StatusCode.OK).json({ success: true, data: remarks });
    } catch (error) {
      next(error);
    }
  };

  public add = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user?.name || "Admin";
      const data = req.body as AddRemarkDto;

      let attachment = undefined;
      if (req.file) {
        const stored = await persistUploadedFile(req.file, `remarks/${data.entityType}/${data.entityId}`);
        attachment = {
          name: stored.originalName,
          url: stored.url,
          mimeType: stored.mimeType,
          size: stored.size,
        };
      }

      const remark = await this._addRemarkUseCase!.execute({ data, user, attachment });
      res.status(StatusCode.CREATED).json({ success: true, data: remark });
    } catch (error) {
      next(error);
    }
  };
}

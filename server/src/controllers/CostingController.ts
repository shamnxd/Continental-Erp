import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { ICosting } from "../interfaces/models/ICosting";
import { CreateCostingDto, UpdateCostingDto } from "../dtos/costing.dto";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusCode } from "../constants/statusCodes";
import { AuditLogger } from "../utils/AuditLogger";

@autoInjectable()
export class CostingController {
  constructor(
    @inject("CreateCostingUseCase")
    private _createCostingUseCase?: IUseCase<{ data: CreateCostingDto }, ICosting>,
    @inject("GetCostingsByEnquiryIdUseCase")
    private _getCostingsByEnquiryIdUseCase?: IUseCase<string, ICosting[]>,
    @inject("CreateCostingRevisionUseCase")
    private _createCostingRevisionUseCase?: IUseCase<{ id: string; preparedBy: string }, ICosting>,
    @inject("UpdateCostingUseCase")
    private _updateCostingUseCase?: IUseCase<{ id: string; data: UpdateCostingDto }, ICosting | null>
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const costing = await this._createCostingUseCase!.execute({
        data: req.body as CreateCostingDto,
      });

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Create Costing",
        "Costings",
        `Created costing sheet: Rev ${costing.revision} for Enquiry ${costing.enquiryNo}`
      );

      res.status(StatusCode.CREATED).json({ success: true, data: costing });
    } catch (error) {
      next(error);
    }
  };

  public getByEnquiryId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const costings = await this._getCostingsByEnquiryIdUseCase!.execute(req.params.enquiryId);
      res.status(StatusCode.OK).json({ success: true, data: costings });
    } catch (error) {
      next(error);
    }
  };

  public createRevision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const costing = await this._createCostingRevisionUseCase!.execute({
        id: req.params.id,
        preparedBy: authReq.user?.name || "Admin"
      });

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Create Costing Revision",
        "Costings",
        `Created costing sheet revision: Rev ${costing.revision} for Enquiry ${costing.enquiryNo}`
      );

      res.status(StatusCode.CREATED).json({ success: true, data: costing });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const costing = await this._updateCostingUseCase!.execute({
        id: req.params.id,
        data: req.body as UpdateCostingDto,
      });

      if (!costing) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Costing not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Update Costing",
        "Costings",
        `Updated costing sheet: Rev ${costing.revision} for Enquiry ${costing.enquiryNo}`
      );

      res.status(StatusCode.OK).json({ success: true, data: costing });
    } catch (error) {
      next(error);
    }
  };
}

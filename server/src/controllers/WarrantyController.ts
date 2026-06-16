import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IWarranty } from "../interfaces/models/IWarranty";
import { CreateWarrantyDto, UpdateWarrantyDto, GetWarrantiesQueryDto } from "../dtos/warranty.dto";
import { PaginatedWarranties, IWarrantyRepository } from "../interfaces/repositories/IWarrantyRepository";
import { StatusCode } from "../constants/statusCodes";
import { AuditLogger } from "../utils/AuditLogger";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

@autoInjectable()
export class WarrantyController {
  constructor(
    @inject("CreateWarrantyUseCase") private _createWarrantyUseCase?: IUseCase<CreateWarrantyDto, IWarranty>,
    @inject("GetWarrantiesUseCase") private _getWarrantiesUseCase?: IUseCase<GetWarrantiesQueryDto, PaginatedWarranties>,
    @inject("GetWarrantyByIdUseCase") private _getWarrantyByIdUseCase?: IUseCase<string, IWarranty | null>,
    @inject("UpdateWarrantyUseCase") private _updateWarrantyUseCase?: IUseCase<{ id: string; data: UpdateWarrantyDto }, IWarranty | null>,
    @inject("WarrantyRepository") private _warrantyRepository?: IWarrantyRepository
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const warranty = await this._createWarrantyUseCase!.execute(req.body);

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Create Warranty",
        "Warranties",
        `Created warranty: ${warranty.warrantyNo} for product ${warranty.product}`
      );

      res.status(StatusCode.CREATED).json({ success: true, data: warranty });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetWarrantiesQueryDto = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string | undefined,
        clientId: req.query.clientId as string | undefined,
        projectId: req.query.projectId as string | undefined,
      };

      const result = await this._getWarrantiesUseCase!.execute(query);
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const warranty = await this._getWarrantyByIdUseCase!.execute(req.params.id);
      if (!warranty) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Warranty not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: warranty });
    } catch (error) {
      next(error);
    }
  };

  public getByProjectId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const warranty = await this._warrantyRepository!.findByProjectId(req.params.projectId);
      if (!warranty) {
        res.status(StatusCode.OK).json({ success: true, data: null });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: warranty });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const warranty = await this._updateWarrantyUseCase!.execute({
        id: req.params.id,
        data: req.body,
      });

      if (!warranty) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Warranty not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Update Warranty",
        "Warranties",
        `Updated warranty: ${warranty.warrantyNo}`
      );

      res.status(StatusCode.OK).json({ success: true, data: warranty });
    } catch (error) {
      next(error);
    }
  };
}

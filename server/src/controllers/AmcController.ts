import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IAmc } from "../interfaces/models/IAmc";
import { ISMR } from "../interfaces/models/ISMR";
import { CreateAmcDto, UpdateAmcDto } from "../dtos/amc.dto";
import { ScheduleAmcVisitDto, UpdateAmcVisitDto } from "../dtos/amcVisit.dto";
import { AddAmcRemarkDto, RecordAmcPaymentDto } from "../dtos/amcRemark.dto";
import { EditEnquiryRemarkDto } from "../dtos/enquiryRemark.dto";
import { GetAmcQuery, PaginatedAmc } from "../interfaces/repositories/IAmcRepository";
import { IAmcVisit } from "../interfaces/models/IAmcVisit";
import { ISMRRepository } from "../interfaces/repositories/ISMRRepository";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusCode } from "../constants/statusCodes";

@autoInjectable()
export class AmcController {
  constructor(
    @inject("CreateAmcUseCase") private _createAmcUseCase?: IUseCase<CreateAmcDto, IAmc>,
    @inject("GetAmcUseCase") private _getAmcUseCase?: IUseCase<GetAmcQuery, PaginatedAmc>,
    @inject("GetAmcByIdUseCase") private _getAmcByIdUseCase?: IUseCase<string, IAmc | null>,
    @inject("UpdateAmcUseCase") private _updateAmcUseCase?: IUseCase<{ id: string; data: UpdateAmcDto }, IAmc | null>,
    @inject("DeleteAmcUseCase") private _deleteAmcUseCase?: IUseCase<string, boolean>,
    @inject("GetAmcVisitsUseCase") private _getAmcVisitsUseCase?: IUseCase<string, IAmcVisit[]>,
    @inject("ScheduleAmcVisitUseCase")
    private _scheduleAmcVisitUseCase?: IUseCase<{ amcId: string; data: ScheduleAmcVisitDto }, IAmcVisit>,
    @inject("UpdateAmcVisitUseCase")
    private _updateAmcVisitUseCase?: IUseCase<
      { amcId: string; visitId: string; data: UpdateAmcVisitDto },
      IAmcVisit | null
    >,
    @inject("AddAmcRemarkUseCase")
    private _addAmcRemarkUseCase?: IUseCase<
      { amcId: string; data: AddAmcRemarkDto; user: string },
      IAmc | null
    >,
    @inject("RecordAmcPaymentUseCase")
    private _recordAmcPaymentUseCase?: IUseCase<
      { amcId: string; data: RecordAmcPaymentDto; user: string },
      IAmc | null
    >,
    @inject("SMRRepository") private _smrRepository?: ISMRRepository,
    @inject("EditAmcRemarkUseCase")
    private _editAmcRemarkUseCase?: IUseCase<
      { amcId: string; remarkKey: string; data: EditEnquiryRemarkDto; user: string },
      IAmc | null
    >,
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const amc = await this._createAmcUseCase!.execute(req.body as CreateAmcDto);
      res.status(StatusCode.CREATED).json({ success: true, data: amc });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetAmcQuery = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string | undefined,
        clientId: req.query.clientId as string | undefined
      };
      const result = await this._getAmcUseCase!.execute(query);
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const amc = await this._getAmcByIdUseCase!.execute(req.params.id);
      if (!amc) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "AMC contract not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: amc });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const amc = await this._updateAmcUseCase!.execute({
        id: req.params.id,
        data: req.body as UpdateAmcDto
      });
      if (!amc) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "AMC contract not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: amc });
    } catch (error) {
      next(error);
    }
  };

  public getVisits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const visits = await this._getAmcVisitsUseCase!.execute(req.params.id);
      res.status(StatusCode.OK).json({ success: true, data: visits });
    } catch (error) {
      next(error);
    }
  };

  public scheduleVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const visit = await this._scheduleAmcVisitUseCase!.execute({
        amcId: req.params.id,
        data: req.body as ScheduleAmcVisitDto
      });
      res.status(StatusCode.CREATED).json({ success: true, data: visit });
    } catch (error) {
      next(error);
    }
  };

  public updateVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const visit = await this._updateAmcVisitUseCase!.execute({
        amcId: req.params.id,
        visitId: req.params.visitId,
        data: req.body as UpdateAmcVisitDto
      });
      if (!visit) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Visit not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: visit });
    } catch (error) {
      next(error);
    }
  };

  public editRemark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const amc = await this._editAmcRemarkUseCase!.execute({
        amcId: req.params.id,
        remarkKey: req.params.remarkId,
        data: req.body as EditEnquiryRemarkDto,
        user: authReq.user?.name || "Admin",
      });
      if (!amc) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "AMC contract or remark not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: amc });
    } catch (error) {
      next(error);
    }
  };

  public addRemark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const amc = await this._addAmcRemarkUseCase!.execute({
        amcId: req.params.id,
        data: req.body as AddAmcRemarkDto,
        user: authReq.user?.name || "Admin"
      });
      if (!amc) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "AMC contract not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: amc });
    } catch (error) {
      next(error);
    }
  };

  public recordPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const amc = await this._recordAmcPaymentUseCase!.execute({
        amcId: req.params.id,
        data: req.body as RecordAmcPaymentDto,
        user: authReq.user?.name || "Admin"
      });
      if (!amc) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "AMC contract not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: amc });
    } catch (error) {
      next(error);
    }
  };

  public getVisitSmr = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const smr = await this._smrRepository!.findByAmcVisitId(req.params.visitId);
      if (!smr) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "SMR not found for this visit" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: smr });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this._deleteAmcUseCase!.execute(req.params.id);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "AMC contract not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, message: "AMC contract deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}

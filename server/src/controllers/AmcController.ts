import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IAmc } from "../interfaces/models/IAmc";
import { ISMR } from "../interfaces/models/ISMR";
import { CreateAmcDto, UpdateAmcDto } from "../dtos/amc.dto";
import { AddAmcRemarkDto, RecordAmcPaymentDto } from "../dtos/amcRemark.dto";
import { EditEnquiryRemarkDto } from "../dtos/enquiryRemark.dto";
import { GetAmcQuery, PaginatedAmc } from "../interfaces/repositories/IAmcRepository";
import { ISMRRepository } from "../interfaces/repositories/ISMRRepository";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusCode } from "../constants/statusCodes";
import { AuditLogger } from "../utils/AuditLogger";
import { AmcModel } from "../models/Amc";

@autoInjectable()
export class AmcController {
  constructor(
    @inject("CreateAmcUseCase") private _createAmcUseCase?: IUseCase<CreateAmcDto, IAmc>,
    @inject("GetAmcUseCase") private _getAmcUseCase?: IUseCase<GetAmcQuery, PaginatedAmc>,
    @inject("GetAmcByIdUseCase") private _getAmcByIdUseCase?: IUseCase<string, IAmc | null>,
    @inject("UpdateAmcUseCase") private _updateAmcUseCase?: IUseCase<{ id: string; data: UpdateAmcDto }, IAmc | null>,
    @inject("DeleteAmcUseCase") private _deleteAmcUseCase?: IUseCase<string, boolean>,
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

  public getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [total, active, renewal, expired] = await Promise.all([
        AmcModel.countDocuments({}),
        AmcModel.countDocuments({ status: "Active" }),
        AmcModel.countDocuments({ status: "Due for Renewal" }),
        AmcModel.countDocuments({ status: "Expired" }),
      ]);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          total,
          active,
          renewal,
          expired,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const amc = await this._createAmcUseCase!.execute(req.body as CreateAmcDto);

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Create AMC Contract",
        "AMC",
        `Created AMC contract: ${amc.amcNo} for client ${amc.clientName}`
      );

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
      const authReq = req as AuthenticatedRequest;
      const amc = await this._updateAmcUseCase!.execute({
        id: req.params.id,
        data: req.body as UpdateAmcDto
      });
      if (!amc) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "AMC contract not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Update AMC Contract",
        "AMC",
        `Updated AMC contract: ${amc.amcNo}`
      );

      res.status(StatusCode.OK).json({ success: true, data: amc });
    } catch (error) {
      next(error);
    }
  };

  public getVisits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ScheduleModel } = require("../models/Schedule");
      const schedules = await ScheduleModel.find({ entityType: "amc", entityId: req.params.id })
        .sort({ scheduledDate: 1 })
        .lean();

      const visits = schedules.map((s: any) => ({
        id: s._id.toString(),
        scheduledDate: s.scheduledDate,
        status: s.status,
        notes: s.notes,
        assignedStaffIds: s.assignedStaffIds,
        smrId: s.smrId,
      }));
      res.status(StatusCode.OK).json({ success: true, data: visits });
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

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Edit AMC Remark",
        "AMC",
        `Edited a remark on AMC contract: ${amc.amcNo}`
      );

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

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Add AMC Remark",
        "AMC",
        `Added a remark to AMC contract: ${amc.amcNo}`
      );

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

      const latestPayment = req.body as RecordAmcPaymentDto;
      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Record AMC Payment",
        "AMC",
        `Recorded payment of amount $${latestPayment.amount} (Type: ${latestPayment.type}, Note: ${latestPayment.note || "None"}) for AMC contract: ${amc.amcNo}`
      );

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
      const authReq = req as AuthenticatedRequest;
      const id = req.params.id;
      const amc = await this._getAmcByIdUseCase!.execute(id);
      const amcNo = amc ? amc.amcNo : id;

      const deleted = await this._deleteAmcUseCase!.execute(id);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "AMC contract not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Delete AMC Contract",
        "AMC",
        `Deleted AMC contract: ${amcNo}`
      );

      res.status(StatusCode.OK).json({ success: true, message: "AMC contract deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}

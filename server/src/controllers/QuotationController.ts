import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IQuotation } from "../interfaces/models/IQuotation";
import { CreateQuotationDto, UpdateQuotationDto } from "../dtos/quotation.dto";
import { AddQuotationRemarkDto, EditQuotationRemarkDto } from "../dtos/quotationRemark.dto";
import { GetQuotationsQuery, PaginatedQuotations } from "../interfaces/repositories/IQuotationRepository";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusCode } from "../constants/statusCodes";
import { AuditLogger } from "../utils/AuditLogger";
import { QuotationModel } from "../models/Quotation";

@autoInjectable()
export class QuotationController {
  constructor(
    @inject("CreateQuotationUseCase")
    private _createQuotationUseCase?: IUseCase<CreateQuotationDto, IQuotation>,
    @inject("CreateQuotationRevisionUseCase")
    private _createQuotationRevisionUseCase?: IUseCase<{ id: string }, IQuotation>,
    @inject("GetQuotationsUseCase")
    private _getQuotationsUseCase?: IUseCase<GetQuotationsQuery, PaginatedQuotations>,
    @inject("GetQuotationByIdUseCase")
    private _getQuotationByIdUseCase?: IUseCase<string, IQuotation | null>,
    @inject("UpdateQuotationUseCase")
    private _updateQuotationUseCase?: IUseCase<{ id: string; data: UpdateQuotationDto }, IQuotation | null>,
    @inject("DeleteQuotationUseCase")
    private _deleteQuotationUseCase?: IUseCase<string, boolean>,
    @inject("AddQuotationRemarkUseCase")
    private _addQuotationRemarkUseCase?: IUseCase<
      { quotationId: string; data: AddQuotationRemarkDto; user: string },
      IQuotation | null
    >,
    @inject("EditQuotationRemarkUseCase")
    private _editQuotationRemarkUseCase?: IUseCase<
      { quotationId: string; remarkKey: string; data: EditQuotationRemarkDto; user: string },
      IQuotation | null
    >,
  ) {}

  public getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [total, pending, approved, rejected, draft] = await Promise.all([
        QuotationModel.countDocuments({}),
        QuotationModel.countDocuments({ status: "Pending Approval" }),
        QuotationModel.countDocuments({ status: "Approved" }),
        QuotationModel.countDocuments({ status: "Rejected" }),
        QuotationModel.countDocuments({ status: "Draft" }),
      ]);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          total,
          pending,
          approved,
          rejected,
          draft,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const quotation = await this._createQuotationUseCase!.execute(req.body as CreateQuotationDto);

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Create Quotation",
        "Clients",
        `Created quotation: ${quotation.quotationNo} for client ${quotation.clientName}`
      );

      res.status(StatusCode.CREATED).json({ success: true, data: quotation });
    } catch (error) {
      next(error);
    }
  };

  public createRevision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const quotation = await this._createQuotationRevisionUseCase!.execute({
        id: req.params.id,
      });

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Create Quotation Revision",
        "Clients",
        `Created revision Rev ${quotation.revision} for quotation: ${quotation.quotationNo}`
      );

      res.status(StatusCode.CREATED).json({ success: true, data: quotation });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetQuotationsQuery = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string | undefined,
        clientId: req.query.clientId as string | undefined,
        enquiryId: req.query.enquiryId as string | undefined,
        quotationNo: req.query.quotationNo as string | undefined,
        allRevisions: req.query.allRevisions as string | undefined,
      };
      const result = await this._getQuotationsUseCase!.execute(query);
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quotation = await this._getQuotationByIdUseCase!.execute(req.params.id);
      if (!quotation) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Quotation not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: quotation });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const quotation = await this._updateQuotationUseCase!.execute({
        id: req.params.id,
        data: req.body as UpdateQuotationDto,
      });
      if (!quotation) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Quotation not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Update Quotation",
        "Clients",
        `Updated quotation: ${quotation.quotationNo}`
      );

      res.status(StatusCode.OK).json({ success: true, data: quotation });
    } catch (error) {
      next(error);
    }
  };

  public addRemark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const quotation = await this._addQuotationRemarkUseCase!.execute({
        quotationId: req.params.id,
        data: req.body as AddQuotationRemarkDto,
        user: authReq.user?.name || "Admin",
      });
      if (!quotation) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Quotation not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Add Quotation Remark",
        "Clients",
        `Added a remark to quotation: ${quotation.quotationNo}`
      );

      res.status(StatusCode.OK).json({ success: true, data: quotation });
    } catch (error) {
      next(error);
    }
  };

  public editRemark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const quotation = await this._editQuotationRemarkUseCase!.execute({
        quotationId: req.params.id,
        remarkKey: req.params.remarkId,
        data: req.body as EditQuotationRemarkDto,
        user: authReq.user?.name || "Admin",
      });
      if (!quotation) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Quotation or remark not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Edit Quotation Remark",
        "Clients",
        `Edited a remark on quotation: ${quotation.quotationNo}`
      );

      res.status(StatusCode.OK).json({ success: true, data: quotation });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const id = req.params.id;
      const quotation = await this._getQuotationByIdUseCase!.execute(id);
      const quotationNo = quotation ? quotation.quotationNo : id;

      const deleted = await this._deleteQuotationUseCase!.execute(id);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Quotation not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Delete Quotation",
        "Clients",
        `Deleted quotation: ${quotationNo}`
      );

      res.status(StatusCode.OK).json({ success: true, message: "Quotation deleted" });
    } catch (error) {
      next(error);
    }
  };
}

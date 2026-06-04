import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IEnquiry } from "../interfaces/models/IEnquiry";
import { CreateEnquiryDto, UpdateEnquiryDto } from "../dtos/enquiry.dto";
import { AddEnquiryRemarkDto, EditEnquiryRemarkDto } from "../dtos/enquiryRemark.dto";
import { GetEnquiriesQuery, PaginatedEnquiries } from "../interfaces/repositories/IEnquiryRepository";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusCode } from "../constants/statusCodes";
import {
  AddEnquiryDrawingUseCase,
  AddEnquiryDrawingInput,
  persistUploadedFile,
} from "../usecases/enquiries/AddEnquiryDrawingUseCase";

@autoInjectable()
export class EnquiryController {
  constructor(
    @inject("CreateEnquiryUseCase")
    private _createEnquiryUseCase?: IUseCase<{ data: CreateEnquiryDto; user: string }, IEnquiry>,
    @inject("GetEnquiriesUseCase")
    private _getEnquiriesUseCase?: IUseCase<GetEnquiriesQuery, PaginatedEnquiries>,
    @inject("GetEnquiryByIdUseCase")
    private _getEnquiryByIdUseCase?: IUseCase<string, IEnquiry | null>,
    @inject("UpdateEnquiryUseCase")
    private _updateEnquiryUseCase?: IUseCase<
      { id: string; data: UpdateEnquiryDto; user: string },
      IEnquiry | null
    >,
    @inject("DeleteEnquiryUseCase")
    private _deleteEnquiryUseCase?: IUseCase<string, boolean>,
    @inject("AddEnquiryRemarkUseCase")
    private _addEnquiryRemarkUseCase?: IUseCase<
      { enquiryId: string; data: AddEnquiryRemarkDto; user: string },
      IEnquiry | null
    >,
    @inject("AddEnquiryDrawingUseCase")
    private _addEnquiryDrawingUseCase?: IUseCase<AddEnquiryDrawingInput, IEnquiry | null>,
    @inject("EditEnquiryRemarkUseCase")
    private _editEnquiryRemarkUseCase?: IUseCase<
      { enquiryId: string; remarkKey: string; data: EditEnquiryRemarkDto; user: string },
      IEnquiry | null
    >,
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const enquiry = await this._createEnquiryUseCase!.execute({
        data: req.body as CreateEnquiryDto,
        user: authReq.user?.name || "Admin",
      });
      res.status(StatusCode.CREATED).json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetEnquiriesQuery = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        clientId: req.query.clientId as string | undefined,
      };
      const result = await this._getEnquiriesUseCase!.execute(query);
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enquiry = await this._getEnquiryByIdUseCase!.execute(req.params.id);
      if (!enquiry) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Enquiry not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const enquiry = await this._updateEnquiryUseCase!.execute({
        id: req.params.id,
        data: req.body as UpdateEnquiryDto,
        user: authReq.user?.name || "Admin",
      });
      if (!enquiry) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Enquiry not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  };

  public uploadDrawing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const file = req.file;
      if (!file) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "No file uploaded" });
        return;
      }

      const enquiryId = req.params.id;
      const storedFile = await persistUploadedFile(file, `enquiries/${enquiryId}`);

      const enquiry = await this._addEnquiryDrawingUseCase!.execute({
        enquiryId,
        storedFile,
        user: authReq.user?.name || "Admin",
      });

      if (!enquiry) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Enquiry not found" });
        return;
      }

      res.status(StatusCode.OK).json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  };

  public editRemark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const enquiry = await this._editEnquiryRemarkUseCase!.execute({
        enquiryId: req.params.id,
        remarkKey: req.params.remarkId,
        data: req.body as EditEnquiryRemarkDto,
        user: authReq.user?.name || "Admin",
      });
      if (!enquiry) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Enquiry or remark not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  };

  public addRemark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const enquiry = await this._addEnquiryRemarkUseCase!.execute({
        enquiryId: req.params.id,
        data: req.body as AddEnquiryRemarkDto,
        user: authReq.user?.name || "Admin",
      });
      if (!enquiry) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Enquiry not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: enquiry });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this._deleteEnquiryUseCase!.execute(req.params.id);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Enquiry not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, message: "Enquiry deleted" });
    } catch (error) {
      next(error);
    }
  };
}

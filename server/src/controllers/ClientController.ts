import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IClient } from "../interfaces/models/IClient";
import { CreateClientDto, UpdateClientDto } from "../dtos/client.dto";
import { GetClientsQuery, PaginatedClients } from "../interfaces/repositories/IClientRepository";
import { StatusCode } from "../constants/statusCodes";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AuditLogger } from "../utils/AuditLogger";
import { ClientModel } from "../models/Client";
import { ComplaintModel } from "../models/Complaint";
import { EnquiryModel } from "../models/Enquiry";
import { ClientInvoiceModel } from "../models/ClientInvoice";
import { getFileStorage } from "../storage";

@autoInjectable()
export class ClientController {
  constructor(
    @inject("CreateClientUseCase")
    private _createClientUseCase?: IUseCase<CreateClientDto, IClient>,
    @inject("GetClientsUseCase")
    private _getClientsUseCase?: IUseCase<GetClientsQuery, PaginatedClients>,
    @inject("GetClientByIdUseCase")
    private _getClientByIdUseCase?: IUseCase<string, IClient | null>,
    @inject("UpdateClientUseCase")
    private _updateClientUseCase?: IUseCase<{ id: string; data: UpdateClientDto }, IClient>,
    @inject("DeleteClientUseCase")
    private _deleteClientUseCase?: IUseCase<string, boolean>
  ) {}

  public getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [activeComplaintsList, activeEnquiriesList] = await Promise.all([
        ComplaintModel.find({ status: { $in: ["Pending", "In Progress"] } }).select("clientName").exec(),
        EnquiryModel.find({ status: { $in: ["Site Visit Scheduled", "Quotation Prepared", "Follow-up Required"] } }).select("clientName").exec(),
      ]);

      const complaintNames = Array.from(new Set(activeComplaintsList.map(c => c.clientName?.trim()).filter(Boolean)));
      const enquiryNames = Array.from(new Set(activeEnquiriesList.map(e => e.clientName?.trim()).filter(Boolean)));

      const [total, activeAmc, expiredAmc, activeComplaintsCount, activeEnquiriesCount] = await Promise.all([
        ClientModel.countDocuments({}),
        ClientModel.countDocuments({ amcStatus: "Active" }),
        ClientModel.countDocuments({ amcStatus: "Expired" }),
        ClientModel.countDocuments({ companyName: { $in: complaintNames } }),
        ClientModel.countDocuments({ companyName: { $in: enquiryNames } }),
      ]);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          total,
          activeAmc,
          expiredAmc,
          activeComplaints: activeComplaintsCount,
          activeEnquiries: activeEnquiriesCount,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateClientDto;
      const client = await this._createClientUseCase!.execute(dto);

      await AuditLogger.log(
        req.user?.name || "Unknown Admin",
        "Create Client",
        "Clients",
        `Created client: ${client.companyName} (${client.contactPerson})`
      );

      res.status(StatusCode.CREATED).json({
        success: true,
        data: client
      });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetClientsQuery = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        filter: req.query.filter as GetClientsQuery["filter"] | undefined,
        companyNames: req.query.companyNames
          ? (req.query.companyNames as string).split(",").map((n) => n.trim()).filter(Boolean)
          : undefined,
      };
      const result = await this._getClientsUseCase!.execute(query);
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
      const client = await this._getClientByIdUseCase!.execute(req.params.id);
      if (!client) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Client not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const dto = req.body as UpdateClientDto;
      const client = await this._updateClientUseCase!.execute({ id, data: dto });

      await AuditLogger.log(
        req.user?.name || "Unknown Admin",
        "Update Client",
        "Clients",
        `Updated client: ${client.companyName} (${client.contactPerson})`
      );

      res.status(StatusCode.OK).json({
        success: true,
        data: client
      });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      const client = await this._getClientByIdUseCase!.execute(id);
      const clientInfo = client ? `${client.companyName} (${client.contactPerson})` : id;

      await this._deleteClientUseCase!.execute(id);

      await AuditLogger.log(
        req.user?.name || "Unknown Admin",
        "Delete Client",
        "Clients",
        `Deleted client: ${clientInfo}`
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: "Client deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  public getParentCompanyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parentCompany = req.query.parentCompany as string | undefined;

      if (!parentCompany || !parentCompany.trim()) {
        // Return summary list of all unique parent companies
        const parentCompanies = await ClientModel.aggregate([
          {
            $match: {
              parentCompany: { $nin: [null, ""] }
            }
          },
          {
            $group: {
              _id: "$parentCompany",
              branchesCount: { $sum: 1 },
              totalProjects: { $sum: "$projectsCount" },
              activeAmcCount: {
                $sum: {
                  $cond: [{ $eq: ["$amcStatus", "Active"] }, 1, 0]
                }
              }
            }
          },
          {
            $project: {
              _id: 0,
              parentCompany: "$_id",
              branchesCount: 1,
              totalProjects: 1,
              activeAmc: "$activeAmcCount"
            }
          },
          {
            $sort: { parentCompany: 1 }
          }
        ]).exec();

        res.status(StatusCode.OK).json({
          success: true,
          data: parentCompanies
        });
        return;
      }

      // Detailed company report
      const trimmedParent = parentCompany.trim();
      const branches = await ClientModel.find({ parentCompany: trimmedParent }).exec();

      const branchDetails = await Promise.all(
        branches.map(async (branch) => {
          const [activeComplaintsCount, activeEnquiriesCount, invoices] = await Promise.all([
            ComplaintModel.countDocuments({
              $or: [{ clientId: branch._id.toString() }, { clientName: branch.companyName }],
              status: { $in: ["Pending", "In Progress"] }
            }),
            EnquiryModel.countDocuments({
              $or: [{ clientId: branch._id.toString() }, { clientName: branch.companyName }],
              status: { $in: ["Site Visit Scheduled", "Quotation Prepared", "Follow-up Required"] }
            }),
            ClientInvoiceModel.find({
              clientName: branch.companyName,
              documentStatus: "Approved"
            }).select("grandTotal").exec()
          ]);

          const revenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

          return {
            id: branch._id.toString(),
            companyName: branch.companyName,
            city: branch.city,
            contactPerson: branch.contactPerson,
            projectsCount: branch.projectsCount,
            amcStatus: branch.amcStatus,
            activeComplaintsCount,
            activeEnquiriesCount,
            revenue,
            logoUrl: branch.logoUrl || ""
          };
        })
      );

      // Consolidated metrics
      const totalBranches = branches.length;
      const totalProjects = branchDetails.reduce((sum, b) => sum + b.projectsCount, 0);
      const totalActiveAmc = branchDetails.filter(b => b.amcStatus === "Active").length;
      const totalPendingComplaints = branchDetails.reduce((sum, b) => sum + b.activeComplaintsCount, 0);
      const totalActiveEnquiries = branchDetails.reduce((sum, b) => sum + b.activeEnquiriesCount, 0);
      const totalRevenue = branchDetails.reduce((sum, b) => sum + b.revenue, 0);

      res.status(StatusCode.OK).json({
        success: true,
        data: {
          overview: {
            totalBranches,
            totalProjects,
            totalActiveAmc,
            totalPendingComplaints,
            totalActiveEnquiries,
            totalRevenue
          },
          branches: branchDetails
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public uploadLogo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "No logo file uploaded" });
        return;
      }
      const storage = getFileStorage();
      const stored = await storage.save({
        tempPath: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        folder: "logos"
      });
      res.status(StatusCode.OK).json({ success: true, url: stored.url });
    } catch (error) {
      next(error);
    }
  };
}

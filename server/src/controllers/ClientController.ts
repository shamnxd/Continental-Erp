import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IClient } from "../interfaces/models/IClient";
import { CreateClientDto, UpdateClientDto } from "../dtos/client.dto";
import { GetClientsQuery, PaginatedClients } from "../interfaces/repositories/IClientRepository";
import { StatusCode } from "../constants/statusCodes";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { AuditLogger } from "../utils/AuditLogger";

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
}

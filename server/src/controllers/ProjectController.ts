import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { IProject } from "../interfaces/models/IProject";
import { IPurchaseOrder } from "../interfaces/models/IPurchaseOrder";
import { CreateProjectDto, UpdateProjectDto, GetProjectsQueryDto } from "../dtos/project.dto";
import { PaginatedProjects, IProjectRepository } from "../interfaces/repositories/IProjectRepository";
import { IProjectTaskRepository } from "../interfaces/repositories/IProjectTaskRepository";
import { ISubcontractRepository } from "../interfaces/repositories/ISubcontractRepository";
import { IPurchaseOrderRepository } from "../interfaces/repositories/IPurchaseOrderRepository";
import { StatusCode } from "../constants/statusCodes";
import { AuditLogger } from "../utils/AuditLogger";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { persistUploadedFile } from "../usecases/enquiries/AddEnquiryDrawingUseCase";

@autoInjectable()
export class ProjectController {
  constructor(
    @inject("CreateProjectUseCase") private _createProjectUseCase?: IUseCase<CreateProjectDto, IProject>,
    @inject("GetProjectsUseCase") private _getProjectsUseCase?: IUseCase<GetProjectsQueryDto, PaginatedProjects>,
    @inject("GetProjectByIdUseCase") private _getProjectByIdUseCase?: IUseCase<string, IProject | null>,
    @inject("UpdateProjectUseCase") private _updateProjectUseCase?: IUseCase<{ id: string; data: UpdateProjectDto }, IProject | null>,
    @inject("DeleteProjectUseCase") private _deleteProjectUseCase?: IUseCase<string, boolean>,
    @inject("ProjectRepository") private _projectRepository?: IProjectRepository,
    @inject("ProjectTaskRepository") private _taskRepository?: IProjectTaskRepository,
    @inject("SubcontractRepository") private _subcontractRepository?: ISubcontractRepository,
    @inject("PurchaseOrderRepository") private _poRepository?: IPurchaseOrderRepository,
  ) {}

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const project = await this._createProjectUseCase!.execute(req.body);
      
      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Create Project",
        "Projects",
        `Created project: ${project.projectNo} - ${project.name}`
      );

      res.status(StatusCode.CREATED).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetProjectsQueryDto = {
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        status: req.query.status as string | undefined,
        clientId: req.query.clientId as string | undefined,
      };

      const result = await this._getProjectsUseCase!.execute(query);
      res.status(StatusCode.OK).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await this._getProjectByIdUseCase!.execute(req.params.id);
      if (!project) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Project not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const project = await this._updateProjectUseCase!.execute({
        id: req.params.id,
        data: req.body
      });

      if (!project) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Project not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Update Project",
        "Projects",
        `Updated project: ${project.projectNo}`
      );

      res.status(StatusCode.OK).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const deleted = await this._deleteProjectUseCase!.execute(req.params.id);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Project not found" });
        return;
      }

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Delete Project",
        "Projects",
        `Deleted project ID: ${req.params.id}`
      );

      res.status(StatusCode.OK).json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  // --- Task Endpoints ---

  public createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this._taskRepository!.create({
        ...req.body,
        projectRef: req.params.id
      });
      res.status(StatusCode.CREATED).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  public getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tasks = await this._taskRepository!.findByProjectId(req.params.id);
      res.status(StatusCode.OK).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  };

  public updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const task = await this._taskRepository!.update(req.params.taskId, req.body);
      if (!task) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Task not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  public deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this._taskRepository!.delete(req.params.taskId);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Task not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  // --- Subcontract Endpoints ---

  public createSubcontract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subcontract = await this._subcontractRepository!.create({
        ...req.body,
        projectRef: req.params.id
      });
      res.status(StatusCode.CREATED).json({ success: true, data: subcontract });
    } catch (error) {
      next(error);
    }
  };

  public getSubcontracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subcontracts = await this._subcontractRepository!.findByProjectId(req.params.id);
      res.status(StatusCode.OK).json({ success: true, data: subcontracts });
    } catch (error) {
      next(error);
    }
  };

  public updateSubcontract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subcontract = await this._subcontractRepository!.update(req.params.subcontractId, req.body);
      if (!subcontract) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Subcontract not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: subcontract });
    } catch (error) {
      next(error);
    }
  };

  public deleteSubcontract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this._subcontractRepository!.delete(req.params.subcontractId);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Subcontract not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, message: "Subcontract deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  // --- Purchase Order Endpoints ---

  public createPo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const username = authReq.user?.name || "Admin";
      const po = await this._poRepository!.create({
        ...req.body,
        projectRef: req.params.id,
        revision: 0,
        revisions: [],
        activityLog: [
          {
            message: "Purchase order created",
            user: username,
            date: new Date()
          }
        ]
      });
      res.status(StatusCode.CREATED).json({ success: true, data: po });
    } catch (error) {
      next(error);
    }
  };

  public getPos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pos = await this._poRepository!.findByProjectId(req.params.id);
      res.status(StatusCode.OK).json({ success: true, data: pos });
    } catch (error) {
      next(error);
    }
  };

  public updatePo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const username = authReq.user?.name || "Admin";
      const { poId } = req.params;

      const oldPo = await this._poRepository!.findById(poId);
      if (!oldPo) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Purchase order not found" });
        return;
      }

      let patch: Partial<IPurchaseOrder> = { ...req.body };
      let activityLog = [...(oldPo.activityLog || [])];

      // Determine if revision is needed
      const isNonPending = oldPo.status !== "Pending";
      const itemsChanged = req.body.items && JSON.stringify(req.body.items) !== JSON.stringify(oldPo.items);
      const vendorChanged = req.body.vendorName && req.body.vendorName !== oldPo.vendorName;

      if (isNonPending && (itemsChanged || vendorChanged)) {
        const newRevisionNo = (oldPo.revision || 0) + 1;
        const revisionObj = {
          revisionNo: oldPo.revision || 0,
          vendorName: oldPo.vendorName,
          amount: oldPo.amount,
          items: oldPo.items,
          pdfUrl: oldPo.pdfUrl,
          pdfStorageKey: oldPo.pdfStorageKey,
          updatedBy: username,
          updatedAt: new Date()
        };

        patch.revision = newRevisionNo;
        patch.revisions = [...(oldPo.revisions || []), revisionObj];
        patch.pdfUrl = undefined;
        patch.pdfStorageKey = undefined;
        patch.status = "Pending";

        activityLog.push({
          message: `Revised to Rev ${newRevisionNo} (items/vendor edited; status reset to Pending)`,
          user: username,
          date: new Date()
        });
      } else {
        if (req.body.status && req.body.status !== oldPo.status) {
          activityLog.push({
            message: `Status updated from ${oldPo.status} to ${req.body.status}`,
            user: username,
            date: new Date()
          });
        } else if (itemsChanged || vendorChanged || (req.body.amount !== undefined && req.body.amount !== oldPo.amount)) {
          activityLog.push({
            message: `Purchase order details updated`,
            user: username,
            date: new Date()
          });
        }
      }

      patch.activityLog = activityLog;

      const po = await this._poRepository!.update(poId, patch);
      res.status(StatusCode.OK).json({ success: true, data: po });
    } catch (error) {
      next(error);
    }
  };

  public deletePo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this._poRepository!.delete(req.params.poId);
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Purchase order not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, message: "Purchase order deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  public uploadPoPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const file = req.file;
      if (!file) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "No file uploaded" });
        return;
      }

      const { id: projectId, poId } = req.params;
      const po = await this._poRepository!.findById(poId);
      if (!po) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Purchase order not found" });
        return;
      }

      const storedFile = await persistUploadedFile(file, `projects/${projectId}/purchase-orders/${poId}`);
      const username = authReq.user?.name || "Admin";
      const activityLog = [
        ...(po.activityLog || []),
        {
          message: `Uploaded purchase order PDF: ${file.originalname}`,
          user: username,
          date: new Date()
        }
      ];

      const pdfDocs = [
        ...(po.pdfDocs ?? []),
        {
          name: file.originalname,
          url: storedFile.url,
          storageKey: storedFile.key,
          uploadedBy: username,
          uploadedDate: new Date()
        }
      ];

      const updatedPo = await this._poRepository!.update(poId, {
        pdfUrl: storedFile.url,
        pdfStorageKey: storedFile.key,
        pdfDocs,
        activityLog
      });

      await AuditLogger.log(
        username,
        "Upload PO PDF",
        "Projects",
        `Uploaded PDF for Purchase Order ${po.poNo} in project`
      );

      res.status(StatusCode.OK).json({ success: true, data: updatedPo });
    } catch (error) {
      next(error);
    }
  };

  // --- Handover Document Upload Endpoint ---

  public uploadHandoverDoc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const file = req.file;
      if (!file) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "No file uploaded" });
        return;
      }

      const projectId = req.params.id;
      const project = await this._projectRepository!.findById(projectId);
      if (!project) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Project not found" });
        return;
      }

      const storedFile = await persistUploadedFile(file, `projects/${projectId}/handover`);

      const handoverDocs = [
        ...(project.handoverDocs ?? []),
        {
          name: file.originalname,
          url: storedFile.url,
          storageKey: storedFile.key,
          uploadedBy: authReq.user?.name || "Admin",
          uploadedDate: new Date()
        }
      ];

      const updatedProject = await this._projectRepository!.update(projectId, { handoverDocs });

      await AuditLogger.log(
        authReq.user?.name || "Unknown Admin",
        "Upload Handover Document",
        "Projects",
        `Uploaded handover report '${file.originalname}' to project ${project.projectNo}`
      );

      res.status(StatusCode.OK).json({ success: true, data: updatedProject });
    } catch (error) {
      next(error);
    }
  };

  // --- Subcontract Report Upload Endpoint ---

  public uploadSubcontractReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const file = req.file;
      if (!file) {
        res.status(StatusCode.BAD_REQUEST).json({ success: false, message: "No file uploaded" });
        return;
      }

      const { id: projectId, subcontractId } = req.params;
      const subcontract = await this._subcontractRepository!.findById(subcontractId);
      if (!subcontract) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Subcontract not found" });
        return;
      }

      const storedFile = await persistUploadedFile(file, `projects/${projectId}/subcontracts/${subcontractId}`);

      const updatedSubcontract = await this._subcontractRepository!.update(subcontractId, {
        completionReportUrl: storedFile.url
      });

      await AuditLogger.log(
        authReq.user?.name || "Admin",
        "Upload Subcontract Report",
        "Projects",
        `Uploaded completion report for subcontractor ${subcontract.contractorName} in project`
      );

      res.status(StatusCode.OK).json({ success: true, data: updatedSubcontract });
    } catch (error) {
      next(error);
    }
  };

  public getAllSubcontracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subcontracts = await this._subcontractRepository!.findAll();
      res.status(StatusCode.OK).json({ success: true, data: subcontracts });
    } catch (error) {
      next(error);
    }
  };

  public getAllPurchaseOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pos = await this._poRepository!.findAll();
      res.status(StatusCode.OK).json({ success: true, data: pos });
    } catch (error) {
      next(error);
    }
  };
}


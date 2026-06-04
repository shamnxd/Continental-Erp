import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";
import { ComplaintRequestModel } from "../models/ComplaintRequest";
import { ClientModel } from "../models/Client";
import { IComplaintRepository } from "../interfaces/repositories/IComplaintRepository";
import { IStaffRepository } from "../interfaces/repositories/IStaffRepository";
import { StatusCode } from "../constants/statusCodes";
import { AppError } from "../errors/AppError";
import { AuditLogger } from "../utils/AuditLogger";

export class ComplaintRequestController {
  /** POST /api/v1/public/complaint-requests */
  public submitPublicComplaint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clientName, contactPerson, phone, email, location, issue, description } = req.body;

      if (!clientName || !contactPerson || !phone || !location || !issue || !description) {
        throw new AppError("clientName, contactPerson, phone, location, issue, and description are required", StatusCode.BAD_REQUEST);
      }

      const request = await ComplaintRequestModel.create({
        clientName: clientName.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : "",
        location: location.trim(),
        issue: issue.trim(),
        description: description.trim(),
        status: "Pending"
      });

      res.status(StatusCode.CREATED).json({
        success: true,
        message: "Complaint registered successfully. Our team will review it.",
        data: request
      });
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/v1/admin/complaint-requests */
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;
      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const filter: Record<string, any> = {};

      if (status && status !== "all") {
        filter.status = status;
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        filter["$or"] = [
          { clientName: regex },
          { contactPerson: regex },
          { phone: regex },
          { issue: regex }
        ];
      }

      const skip = (page - 1) * limit;

      const [docs, total] = await Promise.all([
        ComplaintRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        ComplaintRequestModel.countDocuments(filter).exec()
      ]);

      res.status(StatusCode.OK).json({
        success: true,
        data: docs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /** PUT /api/v1/admin/complaint-requests/:id/reject */
  public reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const request = await ComplaintRequestModel.findById(id);
      if (!request) {
        throw new AppError("Complaint request not found", StatusCode.NOT_FOUND);
      }

      if (request.status !== "Pending") {
        throw new AppError(`Cannot reject a request that is already ${request.status}`, StatusCode.BAD_REQUEST);
      }

      request.status = "Rejected";
      await request.save();

      // Log audit
      await AuditLogger.log(
        (req as any).user?.name || "Admin",
        "Reject Complaint Request",
        "Administration",
        `Rejected complaint request from ${request.clientName}: ${request.issue}`
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: "Complaint request rejected successfully",
        data: request
      });
    } catch (error) {
      next(error);
    }
  };

  /** PUT /api/v1/admin/complaint-requests/:id/convert */
  public convert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { clientId, priority, expectedResolution, assignedStaffIds } = req.body;

      if (!clientId || !expectedResolution) {
        throw new AppError("clientId and expectedResolution are required for conversion", StatusCode.BAD_REQUEST);
      }

      const request = await ComplaintRequestModel.findById(id);
      if (!request) {
        throw new AppError("Complaint request not found", StatusCode.NOT_FOUND);
      }

      if (request.status !== "Pending") {
        throw new AppError(`Cannot convert a request that is already ${request.status}`, StatusCode.BAD_REQUEST);
      }

      const client = await ClientModel.findById(clientId);
      if (!client) {
        throw new AppError("Client not found", StatusCode.NOT_FOUND);
      }

      // Fetch Staff names
      const staffRepo = container.resolve<IStaffRepository>("StaffRepository");
      const assignedStaffNames: string[] = [];
      if (assignedStaffIds && Array.isArray(assignedStaffIds)) {
        for (const staffId of assignedStaffIds) {
          const staff = await staffRepo.findById(staffId);
          if (staff) {
            assignedStaffNames.push(staff.fullName);
          }
        }
      }

      // Create official Complaint
      const complaintRepo = container.resolve<IComplaintRepository>("ComplaintRepository");
      const complaint = await complaintRepo.create({
        clientId: client.id || client._id.toString(),
        clientName: client.companyName,
        contactPerson: client.contactPerson,
        phone: client.phone,
        location: request.location,
        issue: request.issue,
        description: request.description,
        priority: priority || "Medium",
        expectedResolution: new Date(expectedResolution),
        status: "Pending",
        assignedStaffIds: assignedStaffIds || [],
        assignedTo: assignedStaffNames
      });

      // Update request status
      request.status = "Converted";
      request.convertedComplaintId = complaint.id;
      await request.save();

      // Log audit
      await AuditLogger.log(
        (req as any).user?.name || "Admin",
        "Convert Complaint Request",
        "Administration",
        `Converted complaint request from ${request.clientName} to official complaint: ${complaint.complaintNo}`
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: "Complaint request converted successfully",
        data: {
          request,
          complaint
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository";
import { IComplaintRepository, GetComplaintsQuery, PaginatedComplaints } from "../../interfaces/repositories/IComplaintRepository";
import { IComplaint } from "../../interfaces/models/IComplaint";
import { StaffWorkHistoryItem } from "../../interfaces/models/IStaff";
import { ComplaintModel, IComplaintDocument } from "../../models/Complaint";

@injectable()
export class ComplaintRepository extends BaseRepository<IComplaintDocument, IComplaint> implements IComplaintRepository {
  constructor() {
    super(ComplaintModel);
  }

  protected toDomain(doc: IComplaintDocument): IComplaint {
    const client = (doc as unknown as { clientRef?: any }).clientRef;
    const clientName = client?.companyName ?? doc.clientName;
    const contactPerson = client?.contactPerson ?? doc.contactPerson;
    const phone = client?.phone ?? doc.phone;
    const location = (() => {
      if (client?.city) {
        const addr = client?.address ? String(client.address).trim() : "";
        const city = String(client.city).trim();
        return addr ? `${addr}, ${city}` : city;
      }
      return doc.location;
    })();

    return {
      id: doc._id.toString(),
      complaintNo: doc.complaintNo,
      date: doc.date,
      clientId: doc.clientId,
      clientName,
      clientLogoUrl: client?.logoUrl || "",
      contactPerson,
      phone,
      issue: doc.issue,
      description: doc.description,
      priority: doc.priority,
      status: doc.status,
      assignedTo: Array.isArray(doc.assignedTo) ? doc.assignedTo : (doc.assignedTo ? [doc.assignedTo] : []),
      assignedStaffIds: Array.isArray(doc.assignedStaffIds) ? doc.assignedStaffIds : [],
      location,
      expectedResolution: doc.expectedResolution,
      remarks: doc.remarks.map((r) => ({
        id: (r as { _id?: { toString(): string } })._id?.toString(),
        user: r.user,
        date: r.date,
        text: r.text,
      })),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public override async create(item: Partial<IComplaint>): Promise<IComplaint> {
    const year = new Date().getFullYear();
    const count = await this.model.countDocuments().exec();
    const pad = String(count + 1).padStart(3, "0");
    const complaintNo = `CMP-${year}-${pad}`;

    const createdDoc = new this.model({
      ...item,
      complaintNo,
      clientRef: item.clientId && Types.ObjectId.isValid(item.clientId) ? new Types.ObjectId(item.clientId) : null,
    });

    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
  }

  public override async findById(id: string): Promise<IComplaint | null> {
    const doc = await this.model.findById(id).populate("clientRef").exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async findPaginated(query: GetComplaintsQuery): Promise<PaginatedComplaints> {
    const { search, page = 1, limit = 10, status, priority, clientId } = query;
    const mongoFilter: Record<string, any> = {};

    if (clientId) {
      mongoFilter["clientId"] = clientId;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter["$or"] = [
        { complaintNo: regex },
        { clientName: regex },
        { contactPerson: regex },
        { issue: regex },
        { location: regex }
      ];
    }

    if (status && status !== "all") {
      mongoFilter["status"] = status;
    }

    if (priority && priority !== "all") {
      mongoFilter["priority"] = priority;
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model.find(mongoFilter).populate("clientRef").sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(mongoFilter).exec()
    ]);

    return {
      data: docs.map(doc => this.toDomain(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async findWorkHistoryByStaffId(staffId: string, staffName?: string): Promise<StaffWorkHistoryItem[]> {
    const orConditions: Record<string, unknown>[] = [{ assignedStaffIds: staffId }];
    if (staffName) {
      orConditions.push({ assignedTo: staffName });
    }
    const docs = await this.model
      .find({ $or: orConditions })
      .sort({ date: -1 })
      .exec();

    return docs.map((doc) => ({
      complaintId: doc._id.toString(),
      complaintNo: doc.complaintNo,
      clientName: doc.clientName,
      issue: doc.issue,
      status: doc.status,
      priority: doc.priority,
      date: doc.date,
      location: doc.location
    }));
  }
}

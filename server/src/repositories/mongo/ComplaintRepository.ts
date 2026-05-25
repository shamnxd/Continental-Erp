import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IComplaintRepository, GetComplaintsQuery, PaginatedComplaints } from "../../interfaces/repositories/IComplaintRepository";
import { IComplaint } from "../../interfaces/models/IComplaint";
import { ComplaintModel, IComplaintDocument } from "../../models/Complaint";

@injectable()
export class ComplaintRepository extends BaseRepository<IComplaintDocument, IComplaint> implements IComplaintRepository {
  constructor() {
    super(ComplaintModel);
  }

  protected toDomain(doc: IComplaintDocument): IComplaint {
    return {
      id: doc._id.toString(),
      complaintNo: doc.complaintNo,
      date: doc.date,
      clientId: doc.clientId,
      clientName: doc.clientName,
      contactPerson: doc.contactPerson,
      phone: doc.phone,
      issue: doc.issue,
      description: doc.description,
      priority: doc.priority,
      status: doc.status,
      assignedTo: Array.isArray(doc.assignedTo) ? doc.assignedTo : (doc.assignedTo ? [doc.assignedTo] : []),
      location: doc.location,
      expectedResolution: doc.expectedResolution,
      remarks: doc.remarks.map(r => ({
        user: r.user,
        date: r.date,
        text: r.text
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
      complaintNo
    });

    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
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
      this.model.find(mongoFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
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
}

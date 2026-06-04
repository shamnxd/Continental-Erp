import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { ILeaveRequestRepository, GetLeavesQuery, PaginatedLeaves } from "../../interfaces/repositories/ILeaveRequestRepository";
import { ILeaveRequest, LeaveStatus } from "../../interfaces/models/ILeaveRequest";
import { LeaveRequestModel, ILeaveRequestDocument } from "../../models/LeaveRequest";

@injectable()
export class LeaveRequestRepository extends BaseRepository<ILeaveRequestDocument, ILeaveRequest> implements ILeaveRequestRepository {
  constructor() {
    super(LeaveRequestModel);
  }

  protected toDomain(doc: ILeaveRequestDocument): ILeaveRequest {
    return {
      id: doc._id.toString(),
      staffId: doc.staffId,
      staffName: doc.staffName,
      staffNo: doc.staffNo,
      leaveType: doc.leaveType,
      fromDate: doc.fromDate,
      toDate: doc.toDate,
      days: doc.days,
      reason: doc.reason,
      status: doc.status,
      adminNote: doc.adminNote,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findPaginated(query: GetLeavesQuery): Promise<PaginatedLeaves> {
    const { staffId, status, page = 1, limit = 15 } = query;
    const mongoFilter: Record<string, any> = {};

    if (staffId) mongoFilter.staffId = staffId;
    if (status && status !== "all") mongoFilter.status = status;

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find(mongoFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(mongoFilter).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public async updateStatus(id: string, status: LeaveStatus, adminNote?: string): Promise<ILeaveRequest | null> {
    const update: Record<string, any> = { status };
    if (adminNote !== undefined) update.adminNote = adminNote;
    const doc = await this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    return doc ? this.toDomain(doc) : null;
  }
}

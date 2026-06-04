import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IStaffRepository, GetStaffQuery, PaginatedStaff } from "../../interfaces/repositories/IStaffRepository";
import { IStaff } from "../../interfaces/models/IStaff";
import { StaffModel, IStaffDocument } from "../../models/Staff";

@injectable()
export class StaffRepository extends BaseRepository<IStaffDocument, IStaff> implements IStaffRepository {
  constructor() {
    super(StaffModel);
  }

  protected toDomain(doc: IStaffDocument): IStaff {
    return {
      id: doc._id.toString(),
      staffNo: doc.staffNo,
      fullName: doc.fullName,
      phone: doc.phone,
      email: doc.email,
      city: doc.city,
      role: doc.role,
      customRole: doc.customRole,
      employmentType: doc.employmentType,
      specialization: doc.specialization,
      status: doc.status,
      notes: doc.notes,
      isActive: doc.isActive,
      passwordHash: (doc as any).passwordHash,
      refreshToken: (doc as any).refreshToken,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }

  public override async create(item: Partial<IStaff>): Promise<IStaff> {
    const year = new Date().getFullYear();
    const count = await this.model.countDocuments().exec();
    const pad = String(count + 1).padStart(3, "0");
    const staffNo = `STF-${year}-${pad}`;

    const createdDoc = new this.model({ ...item, staffNo });
    const savedDoc = await createdDoc.save();
    return this.toDomain(savedDoc);
  }

  public async findPaginated(query: GetStaffQuery): Promise<PaginatedStaff> {
    const { search, page = 1, limit = 10, status, employmentType, activeOnly } = query;
    const mongoFilter: Record<string, unknown> = {};

    if (activeOnly !== false) {
      mongoFilter.isActive = true;
    }

    if (search?.trim()) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter.$or = [
        { fullName: regex },
        { staffNo: regex },
        { phone: regex },
        { email: regex },
        { city: regex },
        { role: regex },
        { customRole: regex },
        { specialization: regex }
      ];
    }

    if (status && status !== "all") {
      mongoFilter.status = status;
    }

    if (employmentType && employmentType !== "all") {
      mongoFilter.employmentType = employmentType;
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model.find(mongoFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(mongoFilter).exec()
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async findByIds(ids: string[]): Promise<IStaff[]> {
    if (!ids.length) return [];
    const docs = await this.model.find({ _id: { $in: ids } }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  public async findByEmail(email: string): Promise<IStaff | null> {
    const doc = await this.model.findOne({ email: email.toLowerCase().trim() }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.model.findByIdAndUpdate(id, { refreshToken: token }).exec();
  }
}

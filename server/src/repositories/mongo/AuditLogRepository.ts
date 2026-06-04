import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IAuditLogRepository, GetAuditLogsQuery, PaginatedAuditLogs } from "../../interfaces/repositories/IAuditLogRepository";
import { IAuditLog } from "../../interfaces/models/IAuditLog";
import { AuditLogModel, IAuditLogDocument } from "../../models/AuditLog";

@injectable()
export class AuditLogRepository extends BaseRepository<IAuditLogDocument, IAuditLog> implements IAuditLogRepository {
  constructor() {
    super(AuditLogModel);
  }

  protected toDomain(doc: IAuditLogDocument): IAuditLog {
    return {
      id: doc._id.toString(),
      timestamp: doc.timestamp,
      user: doc.user,
      action: doc.action,
      module: doc.module,
      details: doc.details,
    };
  }

  public async findPaginated(query: GetAuditLogsQuery): Promise<PaginatedAuditLogs> {
    const { search, module, user, page = 1, limit = 15 } = query;

    const mongoFilter: Record<string, any> = {
      action: { $nin: ["Staff Login", "Staff Logout"] }
    };

    if (module && module !== "all") {
      if (module === "Administration") {
        mongoFilter.module = { $in: ["Administration", "Auth"] };
      } else {
        mongoFilter.module = module;
      }
    }

    const countFilter: Record<string, any> = {
      action: { $nin: ["Staff Login", "Staff Logout"] }
    };

    if (user && user !== "all") {
      mongoFilter.user = user;
      countFilter.user = user;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      const searchCriteria = [
        { user: regex },
        { action: regex },
        { details: regex },
      ];
      mongoFilter["$or"] = searchCriteria;
      countFilter["$or"] = searchCriteria;
    }

    const skip = (page - 1) * limit;

    const [
      docs,
      total,
      totalAll,
      clientsCount,
      amcCount,
      complaintsCount,
      staffCount,
      financeCount,
      administrationCount,
    ] = await Promise.all([
      this.model.find(mongoFilter).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(mongoFilter).exec(),
      this.model.countDocuments(countFilter).exec(),
      this.model.countDocuments({ ...countFilter, module: "Clients" }).exec(),
      this.model.countDocuments({ ...countFilter, module: "AMC" }).exec(),
      this.model.countDocuments({ ...countFilter, module: "Complaints" }).exec(),
      this.model.countDocuments({ ...countFilter, module: "Staff" }).exec(),
      this.model.countDocuments({ ...countFilter, module: "Finance" }).exec(),
      this.model.countDocuments({ ...countFilter, module: { $in: ["Administration", "Auth"] } }).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      counts: {
        all: totalAll,
        Clients: clientsCount,
        AMC: amcCount,
        Complaints: complaintsCount,
        Staff: staffCount,
        Finance: financeCount,
        Administration: administrationCount,
      },
    };
  }
}

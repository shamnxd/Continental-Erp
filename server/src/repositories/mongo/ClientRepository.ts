import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IClientRepository, GetClientsQuery, PaginatedClients } from "../../interfaces/repositories/IClientRepository";
import { IClient } from "../../interfaces/models/IClient";
import { ClientModel, IClientDocument } from "../../models/Client";
import { ComplaintModel } from "../../models/Complaint";
import { EnquiryModel } from "../../models/Enquiry";

@injectable()
export class ClientRepository extends BaseRepository<IClientDocument, IClient> implements IClientRepository {
  constructor() {
    super(ClientModel);
  }

  protected toDomain(clientDoc: IClientDocument): IClient {
    return {
      id: clientDoc._id.toString(),
      companyName: clientDoc.companyName,
      contactPerson: clientDoc.contactPerson,
      phone: clientDoc.phone,
      email: clientDoc.email,
      gst: clientDoc.gst,
      city: clientDoc.city,
      address: clientDoc.address,
      projectsCount: clientDoc.projectsCount,
      amcStatus: clientDoc.amcStatus,
      parentCompany: clientDoc.parentCompany,
      logoUrl: clientDoc.logoUrl,
      createdAt: clientDoc.createdAt,
      updatedAt: clientDoc.updatedAt
    };
  }

  public async findPaginated(query: GetClientsQuery): Promise<PaginatedClients> {
    const { search, page = 1, limit = 10, filter, companyNames } = query;

    // Build the MongoDB filter object
    const mongoFilter: Record<string, any> = {};

    // Text search across name, contact person, city
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      mongoFilter["$or"] = [
        { companyName: regex },
        { contactPerson: regex },
        { city: regex },
        { email: regex },
      ];
    }

    // AMC-based filter
    if (filter === "active-amc") {
      mongoFilter["amcStatus"] = "Active";
    } else if (filter === "expired-amc") {
      mongoFilter["amcStatus"] = "Expired";
    } else if (filter === "active-complaints") {
      const activeComplaints = await ComplaintModel.find({
        status: { $in: ["Pending", "In Progress"] }
      }).select("clientName").exec();
      const names = activeComplaints.map(c => c.clientName?.trim()).filter(Boolean);
      mongoFilter["companyName"] = { $in: names };
    } else if (filter === "active-enquiries") {
      const activeEnquiries = await EnquiryModel.find({
        status: { $in: ["Site Visit Scheduled", "Quotation Prepared", "Follow-up Required"] }
      }).select("clientName").exec();
      const names = activeEnquiries.map(e => e.clientName?.trim()).filter(Boolean);
      mongoFilter["companyName"] = { $in: names };
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model.find(mongoFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(mongoFilter).exec(),
    ]);

    const data = await Promise.all(
      docs.map(async (doc) => {
        const [complaintsCount, enquiriesCount] = await Promise.all([
          ComplaintModel.countDocuments({
            $or: [{ clientId: doc._id.toString() }, { clientName: doc.companyName }],
            status: { $in: ["Pending", "In Progress"] }
          }),
          EnquiryModel.countDocuments({
            $or: [{ clientId: doc._id.toString() }, { clientName: doc.companyName }],
            status: { $in: ["Site Visit Scheduled", "Quotation Prepared", "Follow-up Required"] }
          })
        ]);
        
        return {
          ...this.toDomain(doc),
          activeComplaintsCount: complaintsCount,
          activeEnquiriesCount: enquiriesCount
        };
      })
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}


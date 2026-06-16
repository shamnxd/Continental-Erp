import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IQuotationRepository } from "../../interfaces/repositories/IQuotationRepository";
import { IProjectRepository } from "../../interfaces/repositories/IProjectRepository";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IMinorJobRepository } from "../../interfaces/repositories/IMinorJobRepository";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { ConvertQuotationDto } from "../../dtos/quotation.dto";
import { IQuotation } from "../../interfaces/models/IQuotation";
import { BadRequestError } from "../../errors/BadRequestError";
import { resolveAmcTotalVisits } from "../../utils/calculateAmcTotalVisits";
import { computeAmcContractStatus } from "../../utils/computeAmcContractStatus";
import { syncClientAmcStatusFromContracts } from "../../utils/syncClientAmcStatus";

@injectable()
export class ConvertQuotationUseCase implements IUseCase<{ id: string; data: ConvertQuotationDto }, IQuotation> {
  constructor(
    @inject("QuotationRepository") private _quotationRepository: IQuotationRepository,
    @inject("ProjectRepository") private _projectRepository: IProjectRepository,
    @inject("AmcRepository") private _amcRepository: IAmcRepository,
    @inject("MinorJobRepository") private _minorJobRepository: IMinorJobRepository,
    @inject("EnquiryRepository") private _enquiryRepository: IEnquiryRepository,
    @inject("ClientRepository") private _clientRepository: IClientRepository
  ) {}

  public async execute(params: { id: string; data: ConvertQuotationDto }): Promise<IQuotation> {
    const { id } = params;
    const { targetType, data } = params.data;

    const quotation = await this._quotationRepository.findById(id);
    if (!quotation) {
      throw new BadRequestError("Quotation not found");
    }

    if (quotation.status !== "Approved") {
      throw new BadRequestError("Only approved quotations can be converted");
    }

    if (quotation.convertedTo) {
      throw new BadRequestError(`Quotation has already been converted to a ${quotation.convertedTo.targetType}`);
    }

    const client = await this._clientRepository.findById(quotation.clientId);
    if (!client) {
      throw new BadRequestError("Client associated with quotation not found");
    }

    let targetId = "";

    if (targetType === "project") {
      const projectName = data.name?.trim() || `${quotation.clientName} - Project`;
      const startDate = data.startDate ? new Date(data.startDate) : new Date();
      const projectValue = data.value !== undefined ? data.value : quotation.total;
      const expectedCompletionDate = data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : undefined;

      const project = await this._projectRepository.create({
        clientRef: quotation.clientId,
        name: projectName,
        startDate,
        value: projectValue,
        status: "Planning",
        quotationRef: quotation.id,
        expectedCompletionDate
      });

      // Increment client's project count
      await this._clientRepository.update(quotation.clientId, {
        projectsCount: (client.projectsCount || 0) + 1
      });

      targetId = project.id!;
    } else if (targetType === "amc") {
      if (!data.startDateAmc || !data.endDateAmc || !data.frequency) {
        throw new BadRequestError("Start date, end date, and frequency are required for AMC conversion");
      }

      const startDate = new Date(data.startDateAmc);
      const endDate = new Date(data.endDateAmc);
      const frequency = data.frequency;

      const totalVisits = resolveAmcTotalVisits({
        startDate,
        endDate,
        frequency,
        totalVisits: 4,
        overrideTotalVisits: false
      });
      const status = computeAmcContractStatus(endDate);
      const location = client.address ? `${client.address}, ${client.city}` : client.city;

      const amc = await this._amcRepository.create({
        clientId: quotation.clientId,
        clientName: client.companyName,
        contactPerson: client.contactPerson,
        phone: client.phone,
        email: client.email,
        location,
        startDate,
        endDate,
        frequency,
        nextVisit: null,
        status,
        amount: data.value !== undefined ? data.value : quotation.total,
        visitsCompleted: 0,
        totalVisits,
        serviceType: data.serviceType?.trim() || "Air Conditioning Service",
        notes: data.notes?.trim() || ""
      });

      await syncClientAmcStatusFromContracts(quotation.clientId, this._clientRepository, this._amcRepository);

      targetId = amc.id!;
    } else if (targetType === "minorjob") {
      const desc = data.description?.trim() || `${client.companyName} - Minor Job`;
      const date = data.scheduledDate ? new Date(data.scheduledDate) : new Date();
      const assignedTo = data.assignedTo?.trim() || "";
      const assignedStaffId = data.assignedStaffId?.trim() || "";

      const job = await this._minorJobRepository.create({
        clientRef: quotation.clientId,
        description: desc,
        scheduledDate: date,
        assignedTo,
        assignedStaffId,
        status: "Open",
        quotationRef: quotation.id
      });

      targetId = job.id!;
    } else {
      throw new BadRequestError("Invalid target conversion type");
    }

    // Update Quotation convertedTo status
    const updatedQuotation = await this._quotationRepository.update(id, {
      convertedTo: {
        targetType,
        targetId
      }
    });

    if (!updatedQuotation) {
      throw new BadRequestError("Failed to update quotation conversion metadata");
    }

    // Update source Enquiry status if exists
    if (quotation.enquiryId) {
      const enquiry = await this._enquiryRepository.findById(quotation.enquiryId);
      if (enquiry) {
        const nextEnquiryStatus = 
          targetType === "project" 
            ? "Converted to Project" 
            : targetType === "amc"
            ? "Closed"
            : "Converted to Minor Job";
        await this._enquiryRepository.update(quotation.enquiryId, {
          status: nextEnquiryStatus as any
        });
      }
    }

    return updatedQuotation;
  }
}

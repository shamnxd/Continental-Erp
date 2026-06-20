import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IQuotationRepository } from "../../interfaces/repositories/IQuotationRepository";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { CreateQuotationDto } from "../../dtos/quotation.dto";
import { IQuotation } from "../../interfaces/models/IQuotation";
import { computeQuotationTotals, normalizeLineItems } from "../../utils/quotationTotals";
import { ITallySyncService } from "../../interfaces/services/ITallySyncService";

@injectable()
export class CreateQuotationUseCase implements IUseCase<CreateQuotationDto, IQuotation> {
  constructor(
    @inject("QuotationRepository") private _quotationRepository: IQuotationRepository,
    @inject("EnquiryRepository") private _enquiryRepository: IEnquiryRepository,
    @inject("TallySyncService") private _tallySyncService: ITallySyncService,
  ) {}

  public async execute(dto: CreateQuotationDto): Promise<IQuotation> {
    const items = normalizeLineItems(dto.items);
    const gstPercent = dto.gstPercent ?? 18;
    const machineGstPercent = dto.machineGstPercent ?? 28;
    const lowSideGstPercent = dto.lowSideGstPercent ?? 18;
    const { amount, gst, total } = computeQuotationTotals(items, gstPercent, machineGstPercent, lowSideGstPercent);

    let revision = dto.revision ?? 0;
    if (dto.quotationNo?.trim()) {
      revision = await this._quotationRepository.getNextRevisionNumber(dto.quotationNo.trim());
    }

    const quotation = await this._quotationRepository.create({
      quotationNo: dto.quotationNo?.trim() || undefined,
      date: dto.date,
      validUntil: dto.validUntil,
      clientId: dto.clientId,
      clientName: dto.clientName,
      enquiryId: dto.enquiryId?.trim() || undefined,
      enquiryNo: dto.enquiryNo?.trim() || undefined,
      amount,
      gstPercent,
      machineGstPercent,
      lowSideGstPercent,
      gst,
      total,
      status: dto.status ?? "Pending Approval",
      items,
      remarks: [],
      notes: dto.notes ?? "",
      costingId: dto.costingId || undefined,
      costingRevision: dto.costingRevision,
      clonedFromQuotationRevision: dto.clonedFromQuotationRevision,
      revision,
      isActive: dto.isActive ?? true,
    });

    if (dto.quotationNo?.trim() && quotation.id) {
      await this._quotationRepository.deactivateAllForNo(dto.quotationNo.trim(), quotation.id);
    }

    if (dto.enquiryId?.trim()) {
      await this._enquiryRepository.update(dto.enquiryId, { status: "Quotation Prepared" });
    }

    if (quotation.status === "Approved") {
      await this._tallySyncService.enqueueQuotation(quotation);
    }

    return quotation;
  }
}

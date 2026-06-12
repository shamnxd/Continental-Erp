import { inject, injectable } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IQuotation } from "../../interfaces/models/IQuotation";
import { IQuotationRepository } from "../../interfaces/repositories/IQuotationRepository";

@injectable()
export class CreateQuotationRevisionUseCase implements IUseCase<{ id: string }, IQuotation> {
  constructor(
    @inject("QuotationRepository")
    private _quotationRepository: IQuotationRepository
  ) {}

  public async execute(input: { id: string }): Promise<IQuotation> {
    const existing = await this._quotationRepository.findById(input.id);
    if (!existing) {
      throw new Error("Quotation not found");
    }

    // Deactivate previous revisions first
    await this._quotationRepository.deactivateAllForNo(existing.quotationNo);

    // Get next revision number
    const revision = await this._quotationRepository.getNextRevisionNumber(existing.quotationNo);

    // Clone and create new revision
    const quotation = await this._quotationRepository.create({
      quotationNo: existing.quotationNo,
      date: existing.date,
      validUntil: existing.validUntil,
      clientId: existing.clientId,
      clientName: existing.clientName,
      enquiryId: existing.enquiryId || undefined,
      enquiryNo: existing.enquiryNo || undefined,
      amount: existing.amount,
      gstPercent: existing.gstPercent,
      gst: existing.gst,
      total: existing.total,
      status: "Pending Approval", // Re-submit for approval
      items: existing.items.map((i) => ({ ...i })),
      remarks: [],
      notes: existing.notes || "",
      costingId: existing.costingId || undefined,
      revision,
      isActive: true,
    });

    return quotation;
  }
}

import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IQuotationRepository } from "../../interfaces/repositories/IQuotationRepository";
import { UpdateQuotationDto } from "../../dtos/quotation.dto";
import { IQuotation } from "../../interfaces/models/IQuotation";
import { computeQuotationTotals, normalizeLineItems } from "../../utils/quotationTotals";
import { ITallySyncService } from "../../interfaces/services/ITallySyncService";

@injectable()
export class UpdateQuotationUseCase
  implements IUseCase<{ id: string; data: UpdateQuotationDto }, IQuotation | null>
{
  constructor(
    @inject("QuotationRepository") private _quotationRepository: IQuotationRepository,
    @inject("TallySyncService") private _tallySyncService: ITallySyncService,
  ) {}

  public async execute(input: { id: string; data: UpdateQuotationDto }): Promise<IQuotation | null> {
    const existing = await this._quotationRepository.findById(input.id);
    if (!existing) return null;

    const { items: itemsInput, gstPercent: gstInput, machineGstPercent: machineGstInput, lowSideGstPercent: lowSideGstInput, ...scalarFields } = input.data;
    const patch: Partial<IQuotation> = { ...scalarFields };

    if (itemsInput) {
      const items = normalizeLineItems(itemsInput);
      const gstPercent = gstInput ?? existing.gstPercent;
      const machineGstPercent = machineGstInput ?? existing.machineGstPercent ?? 28;
      const lowSideGstPercent = lowSideGstInput ?? existing.lowSideGstPercent ?? 18;
      const totals = computeQuotationTotals(items, gstPercent, machineGstPercent, lowSideGstPercent);
      patch.items = items;
      patch.amount = totals.amount;
      patch.gst = totals.gst;
      patch.total = totals.total;
      patch.gstPercent = gstPercent;
      patch.machineGstPercent = machineGstPercent;
      patch.lowSideGstPercent = lowSideGstPercent;
    } else if (gstInput != null || machineGstInput != null || lowSideGstInput != null) {
      const gstPercent = gstInput ?? existing.gstPercent;
      const machineGstPercent = machineGstInput ?? existing.machineGstPercent ?? 28;
      const lowSideGstPercent = lowSideGstInput ?? existing.lowSideGstPercent ?? 18;
      const totals = computeQuotationTotals(existing.items, gstPercent, machineGstPercent, lowSideGstPercent);
      patch.amount = totals.amount;
      patch.gst = totals.gst;
      patch.total = totals.total;
      patch.gstPercent = gstPercent;
      patch.machineGstPercent = machineGstPercent;
      patch.lowSideGstPercent = lowSideGstPercent;
    }

    const updated = await this._quotationRepository.update(input.id, patch);
    if (updated && updated.status === "Approved") {
      await this._tallySyncService.enqueueQuotation(updated);
    }
    return updated;
  }
}

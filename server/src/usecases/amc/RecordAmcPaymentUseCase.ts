import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IAmc } from "../../interfaces/models/IAmc";
import { RecordAmcPaymentDto } from "../../dtos/amcRemark.dto";

@injectable()
export class RecordAmcPaymentUseCase implements IUseCase<
  { amcId: string; data: RecordAmcPaymentDto; user: string },
  IAmc | null
> {
  constructor(@inject("AmcRepository") private _amcRepository: IAmcRepository) {}

  public async execute(params: {
    amcId: string;
    data: RecordAmcPaymentDto;
    user: string;
  }): Promise<IAmc | null> {
    const amc = await this._amcRepository.findById(params.amcId);
    if (!amc) return null;

    const payments = [
      ...(amc.payments ?? []),
      {
        date: new Date(),
        amount: params.data.amount,
        type: params.data.type,
        note: params.data.note?.trim() || "",
        recordedBy: params.user || "Admin"
      }
    ];

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const advancePaid = payments
      .filter((p) => p.type === "Advance")
      .reduce((sum, p) => sum + p.amount, 0);

    return await this._amcRepository.update(params.amcId, {
      payments,
      advancePaid: Math.min(advancePaid, amc.amount)
    });
  }
}

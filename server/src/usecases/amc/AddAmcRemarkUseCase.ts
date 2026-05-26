import { injectable, inject } from "tsyringe";
import { BadRequestError } from "../../errors/BadRequestError";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IAmc } from "../../interfaces/models/IAmc";
import { AddAmcRemarkDto } from "../../dtos/amcRemark.dto";

@injectable()
export class AddAmcRemarkUseCase implements IUseCase<
  { amcId: string; data: AddAmcRemarkDto; user: string },
  IAmc | null
> {
  constructor(@inject("AmcRepository") private _amcRepository: IAmcRepository) {}

  public async execute(params: {
    amcId: string;
    data: AddAmcRemarkDto;
    user: string;
  }): Promise<IAmc | null> {
    const amc = await this._amcRepository.findById(params.amcId);
    if (!amc) return null;

    const remarks = [...(amc.remarks ?? []), {
      user: params.user || "Admin",
      date: new Date(),
      text: params.data.text.trim()
    }];

    return await this._amcRepository.update(params.amcId, { remarks });
  }
}

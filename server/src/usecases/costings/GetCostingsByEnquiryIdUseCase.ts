import { inject, injectable } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { ICosting } from "../../interfaces/models/ICosting";
import { ICostingRepository } from "../../interfaces/repositories/ICostingRepository";

@injectable()
export class GetCostingsByEnquiryIdUseCase implements IUseCase<string, ICosting[]> {
  constructor(
    @inject("CostingRepository")
    private _costingRepository: ICostingRepository
  ) {}

  public async execute(enquiryId: string): Promise<ICosting[]> {
    return await this._costingRepository.findByEnquiryId(enquiryId);
  }
}

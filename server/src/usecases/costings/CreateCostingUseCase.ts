import { inject, injectable } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { ICosting } from "../../interfaces/models/ICosting";
import { ICostingRepository } from "../../interfaces/repositories/ICostingRepository";
import { CreateCostingDto } from "../../dtos/costing.dto";

@injectable()
export class CreateCostingUseCase implements IUseCase<{ data: CreateCostingDto }, ICosting> {
  constructor(
    @inject("CostingRepository")
    private _costingRepository: ICostingRepository
  ) {}

  public async execute(request: { data: CreateCostingDto }): Promise<ICosting> {
    const { data } = request;
    
    // Deactivate previous revisions first
    await this._costingRepository.deactivateAllForEnquiry(data.enquiryId);

    // Get next revision number
    const revision = await this._costingRepository.getNextRevisionNumber(data.enquiryId);

    const costing = await this._costingRepository.create({
      ...data,
      revision,
      isActive: true,
    } as any);

    return costing;
  }
}

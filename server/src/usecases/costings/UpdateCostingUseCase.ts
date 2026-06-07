import { inject, injectable } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { ICosting } from "../../interfaces/models/ICosting";
import { ICostingRepository } from "../../interfaces/repositories/ICostingRepository";
import { UpdateCostingDto } from "../../dtos/costing.dto";

@injectable()
export class UpdateCostingUseCase implements IUseCase<{ id: string; data: UpdateCostingDto }, ICosting | null> {
  constructor(
    @inject("CostingRepository")
    private _costingRepository: ICostingRepository
  ) {}

  public async execute(request: { id: string; data: UpdateCostingDto }): Promise<ICosting | null> {
    const { id, data } = request;
    return await this._costingRepository.update(id, data as any);
  }
}

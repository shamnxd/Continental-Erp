import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IWarrantyRepository } from "../../interfaces/repositories/IWarrantyRepository";
import { UpdateWarrantyDto } from "../../dtos/warranty.dto";
import { IWarranty } from "../../interfaces/models/IWarranty";

@injectable()
export class UpdateWarrantyUseCase implements IUseCase<{ id: string; data: UpdateWarrantyDto }, IWarranty | null> {
  constructor(
    @inject("WarrantyRepository") private _warrantyRepository: IWarrantyRepository
  ) {}

  public async execute(params: { id: string; data: UpdateWarrantyDto }): Promise<IWarranty | null> {
    return await this._warrantyRepository.update(params.id, params.data as any);
  }
}

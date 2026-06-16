import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IWarrantyRepository } from "../../interfaces/repositories/IWarrantyRepository";
import { IWarranty } from "../../interfaces/models/IWarranty";

@injectable()
export class GetWarrantyByIdUseCase implements IUseCase<string, IWarranty | null> {
  constructor(
    @inject("WarrantyRepository") private _warrantyRepository: IWarrantyRepository
  ) {}

  public async execute(id: string): Promise<IWarranty | null> {
    return await this._warrantyRepository.findById(id);
  }
}

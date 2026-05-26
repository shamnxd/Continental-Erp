import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IAmc } from "../../interfaces/models/IAmc";

@injectable()
export class GetAmcByIdUseCase implements IUseCase<string, IAmc | null> {
  constructor(@inject("AmcRepository") private _amcRepository: IAmcRepository) {}

  public async execute(id: string): Promise<IAmc | null> {
    return await this._amcRepository.findById(id);
  }
}

import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IMinorJobRepository } from "../../interfaces/repositories/IMinorJobRepository";
import { IMinorJob } from "../../interfaces/models/IMinorJob";

@injectable()
export class GetMinorJobByIdUseCase implements IUseCase<string, IMinorJob | null> {
  constructor(
    @inject("MinorJobRepository") private _minorJobRepository: IMinorJobRepository
  ) {}

  public async execute(id: string): Promise<IMinorJob | null> {
    return await this._minorJobRepository.findById(id);
  }
}

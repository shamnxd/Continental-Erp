import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IMinorJobRepository } from "../../interfaces/repositories/IMinorJobRepository";

@injectable()
export class DeleteMinorJobUseCase implements IUseCase<string, boolean> {
  constructor(
    @inject("MinorJobRepository") private _minorJobRepository: IMinorJobRepository
  ) {}

  public async execute(id: string): Promise<boolean> {
    return await this._minorJobRepository.delete(id);
  }
}

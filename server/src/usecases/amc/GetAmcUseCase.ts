import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcRepository, GetAmcQuery, PaginatedAmc } from "../../interfaces/repositories/IAmcRepository";

@injectable()
export class GetAmcUseCase implements IUseCase<GetAmcQuery, PaginatedAmc> {
  constructor(@inject("AmcRepository") private _amcRepository: IAmcRepository) {}

  public async execute(query: GetAmcQuery): Promise<PaginatedAmc> {
    return await this._amcRepository.findPaginated(query);
  }
}

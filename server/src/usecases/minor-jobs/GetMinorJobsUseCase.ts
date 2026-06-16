import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IMinorJobRepository, GetMinorJobsQuery, PaginatedMinorJobs } from "../../interfaces/repositories/IMinorJobRepository";

@injectable()
export class GetMinorJobsUseCase implements IUseCase<GetMinorJobsQuery, PaginatedMinorJobs> {
  constructor(
    @inject("MinorJobRepository") private _minorJobRepository: IMinorJobRepository
  ) {}

  public async execute(query: GetMinorJobsQuery): Promise<PaginatedMinorJobs> {
    return await this._minorJobRepository.findPaginated(query);
  }
}

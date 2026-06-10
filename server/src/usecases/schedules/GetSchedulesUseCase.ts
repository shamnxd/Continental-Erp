import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IScheduleRepository, PaginatedSchedules, GetSchedulesQuery } from "../../interfaces/repositories/IScheduleRepository";

@injectable()
export class GetSchedulesUseCase
  implements IUseCase<GetSchedulesQuery, PaginatedSchedules>
{
  constructor(
    @inject("ScheduleRepository")
    private _scheduleRepository: IScheduleRepository,
  ) {}

  public async execute(query: GetSchedulesQuery): Promise<PaginatedSchedules> {
    return await this._scheduleRepository.findPaginated(query);
  }
}

import { injectable, inject } from "tsyringe";
import { BadRequestError } from "../../errors/BadRequestError";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IAmcVisitRepository } from "../../interfaces/repositories/IAmcVisitRepository";
import { ScheduleAmcVisitDto } from "../../dtos/amcVisit.dto";
import { IAmcVisit } from "../../interfaces/models/IAmcVisit";
import { syncAmcNextVisit } from "../../utils/syncAmcNextVisit";

@injectable()
export class ScheduleAmcVisitUseCase implements IUseCase<{ amcId: string; data: ScheduleAmcVisitDto }, IAmcVisit> {
  constructor(
    @inject("AmcRepository") private _amcRepository: IAmcRepository,
    @inject("AmcVisitRepository") private _visitRepository: IAmcVisitRepository
  ) {}

  public async execute(params: { amcId: string; data: ScheduleAmcVisitDto }): Promise<IAmcVisit> {
    const amc = await this._amcRepository.findById(params.amcId);
    if (!amc) {
      throw new BadRequestError("AMC contract not found");
    }

    const scheduledDate = new Date(params.data.scheduledDate);
    if (scheduledDate < amc.startDate || scheduledDate > amc.endDate) {
      throw new BadRequestError("Visit date must be within the contract period");
    }

    const visit = await this._visitRepository.create({
      amcId: params.amcId,
      scheduledDate,
      status: "Scheduled",
      notes: params.data.notes?.trim() || "",
      assignedStaffIds: params.data.assignedStaffIds ?? []
    });

    await syncAmcNextVisit(params.amcId, this._amcRepository, this._visitRepository);
    return visit;
  }
}

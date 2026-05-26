import { injectable, inject } from "tsyringe";
import { BadRequestError } from "../../errors/BadRequestError";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IAmcVisitRepository } from "../../interfaces/repositories/IAmcVisitRepository";
import { UpdateAmcVisitDto } from "../../dtos/amcVisit.dto";
import { IAmcVisit } from "../../interfaces/models/IAmcVisit";
import { syncAmcNextVisit } from "../../utils/syncAmcNextVisit";

@injectable()
export class UpdateAmcVisitUseCase implements IUseCase<
  { amcId: string; visitId: string; data: UpdateAmcVisitDto },
  IAmcVisit | null
> {
  constructor(
    @inject("AmcRepository") private _amcRepository: IAmcRepository,
    @inject("AmcVisitRepository") private _visitRepository: IAmcVisitRepository
  ) {}

  public async execute(params: {
    amcId: string;
    visitId: string;
    data: UpdateAmcVisitDto;
  }): Promise<IAmcVisit | null> {
    const visit = await this._visitRepository.findById(params.visitId);
    if (!visit || visit.amcId !== params.amcId) {
      return null;
    }

    const amc = await this._amcRepository.findById(params.amcId);
    if (!amc) {
      throw new BadRequestError("AMC contract not found");
    }

    const patch: Partial<IAmcVisit> = {};
    if (params.data.status) patch.status = params.data.status;
    if (params.data.notes !== undefined) patch.notes = params.data.notes?.trim() || "";
    if (params.data.assignedStaffIds !== undefined) {
      patch.assignedStaffIds = params.data.assignedStaffIds;
    }
    if (params.data.smrId !== undefined) {
      patch.smrId = params.data.smrId || null;
    }
    if (params.data.scheduledDate) {
      const scheduledDate = new Date(params.data.scheduledDate);
      if (scheduledDate < amc.startDate || scheduledDate > amc.endDate) {
        throw new BadRequestError("Visit date must be within the contract period");
      }
      patch.scheduledDate = scheduledDate;
    }

    const updated = await this._visitRepository.update(params.visitId, patch);
    if (!updated) return null;

    if (params.data.status === "Completed" && visit.status !== "Completed") {
      const completed = amc.visitsCompleted + 1;
      await this._amcRepository.update(params.amcId, {
        visitsCompleted: Math.min(completed, amc.totalVisits)
      });
    }

    await syncAmcNextVisit(params.amcId, this._amcRepository, this._visitRepository);
    return updated;
  }
}

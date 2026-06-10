import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { ISMRRepository } from "../../interfaces/repositories/ISMRRepository";
import { IComplaintRepository } from "../../interfaces/repositories/IComplaintRepository";
import { IScheduleRepository } from "../../interfaces/repositories/IScheduleRepository";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { CreateSMRDto } from "../../dtos/smr.dto";
import { ISMR } from "../../interfaces/models/ISMR";
import { BadRequestError } from "../../errors/BadRequestError";

@injectable()
export class CreateSMRUseCase implements IUseCase<CreateSMRDto, ISMR> {
  constructor(
    @inject("SMRRepository")
    private _smrRepository: ISMRRepository,
    @inject("ComplaintRepository")
    private _complaintRepository: IComplaintRepository,
    @inject("ScheduleRepository")
    private _scheduleRepository: IScheduleRepository,
    @inject("AmcRepository")
    private _amcRepository: IAmcRepository
  ) {}

  public async execute(dto: CreateSMRDto): Promise<ISMR> {
    if (dto.complaintId) {
      const existing = await this._smrRepository.findByComplaintId(dto.complaintId);
      if (existing.length > 0) {
        throw new BadRequestError("An SMR report already exists for this complaint");
      }
    }

    if (dto.amcVisitId) {
      const existingSmr = await this._smrRepository.findByAmcVisitId(dto.amcVisitId);
      if (existingSmr) {
        throw new BadRequestError("An SMR report already exists for this AMC visit");
      }
    }

    const smr = await this._smrRepository.create(dto);

    if (smr.amcVisitId && smr.id) {
      const updatedSchedule = await this._scheduleRepository.update(smr.amcVisitId, {
        smrId: smr.id,
        status: "Completed",
      });

      if (updatedSchedule && updatedSchedule.entityType === "amc") {
        const schedules = await this._scheduleRepository.findByEntity("amc", updatedSchedule.entityId);
        const activeSchedules = schedules.filter((s) => s.status !== "Completed" && s.status !== "Cancelled");
        const nextVisitDate = activeSchedules.length > 0 ? activeSchedules[0].scheduledDate : null;
        const completedCount = schedules.filter((s) => s.status === "Completed").length;

        await this._amcRepository.update(updatedSchedule.entityId, {
          nextVisit: nextVisitDate ? new Date(nextVisitDate) : null,
          visitsCompleted: completedCount,
        });
      }
    }

    // If SMR is created for a complaint, auto-transition the complaint to "In Progress"
    if (smr.complaintId) {
      const complaint = await this._complaintRepository.findById(smr.complaintId);
      if (complaint && complaint.status === "Pending") {
        await this._complaintRepository.update(smr.complaintId, { status: "In Progress" });
      }
    }

    return smr;
  }
}

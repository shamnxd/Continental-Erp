import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcVisitRepository } from "../../interfaces/repositories/IAmcVisitRepository";
import { IStaffRepository } from "../../interfaces/repositories/IStaffRepository";
import { IAmcVisit } from "../../interfaces/models/IAmcVisit";

@injectable()
export class GetAmcVisitsUseCase implements IUseCase<string, IAmcVisit[]> {
  constructor(
    @inject("AmcVisitRepository") private _visitRepository: IAmcVisitRepository,
    @inject("StaffRepository") private _staffRepository: IStaffRepository
  ) {}

  public async execute(amcId: string): Promise<IAmcVisit[]> {
    const visits = await this._visitRepository.findByAmcId(amcId);
    const staffIds = [...new Set(visits.flatMap((v) => v.assignedStaffIds ?? []))];
    const staffMap = new Map<string, { id: string; fullName: string }>();

    await Promise.all(
      staffIds.map(async (id) => {
        const staff = await this._staffRepository.findById(id);
        if (staff?.id) staffMap.set(id, { id: staff.id, fullName: staff.fullName });
      })
    );

    return visits.map((v) => ({
      ...v,
      assignedStaff: (v.assignedStaffIds ?? [])
        .map((id) => staffMap.get(id))
        .filter(Boolean) as { id: string; fullName: string }[]
    }));
  }
}

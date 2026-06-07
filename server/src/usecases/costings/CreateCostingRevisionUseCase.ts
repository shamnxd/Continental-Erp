import { inject, injectable } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { ICosting } from "../../interfaces/models/ICosting";
import { ICostingRepository } from "../../interfaces/repositories/ICostingRepository";

@injectable()
export class CreateCostingRevisionUseCase implements IUseCase<{ id: string; preparedBy: string }, ICosting> {
  constructor(
    @inject("CostingRepository")
    private _costingRepository: ICostingRepository
  ) {}

  public async execute(input: { id: string; preparedBy: string }): Promise<ICosting> {
    const existing = await this._costingRepository.findById(input.id);
    if (!existing) {
      throw new Error("Costing sheet not found");
    }

    // Deactivate previous revisions first
    await this._costingRepository.deactivateAllForEnquiry(existing.enquiryId);

    // Get next revision number
    const revision = await this._costingRepository.getNextRevisionNumber(existing.enquiryId);

    // Clone and create new revision
    const costing = await this._costingRepository.create({
      enquiryId: existing.enquiryId,
      enquiryNo: existing.enquiryNo,
      clientId: existing.clientId,
      clientName: existing.clientName,
      projectName: existing.projectName,
      location: existing.location,
      unitType: existing.unitType,
      make: existing.make,
      totalTR: existing.totalTR,
      preparedBy: input.preparedBy || existing.preparedBy,
      approvedBy: "",
      revision,
      isActive: true,
      highSide: existing.highSide,
      lowSide: existing.lowSide,
      summary: existing.summary,
    });

    return costing;
  }
}

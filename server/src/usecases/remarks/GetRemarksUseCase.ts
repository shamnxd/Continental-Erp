import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IRemarkRepository } from "../../interfaces/repositories/IRemarkRepository";
import { IRemark, RemarkEntityType } from "../../interfaces/models/IRemark";

@injectable()
export class GetRemarksUseCase
  implements IUseCase<{ entityType: RemarkEntityType; entityId: string }, IRemark[]>
{
  constructor(
    @inject("RemarkRepository") private _remarkRepository: IRemarkRepository,
  ) {}

  public async execute(input: { entityType: RemarkEntityType; entityId: string }): Promise<IRemark[]> {
    return await this._remarkRepository.findByEntity(input.entityType, input.entityId);
  }
}

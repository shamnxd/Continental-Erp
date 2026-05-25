import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IComplaintRepository } from "../../interfaces/repositories/IComplaintRepository";
import { UpdateComplaintDto } from "../../dtos/complaint.dto";
import { IComplaint } from "../../interfaces/models/IComplaint";

@injectable()
export class UpdateComplaintUseCase implements IUseCase<{ id: string; data: UpdateComplaintDto }, IComplaint | null> {
  constructor(
    @inject("ComplaintRepository")
    private _complaintRepository: IComplaintRepository
  ) {}

  public async execute(params: { id: string; data: UpdateComplaintDto }): Promise<IComplaint | null> {
    return await this._complaintRepository.update(params.id, params.data);
  }
}

import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IComplaintRepository } from "../../interfaces/repositories/IComplaintRepository";
import { IComplaint } from "../../interfaces/models/IComplaint";

@injectable()
export class GetComplaintByIdUseCase implements IUseCase<string, IComplaint | null> {
  constructor(
    @inject("ComplaintRepository")
    private _complaintRepository: IComplaintRepository
  ) {}

  public async execute(id: string): Promise<IComplaint | null> {
    return await this._complaintRepository.findById(id);
  }
}

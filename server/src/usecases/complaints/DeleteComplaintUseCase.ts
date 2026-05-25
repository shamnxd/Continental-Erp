import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IComplaintRepository } from "../../interfaces/repositories/IComplaintRepository";

@injectable()
export class DeleteComplaintUseCase implements IUseCase<string, boolean> {
  constructor(
    @inject("ComplaintRepository")
    private _complaintRepository: IComplaintRepository
  ) {}

  public async execute(id: string): Promise<boolean> {
    return await this._complaintRepository.delete(id);
  }
}

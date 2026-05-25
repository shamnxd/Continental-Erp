import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IComplaintRepository } from "../../interfaces/repositories/IComplaintRepository";
import { CreateComplaintDto } from "../../dtos/complaint.dto";
import { IComplaint } from "../../interfaces/models/IComplaint";

@injectable()
export class CreateComplaintUseCase implements IUseCase<CreateComplaintDto, IComplaint> {
  constructor(
    @inject("ComplaintRepository")
    private _complaintRepository: IComplaintRepository
  ) {}

  public async execute(dto: CreateComplaintDto): Promise<IComplaint> {
    return await this._complaintRepository.create(dto);
  }
}

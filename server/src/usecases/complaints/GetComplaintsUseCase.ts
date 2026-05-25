import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IComplaintRepository, GetComplaintsQuery, PaginatedComplaints } from "../../interfaces/repositories/IComplaintRepository";

@injectable()
export class GetComplaintsUseCase implements IUseCase<GetComplaintsQuery, PaginatedComplaints> {
  constructor(
    @inject("ComplaintRepository")
    private _complaintRepository: IComplaintRepository
  ) {}

  public async execute(query: GetComplaintsQuery): Promise<PaginatedComplaints> {
    return await this._complaintRepository.findPaginated(query);
  }
}

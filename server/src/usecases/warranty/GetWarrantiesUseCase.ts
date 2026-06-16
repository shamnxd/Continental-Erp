import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IWarrantyRepository, PaginatedWarranties } from "../../interfaces/repositories/IWarrantyRepository";
import { GetWarrantiesQueryDto } from "../../dtos/warranty.dto";

@injectable()
export class GetWarrantiesUseCase implements IUseCase<GetWarrantiesQueryDto, PaginatedWarranties> {
  constructor(
    @inject("WarrantyRepository") private _warrantyRepository: IWarrantyRepository
  ) {}

  public async execute(query: GetWarrantiesQueryDto): Promise<PaginatedWarranties> {
    return await this._warrantyRepository.findPaginated(query);
  }
}

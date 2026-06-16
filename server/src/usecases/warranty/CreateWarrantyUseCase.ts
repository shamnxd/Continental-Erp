import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IWarrantyRepository } from "../../interfaces/repositories/IWarrantyRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { IProjectRepository } from "../../interfaces/repositories/IProjectRepository";
import { CreateWarrantyDto } from "../../dtos/warranty.dto";
import { IWarranty } from "../../interfaces/models/IWarranty";
import { BadRequestError } from "../../errors/BadRequestError";

@injectable()
export class CreateWarrantyUseCase implements IUseCase<CreateWarrantyDto, IWarranty> {
  constructor(
    @inject("WarrantyRepository") private _warrantyRepository: IWarrantyRepository,
    @inject("ClientRepository") private _clientRepository: IClientRepository,
    @inject("ProjectRepository") private _projectRepository: IProjectRepository
  ) {}

  public async execute(dto: CreateWarrantyDto): Promise<IWarranty> {
    const client = await this._clientRepository.findById(dto.clientRef);
    if (!client) {
      throw new BadRequestError("Client not found");
    }

    if (dto.projectRef) {
      const project = await this._projectRepository.findById(dto.projectRef);
      if (!project) {
        throw new BadRequestError("Project not found");
      }
    }

    const warranty = await this._warrantyRepository.create({
      clientRef: dto.clientRef,
      projectRef: dto.projectRef || undefined,
      product: dto.product,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      status: dto.status || "Active"
    });

    return warranty;
  }
}

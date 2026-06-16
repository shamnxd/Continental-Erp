import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IMinorJobRepository } from "../../interfaces/repositories/IMinorJobRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { CreateMinorJobDto } from "../../dtos/minorJob.dto";
import { IMinorJob } from "../../interfaces/models/IMinorJob";
import { BadRequestError } from "../../errors/BadRequestError";

@injectable()
export class CreateMinorJobUseCase implements IUseCase<CreateMinorJobDto, IMinorJob> {
  constructor(
    @inject("MinorJobRepository") private _minorJobRepository: IMinorJobRepository,
    @inject("ClientRepository") private _clientRepository: IClientRepository
  ) {}

  public async execute(dto: CreateMinorJobDto): Promise<IMinorJob> {
    const client = await this._clientRepository.findById(dto.clientRef);
    if (!client) {
      throw new BadRequestError("Client not found");
    }

    return await this._minorJobRepository.create({
      clientRef: dto.clientRef,
      description: dto.description,
      scheduledDate: new Date(dto.scheduledDate),
      assignedTo: dto.assignedTo || "",
      assignedStaffId: dto.assignedStaffId || "",
      status: "Open",
      quotationRef: dto.quotationRef || undefined
    });
  }
}

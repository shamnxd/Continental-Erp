import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IProjectRepository } from "../../interfaces/repositories/IProjectRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { CreateProjectDto } from "../../dtos/project.dto";
import { IProject } from "../../interfaces/models/IProject";
import { BadRequestError } from "../../errors/BadRequestError";

@injectable()
export class CreateProjectUseCase implements IUseCase<CreateProjectDto, IProject> {
  constructor(
    @inject("ProjectRepository")
    private _projectRepository: IProjectRepository,
    @inject("ClientRepository")
    private _clientRepository: IClientRepository
  ) {}

  public async execute(dto: CreateProjectDto): Promise<IProject> {
    const client = await this._clientRepository.findById(dto.clientRef);
    if (!client) {
      throw new BadRequestError("Client not found");
    }

    const project = await this._projectRepository.create({
      clientRef: dto.clientRef,
      name: dto.name,
      startDate: new Date(dto.startDate),
      value: dto.value,
      status: "Planning",
      quotationRef: dto.quotationRef || undefined,
      expectedCompletionDate: dto.expectedCompletionDate ? new Date(dto.expectedCompletionDate) : undefined
    });

    // Increment client's project count
    await this._clientRepository.update(dto.clientRef, {
      projectsCount: (client.projectsCount || 0) + 1
    });

    return project;
  }
}

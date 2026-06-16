import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IProjectRepository } from "../../interfaces/repositories/IProjectRepository";
import { IProject } from "../../interfaces/models/IProject";

@injectable()
export class GetProjectByIdUseCase implements IUseCase<string, IProject | null> {
  constructor(
    @inject("ProjectRepository")
    private _projectRepository: IProjectRepository
  ) {}

  public async execute(id: string): Promise<IProject | null> {
    return await this._projectRepository.findById(id);
  }
}

import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IProjectRepository, GetProjectsQuery, PaginatedProjects } from "../../interfaces/repositories/IProjectRepository";

@injectable()
export class GetProjectsUseCase implements IUseCase<GetProjectsQuery, PaginatedProjects> {
  constructor(
    @inject("ProjectRepository")
    private _projectRepository: IProjectRepository
  ) {}

  public async execute(query: GetProjectsQuery): Promise<PaginatedProjects> {
    return await this._projectRepository.findPaginated(query);
  }
}

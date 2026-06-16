import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IProjectRepository } from "../../interfaces/repositories/IProjectRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";

@injectable()
export class DeleteProjectUseCase implements IUseCase<string, boolean> {
  constructor(
    @inject("ProjectRepository")
    private _projectRepository: IProjectRepository,
    @inject("ClientRepository")
    private _clientRepository: IClientRepository
  ) {}

  public async execute(id: string): Promise<boolean> {
    const project = await this._projectRepository.findById(id);
    if (!project) {
      return false;
    }

    const deleted = await this._projectRepository.delete(id);
    if (deleted) {
      const clientId = typeof project.clientRef === "string" ? project.clientRef : (project.clientRef as any).id;
      if (clientId) {
        const client = await this._clientRepository.findById(clientId);
        if (client) {
          await this._clientRepository.update(clientId, {
            projectsCount: Math.max(0, (client.projectsCount || 0) - 1)
          });
        }
      }
    }
    return deleted;
  }
}

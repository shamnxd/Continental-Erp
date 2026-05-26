import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { syncClientAmcStatusFromContracts } from "../../utils/syncClientAmcStatus";

@injectable()
export class DeleteAmcUseCase implements IUseCase<string, boolean> {
  constructor(
    @inject("AmcRepository") private _amcRepository: IAmcRepository,
    @inject("ClientRepository") private _clientRepository: IClientRepository
  ) {}

  public async execute(id: string): Promise<boolean> {
    const existing = await this._amcRepository.findById(id);
    if (!existing) return false;

    const deleted = await this._amcRepository.delete(id);
    if (deleted) {
      await syncClientAmcStatusFromContracts(existing.clientId, this._clientRepository, this._amcRepository);
    }
    return deleted;
  }
}

import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { CreateClientDto } from "../../dtos/client.dto";
import { IClient } from "../../interfaces/models/IClient";
import { ITallySyncService } from "../../interfaces/services/ITallySyncService";

@injectable()
export class CreateClientUseCase implements IUseCase<CreateClientDto, IClient> {
  constructor(
    @inject("ClientRepository")
    private _clientRepository: IClientRepository,
    @inject("TallySyncService")
    private _tallySyncService: ITallySyncService
  ) {}

  public async execute(dto: CreateClientDto): Promise<IClient> {
    const client = await this._clientRepository.create(dto);
    await this._tallySyncService.enqueueClient(client);
    return client;
  }
}

import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { UpdateClientDto } from "../../dtos/client.dto";
import { IClient } from "../../interfaces/models/IClient";
import { AppError } from "../../errors/AppError";
import { StatusCode } from "../../constants/statusCodes";
import { ITallySyncService } from "../../interfaces/services/ITallySyncService";

interface UpdateClientRequest {
  id: string;
  data: UpdateClientDto;
}

@injectable()
export class UpdateClientUseCase implements IUseCase<UpdateClientRequest, IClient> {
  constructor(
    @inject("ClientRepository")
    private _clientRepository: IClientRepository,
    @inject("TallySyncService")
    private _tallySyncService: ITallySyncService
  ) {}

  public async execute(request: UpdateClientRequest): Promise<IClient> {
    const updatedClient = await this._clientRepository.update(request.id, request.data);
    if (!updatedClient) {
      throw new AppError("Client not found", StatusCode.NOT_FOUND);
    }
    await this._tallySyncService.enqueueClient(updatedClient);
    return updatedClient;
  }
}

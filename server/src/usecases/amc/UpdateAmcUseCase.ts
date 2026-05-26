import { injectable, inject } from "tsyringe";
import { BadRequestError } from "../../errors/BadRequestError";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { UpdateAmcDto } from "../../dtos/amc.dto";
import { IAmc } from "../../interfaces/models/IAmc";
import { computeAmcContractStatus } from "../../utils/computeAmcContractStatus";
import { syncClientAmcStatusFromContracts } from "../../utils/syncClientAmcStatus";
import { resolveAmcTotalVisits } from "../../utils/calculateAmcTotalVisits";

@injectable()
export class UpdateAmcUseCase implements IUseCase<{ id: string; data: UpdateAmcDto }, IAmc | null> {
  constructor(
    @inject("AmcRepository") private _amcRepository: IAmcRepository,
    @inject("ClientRepository") private _clientRepository: IClientRepository
  ) {}

  public async execute(params: { id: string; data: UpdateAmcDto }): Promise<IAmc | null> {
    const existing = await this._amcRepository.findById(params.id);
    if (!existing) return null;

    const clientId = params.data.clientId ?? existing.clientId;
    const client = await this._clientRepository.findById(clientId);
    if (!client) {
      throw new BadRequestError("Selected client not found");
    }

    const startDate = params.data.startDate ? new Date(params.data.startDate) : existing.startDate;
    const endDate = params.data.endDate ? new Date(params.data.endDate) : existing.endDate;
    const frequency = params.data.frequency ?? existing.frequency;
    const totalVisits = resolveAmcTotalVisits({
      startDate,
      endDate,
      frequency,
      totalVisits: params.data.totalVisits,
      overrideTotalVisits: params.data.overrideTotalVisits
    });
    const status = computeAmcContractStatus(endDate);
    const location = client.address ? `${client.address}, ${client.city}` : client.city;

    const updated = await this._amcRepository.update(params.id, {
      clientId,
      clientName: client.companyName,
      contactPerson: client.contactPerson,
      phone: client.phone,
      email: client.email,
      location,
      startDate,
      endDate,
      frequency,
      nextVisit:
        params.data.nextVisit !== undefined
          ? params.data.nextVisit
            ? new Date(params.data.nextVisit)
            : null
          : existing.nextVisit,
      status,
      amount: params.data.amount ?? existing.amount,
      totalVisits,
      serviceType: params.data.serviceType?.trim() ?? existing.serviceType,
      notes: params.data.notes !== undefined ? params.data.notes?.trim() || "" : existing.notes
    });

    if (updated) {
      await syncClientAmcStatusFromContracts(clientId, this._clientRepository, this._amcRepository);
      if (clientId !== existing.clientId) {
        await syncClientAmcStatusFromContracts(existing.clientId, this._clientRepository, this._amcRepository);
      }
    }

    return updated;
  }
}

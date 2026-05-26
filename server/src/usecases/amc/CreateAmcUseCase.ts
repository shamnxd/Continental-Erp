import { injectable, inject } from "tsyringe";
import { BadRequestError } from "../../errors/BadRequestError";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { CreateAmcDto } from "../../dtos/amc.dto";
import { IAmc } from "../../interfaces/models/IAmc";
import { computeAmcContractStatus } from "../../utils/computeAmcContractStatus";
import { syncClientAmcStatusFromContracts } from "../../utils/syncClientAmcStatus";
import { resolveAmcTotalVisits } from "../../utils/calculateAmcTotalVisits";

@injectable()
export class CreateAmcUseCase implements IUseCase<CreateAmcDto, IAmc> {
  constructor(
    @inject("AmcRepository") private _amcRepository: IAmcRepository,
    @inject("ClientRepository") private _clientRepository: IClientRepository
  ) {}

  public async execute(dto: CreateAmcDto): Promise<IAmc> {
    const client = await this._clientRepository.findById(dto.clientId);
    if (!client) {
      throw new BadRequestError("Selected client not found");
    }

    if (dto.renewalOfAmcId?.trim()) {
      const previous = await this._amcRepository.findById(dto.renewalOfAmcId.trim());
      if (!previous) {
        throw new BadRequestError("Previous AMC contract not found for renewal");
      }
      if (previous.clientId !== dto.clientId) {
        throw new BadRequestError("Renewal must be for the same client");
      }
      if (previous.status !== "Expired" && previous.status !== "Due for Renewal") {
        throw new BadRequestError("Only expired or due-for-renewal contracts can be renewed");
      }
    } else {
      const activeCount = await this._amcRepository.countActiveByClientId(dto.clientId);
      if (activeCount > 0) {
        throw new BadRequestError(
          "This client already has an active AMC contract. Create a renewal instead of a new contract."
        );
      }
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const totalVisits = resolveAmcTotalVisits({
      startDate,
      endDate,
      frequency: dto.frequency,
      totalVisits: dto.totalVisits,
      overrideTotalVisits: dto.overrideTotalVisits
    });
    const status = computeAmcContractStatus(endDate);
    const location = client.address ? `${client.address}, ${client.city}` : client.city;

    const amc = await this._amcRepository.create({
      clientId: dto.clientId,
      clientName: client.companyName,
      contactPerson: client.contactPerson,
      phone: client.phone,
      email: client.email,
      location,
      startDate,
      endDate,
      frequency: dto.frequency,
      nextVisit: dto.nextVisit ? new Date(dto.nextVisit) : null,
      status,
      amount: dto.amount,
      visitsCompleted: 0,
      totalVisits,
      serviceType: dto.serviceType.trim(),
      notes: dto.notes?.trim() || ""
    });

    if (dto.renewalOfAmcId?.trim()) {
      await this._amcRepository.update(dto.renewalOfAmcId.trim(), { status: "Expired" });
    }

    await syncClientAmcStatusFromContracts(dto.clientId, this._clientRepository, this._amcRepository);
    return amc;
  }
}

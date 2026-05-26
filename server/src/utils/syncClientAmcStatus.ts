import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { IAmcRepository } from "../interfaces/repositories/IAmcRepository";
import { mapAmcStatusToClientAmcStatus } from "./computeAmcContractStatus";
import { AmcContractStatus } from "../interfaces/models/IAmc";

export async function syncClientAmcStatusFromContracts(
  clientId: string,
  clientRepository: IClientRepository,
  amcRepository: IAmcRepository
): Promise<void> {
  const activeCount = await amcRepository.countActiveByClientId(clientId);
  const amcStatus = activeCount > 0 ? "Active" : "Inactive";
  await clientRepository.update(clientId, { amcStatus });
}

export function clientAmcStatusFromContractStatus(status: AmcContractStatus): "Active" | "Inactive" | "Expired" {
  return mapAmcStatusToClientAmcStatus(status);
}

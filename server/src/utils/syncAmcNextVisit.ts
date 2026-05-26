import { IAmcRepository } from "../interfaces/repositories/IAmcRepository";
import { IAmcVisitRepository } from "../interfaces/repositories/IAmcVisitRepository";

/** Set contract nextVisit to the earliest open (Scheduled) visit date. */
export async function syncAmcNextVisit(
  amcId: string,
  amcRepository: IAmcRepository,
  visitRepository: IAmcVisitRepository
): Promise<void> {
  const visits = await visitRepository.findScheduledByAmcId(amcId);
  const nextDate =
    visits.length > 0
      ? visits.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())[0].scheduledDate
      : null;

  await amcRepository.update(amcId, { nextVisit: nextDate });
}

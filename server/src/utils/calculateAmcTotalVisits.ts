import { AmcFrequency } from "../interfaces/models/IAmc";

const MONTHS_PER_FREQUENCY: Record<AmcFrequency, number> = {
  Monthly: 1,
  Quarterly: 3,
  "Bi-Annual": 6,
  Annual: 12
};

function monthsBetween(start: Date, end: Date): number {
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

export function calculateAmcTotalVisits(
  startDate: Date,
  endDate: Date,
  frequency: AmcFrequency
): number {
  if (endDate < startDate) return 0;

  const spanMonths = monthsBetween(startDate, endDate);
  const periodMonths = MONTHS_PER_FREQUENCY[frequency];
  return Math.max(1, Math.ceil(spanMonths / periodMonths));
}

export function resolveAmcTotalVisits(params: {
  startDate: Date;
  endDate: Date;
  frequency: AmcFrequency;
  totalVisits?: number;
  overrideTotalVisits?: boolean;
}): number {
  const calculated = calculateAmcTotalVisits(params.startDate, params.endDate, params.frequency);
  if (params.overrideTotalVisits && params.totalVisits != null) {
    return params.totalVisits;
  }
  return calculated;
}

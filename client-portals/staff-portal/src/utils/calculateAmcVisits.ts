import type { AmcFrequency } from "../interfaces/amc.interface";

const MONTHS_PER_FREQUENCY: Record<AmcFrequency, number> = {
  Monthly: 1,
  Quarterly: 3,
  "Bi-Annual": 6,
  Annual: 12,
};

/** Parse API date (YYYY-MM-DD or ISO datetime). */
function parseContractDate(value: string): Date | null {
  if (!value?.trim()) return null;
  const d = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Whole calendar months between two dates (end on or after start). */
function monthsBetween(start: Date, end: Date): number {
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

/**
 * Expected visit count for an AMC contract.
 * Example: 1 year + Quarterly → 4 visits (ceil(12 / 3)).
 */
export function calculateTotalVisits(
  startDate: string,
  endDate: string,
  frequency: AmcFrequency
): number {
  if (!startDate || !endDate) return 1;

  const start = parseContractDate(startDate);
  const end = parseContractDate(endDate);
  if (!start || !end || end < start) {
    return 0;
  }

  const spanMonths = monthsBetween(start, end);
  const periodMonths = MONTHS_PER_FREQUENCY[frequency];
  return Math.max(1, Math.ceil(spanMonths / periodMonths));
}

function toDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Preferred date for a specific visit slot (1-based index).
 * Contract span is divided evenly across total visits.
 * Example: Jan 1 2026 – Jan 1 2027, 4 visits → Apr 1, Jul 1, Oct 1, Jan 1 2027.
 */
export function calculatePreferredVisitDate(
  startDate: string,
  endDate: string,
  visitIndex: number,
  totalVisits: number
): string | null {
  const slots = Math.max(1, Math.floor(Number(totalVisits)) || 1);
  if (!startDate || !endDate || visitIndex < 1 || visitIndex > slots) {
    return null;
  }

  const start = parseContractDate(startDate);
  const end = parseContractDate(endDate);
  if (!start || !end || end < start) {
    return null;
  }

  if (visitIndex === slots) {
    return toDateOnly(end);
  }

  const spanMonths = monthsBetween(start, end);
  const monthsToAdd = Math.round((visitIndex * spanMonths) / slots);
  const next = new Date(start);
  next.setMonth(next.getMonth() + monthsToAdd);
  return toDateOnly(next);
}

/** Next preferred visit based on how many visits are already completed. */
export function calculateNextPreferredVisitDate(
  startDate: string,
  endDate: string,
  visitsCompleted: number,
  totalVisits: number
): string | null {
  const completed = Math.max(0, Number(visitsCompleted) || 0);
  const total = Math.max(0, Number(totalVisits) || 0);
  if (!startDate || !endDate || total <= 0 || completed >= total) {
    return null;
  }
  return calculatePreferredVisitDate(startDate, endDate, completed + 1, total);
}

/** Human-readable date for labels (e.g. 26 May 2026). */
export function formatContractDate(isoDate: string): string {
  if (!isoDate) return "";
  const d = parseContractDate(isoDate);
  if (!d) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

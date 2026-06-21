import type { AmcContract } from "../interfaces/amc.interface";

function parseDate(value: string): Date | null {
  if (!value?.trim()) return null;
  const d = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDefaultRenewalDates(previousEndDate: string): {
  startDate: string;
  endDate: string;
} {
  const prevEnd = parseDate(previousEndDate) ?? new Date();
  const start = new Date(prevEnd);
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  return { startDate: toDateInput(start), endDate: toDateInput(end) };
}

export function canRenewAmc(contract: AmcContract): boolean {
  return contract.status === "Expired" || contract.status === "Due for Renewal";
}

export function hasBlockingAmcContract(contracts: AmcContract[]): AmcContract | null {
  return (
    contracts.find((c) => c.status === "Active" || c.status === "Due for Renewal") ?? null
  );
}

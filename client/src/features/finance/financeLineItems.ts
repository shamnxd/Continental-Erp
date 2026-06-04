import type { FinanceLineItem, GstSupplyType } from "../../interfaces/finance.interface";
import type { RoundOffMode } from "./financeFormConstants";

export function resolveRoundOffAmount(
  beforeRound: number,
  mode: RoundOffMode,
  manualValue?: number,
): number {
  if (mode === "none") return 0;
  if (mode === "manual") return Number(manualValue) || 0;
  return Math.round(beforeRound) - beforeRound;
}

export function emptyLineItem(): FinanceLineItem {
  return {
    description: "",
    itemCode: "",
    unit: "Nos",
    qty: 1,
    rate: 0,
    discountPercent: 0,
    total: 0,
    hsnSac: "998719",
  };
}

export function lineGross(item: Pick<FinanceLineItem, "qty" | "rate">): number {
  return (Number(item.qty) || 0) * (Number(item.rate) || 0);
}

export function lineNet(item: Pick<FinanceLineItem, "qty" | "rate" | "discountPercent">): number {
  const gross = lineGross(item);
  const disc = Number(item.discountPercent) || 0;
  return Math.round(gross * (1 - disc / 100));
}

export function computeDocumentTotals(
  items: FinanceLineItem[],
  gstPercent: number,
  supplyType: GstSupplyType = "intra",
  headerDiscount = 0,
  roundOffInput?: number,
  taxRates?: { cgstPercent?: number; sgstPercent?: number; igstPercent?: number; vatPercent?: number },
) {
  const subtotal = items.reduce((sum, i) => sum + lineNet(i), 0);
  const discountTotal = Math.max(0, headerDiscount);
  const taxableAmount = Math.max(0, subtotal - discountTotal);

  const cgstP = taxRates?.cgstPercent ?? (supplyType === "intra" ? gstPercent / 2 : 0);
  const sgstP = taxRates?.sgstPercent ?? (supplyType === "intra" ? gstPercent / 2 : 0);
  const igstP = taxRates?.igstPercent ?? (supplyType === "inter" ? gstPercent : 0);
  const vatP = taxRates?.vatPercent ?? 0;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let vatAmount = 0;
  if (vatP > 0) {
    vatAmount = Math.round((taxableAmount * vatP) / 100);
  } else if (igstP > 0) {
    igstAmount = Math.round((taxableAmount * igstP) / 100);
  } else {
    cgstAmount = Math.round((taxableAmount * cgstP) / 100);
    sgstAmount = Math.round((taxableAmount * sgstP) / 100);
  }
  const gstAmount = cgstAmount + sgstAmount + igstAmount + vatAmount;

  const beforeRound = taxableAmount + gstAmount;
  const roundOff =
    roundOffInput !== undefined ? Number(roundOffInput) || 0 : Math.round(beforeRound) - beforeRound;
  const grandTotal = beforeRound + roundOff;

  return {
    subtotal,
    discountTotal,
    taxableAmount,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    vatAmount,
    roundOff,
    grandTotal,
  };
}

export function normalizeItemsForApi(items: FinanceLineItem[]): FinanceLineItem[] {
  return items
    .filter((i) => i.description.trim())
    .map((item) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const discountPercent = Number(item.discountPercent) || 0;
      const total = lineNet({ qty, rate, discountPercent });
      return {
        description: item.description.trim(),
        itemCode: item.itemCode?.trim() || undefined,
        unit: item.unit?.trim() || "Nos",
        qty,
        rate,
        discountPercent,
        total,
        hsnSac: item.hsnSac?.trim() || undefined,
      };
    });
}

/** Simple INR amount in words for preview (client-side). */
export function amountInWordsInr(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return "Zero Rupees Only";
  if (n < 1000) return `${n} Rupees Only`;
  if (n < 100000) return `${Math.floor(n / 1000)} Thousand ${n % 1000 ? `${n % 1000} ` : ""}Rupees Only`.trim();
  if (n < 10000000) return `${Math.floor(n / 100000)} Lakh ${amountInWordsInr(n % 100000).replace(" Rupees Only", "")} Rupees Only`;
  return `${Math.floor(n / 10000000)} Crore ${amountInWordsInr(n % 10000000).replace(" Rupees Only", "")} Rupees Only`;
}

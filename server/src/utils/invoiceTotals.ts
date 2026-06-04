import { IFinanceLineItem } from "../interfaces/models/IFinanceLineItem";

export type GstSupplyType = "intra" | "inter";

export function lineGross(item: Pick<IFinanceLineItem, "qty" | "rate">): number {
  return (Number(item.qty) || 0) * (Number(item.rate) || 0);
}

export function lineNet(item: Pick<IFinanceLineItem, "qty" | "rate" | "discountPercent">): number {
  const gross = lineGross(item);
  const disc = Number(item.discountPercent) || 0;
  return Math.round(gross * (1 - disc / 100));
}

export function normalizeFinanceLineItems(
  items: Array<{
    description: string;
    qty: number;
    rate: number;
    total?: number;
    hsnSac?: string;
    itemCode?: string;
    unit?: string;
    discountPercent?: number;
  }>,
): IFinanceLineItem[] {
  return items
    .filter((i) => i.description?.trim())
    .map((item) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const discountPercent = Number(item.discountPercent) || 0;
      const total = lineNet({ qty, rate, discountPercent });
      return {
        description: item.description.trim(),
        qty,
        rate,
        total,
        hsnSac: item.hsnSac?.trim() || undefined,
        itemCode: item.itemCode?.trim() || undefined,
        unit: item.unit?.trim() || "Nos",
        discountPercent,
      };
    });
}

export interface TaxRateBreakdown {
  cgstPercent?: number;
  sgstPercent?: number;
  igstPercent?: number;
  vatPercent?: number;
}

export function computeInvoiceTotals(
  items: IFinanceLineItem[],
  gstPercent: number,
  supplyType: GstSupplyType,
  headerDiscount = 0,
  roundOffInput?: number,
  taxRates?: TaxRateBreakdown,
) {
  const subtotal = items.reduce((sum, i) => sum + (i.total ?? lineNet(i)), 0);
  const discountTotal = Math.max(0, Number(headerDiscount) || 0);
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
    roundOffInput !== undefined && roundOffInput !== null
      ? Number(roundOffInput) || 0
      : Math.round(beforeRound) - beforeRound;
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

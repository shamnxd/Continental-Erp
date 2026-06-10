import { IQuotationLineItem } from "../interfaces/models/IQuotation";

export function computeQuotationTotals(
  items: IQuotationLineItem[],
  gstPercent: number,
): { amount: number; gst: number; total: number } {
  const amount = items.reduce((sum, item) => sum + (item.total ?? item.qty * item.rate), 0);
  const gst = Math.round((amount * gstPercent) / 100);
  const total = amount + gst;
  return { amount, gst, total };
}

export function normalizeLineItems(
  items: Array<{ description: string; qty: number; rate: number; total?: number; section?: "machine_side" | "low_side"; unit?: string }>,
): IQuotationLineItem[] {
  return items.map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const total = item.total != null ? Number(item.total) : qty * rate;
    return {
      description: item.description.trim(),
      qty,
      rate,
      total,
      section: item.section || "machine_side",
      unit: item.unit || "",
    };
  });
}

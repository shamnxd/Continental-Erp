import { IQuotationLineItem } from "../interfaces/models/IQuotation";

export function computeQuotationTotals(
  items: IQuotationLineItem[],
  gstPercent: number,
  machineGstPercent?: number,
  lowSideGstPercent?: number,
): { amount: number; gst: number; total: number } {
  const amount = items.reduce((sum, item) => sum + (item.total ?? item.qty * item.rate), 0);
  
  const mGstPercent = machineGstPercent !== undefined ? machineGstPercent : 28;
  const lGstPercent = lowSideGstPercent !== undefined ? lowSideGstPercent : 18;

  const gst = Math.round(
    items.reduce((sum, item) => {
      const itemAmount = item.total ?? item.qty * item.rate;
      const rate = item.section === "low_side" ? lGstPercent : mGstPercent;
      return sum + (itemAmount * rate) / 100;
    }, 0)
  );
  
  const total = amount + gst;
  return { amount, gst, total };
}

export function normalizeLineItems(
  items: Array<{
    description: string;
    qty: number;
    rate: number;
    total?: number;
    section?: "machine_side" | "low_side";
    unit?: string;
    group?: string;
    isDescriptionOnly?: boolean;
  }>,
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
      group: item.group || "",
      isDescriptionOnly: item.isDescriptionOnly || false,
    };
  });
}


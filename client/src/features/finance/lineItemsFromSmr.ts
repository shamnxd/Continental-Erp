import type { FinanceLineItem } from "../../interfaces/finance.interface";
import type { SMR } from "../../interfaces/smr.interface";
import { emptyLineItem } from "./financeLineItems";

/** Build editable invoice lines from SMR service report (rates entered on invoice). */
export function lineItemsFromSmr(smr: SMR): FinanceLineItem[] {
  const lines: FinanceLineItem[] = [];

  smr.acUnits.forEach((unit, idx) => {
    const desc = [
      "Service / maintenance",
      unit.type,
      unit.make,
      unit.modelNo ? `Model ${unit.modelNo}` : "",
      unit.location && unit.location !== "N/A" ? `@ ${unit.location}` : "",
    ]
      .filter(Boolean)
      .join(" — ");

    lines.push({
      itemCode: `SMR-EQ-${idx + 1}`,
      description: desc.trim(),
      unit: "Nos",
      qty: unit.quantity || 1,
      rate: 0,
      discountPercent: 0,
      total: 0,
      hsnSac: "998719",
    });
  });

  if (smr.serviceRendered?.trim()) {
    lines.push({
      itemCode: "SMR-SVC",
      description: `Service rendered: ${smr.serviceRendered.trim().slice(0, 120)}${smr.serviceRendered.length > 120 ? "…" : ""}`,
      unit: "Job",
      qty: 1,
      rate: 0,
      discountPercent: 0,
      total: 0,
      hsnSac: "998719",
    });
  }

  if (smr.natureOfComplaint?.trim()) {
    lines.push({
      itemCode: "SMR-CMP",
      description: `Complaint: ${smr.natureOfComplaint.trim().slice(0, 100)}`,
      unit: "Nos",
      qty: 1,
      rate: 0,
      discountPercent: 0,
      total: 0,
    });
  }

  return lines.length > 0 ? lines : [emptyLineItem()];
}

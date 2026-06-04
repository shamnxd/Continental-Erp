import type { GstSupplyType } from "../../interfaces/finance.interface";

export type TaxScheme = "gst_intra" | "gst_inter" | "vat";

export interface TaxRateInput {
  scheme: TaxScheme;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  vatPercent: number;
}

export function taxSchemeFromSupplyType(supplyType: GstSupplyType): TaxScheme {
  return supplyType === "inter" ? "gst_inter" : "gst_intra";
}

/** Split combined GST % equally for intra-state CGST + SGST. */
export function defaultIntraRates(gstPercent: number): { cgstPercent: number; sgstPercent: number } {
  const half = gstPercent / 2;
  return { cgstPercent: half, sgstPercent: half };
}

export function ratesForScheme(scheme: TaxScheme, gstPercent = 18): TaxRateInput {
  if (scheme === "gst_inter") {
    return { scheme, cgstPercent: 0, sgstPercent: 0, igstPercent: gstPercent, vatPercent: 0 };
  }
  if (scheme === "vat") {
    return { scheme, cgstPercent: 0, sgstPercent: 0, igstPercent: 0, vatPercent: gstPercent };
  }
  const { cgstPercent, sgstPercent } = defaultIntraRates(gstPercent);
  return { scheme, cgstPercent, sgstPercent, igstPercent: 0, vatPercent: 0 };
}

export function effectiveGstPercent(rates: TaxRateInput): number {
  if (rates.scheme === "vat") return rates.vatPercent;
  if (rates.scheme === "gst_inter") return rates.igstPercent;
  return rates.cgstPercent + rates.sgstPercent;
}

export function supplyTypeFromScheme(scheme: TaxScheme): GstSupplyType {
  return scheme === "gst_inter" ? "inter" : "intra";
}

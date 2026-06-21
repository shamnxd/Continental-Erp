/**
 * costingExcelExport.ts
 * ─────────────────────
 * Standalone Excel export for the costing module.
 * Extracted from CostingTab.tsx so the React component stays lean.
 *
 * Entry point:  exportCostingToExcel(costing: ICosting)
 */

// @ts-ignore
import XLSX from "xlsx-js-style";
import { ICosting } from "../../../interfaces/costing.interface";
import { normalizeSize } from "./CostingCalculator";

// ─────────────────────────────────────────────────────────────
// Column helpers
// ─────────────────────────────────────────────────────────────
const numCell = (val: number, format?: string) => ({
  v: val || 0,
  t: "n",
  z: format || undefined
});
export const currencyCell = (val: number) => numCell(val, "₹#,##0");
export const qtyCell = (val: number) => numCell(val, "#,##0");
export const percentCell = (val: number) => numCell(val, "0.0%");
export const formulaCell = (formula: string, val?: number, format = "₹#,##0") => ({
  v: val ?? 0,
  t: "n",
  f: formula,
  z: format
});

// ─────────────────────────────────────────────────────────────
// Column width auto-fit
// ─────────────────────────────────────────────────────────────
export const autoFitColumns = (ws: any, descCols: number[] = [], minWidths: number[] = []) => {
  if (!ws) return;
  const ref = ws["!ref"];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  const cols: any[] = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLen = minWidths[C] || 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellRef];
      if (cell && cell.v !== undefined && cell.v !== null) {
        let valStr = String(cell.v);
        if (cell.f && !cell.v) valStr = "123,456.00";
        if (valStr.length > maxLen) maxLen = valStr.length;
      }
    }
    const isDesc = descCols.includes(C);
    const limit = isDesc ? 25 : 18;
    cols.push({ wch: Math.min(limit, maxLen + 3) });
  }
  ws["!cols"] = cols;
};

// ─────────────────────────────────────────────────────────────
// Summary-row detector (for styling)
// ─────────────────────────────────────────────────────────────
const isRowSummary = (ws: any, R: number, range: any) => {
  for (let C = 0; C <= 1; ++C) {
    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
    if (cell && typeof cell.v === "string") {
      const v = cell.v.toLowerCase().trim();
      if (
        v.startsWith("total") || v.startsWith("subtotal") || v.startsWith("sub total") ||
        v.startsWith("sub-total") || v.startsWith("project value") ||
        v.startsWith("final value") || v.startsWith("final project value") ||
        v.startsWith("invoiced value") || v.startsWith("grand total") ||
        v === "gst" || v === "over head" || v.startsWith("profit")
      ) return true;
    }
  }
  return false;
};

// ─────────────────────────────────────────────────────────────
// Company header block (rows 1-8)
// ─────────────────────────────────────────────────────────────
export const createCompanyHeader = (sheetTitle: string, costing: ICosting) => [
  [],
  ["CONTINENTAL - SERVICE MANAGEMENT SYSTEM"],
  [sheetTitle],
  [],
  ["Enquiry No:", costing.enquiryNo, "Date:", new Date(costing.date).toLocaleDateString(), "Location:", costing.location, "TR:", { v: costing.totalTR, t: "n", z: "0.0" }],
  ["Project Name:", costing.projectName, "Type of Unit:", costing.unitType, "Make:", costing.make, "", ""],
  ["Prepared By:", costing.preparedBy, "Approved By:", costing.approvedBy || "Admin", "", "", "", ""],
  []
];

// ─────────────────────────────────────────────────────────────
// Revision footer
// ─────────────────────────────────────────────────────────────
export const addRevisionFooter = (data: any[], costing: ICosting) => {
  data.push([]);
  data.push([
    "Document Control:",
    `Enquiry No: ${costing.enquiryNo}`,
    `Revision: Rev ${costing.revision}`,
    `Date: ${new Date(costing.date).toLocaleDateString()}`,
    `Prepared By: ${costing.preparedBy}`,
    `Approved By: ${costing.approvedBy || "Admin"}`
  ]);
};

// ─────────────────────────────────────────────────────────────
// Worksheet styling  (reference palette)
// ─────────────────────────────────────────────────────────────
export const applyWorksheetStyles = (
  ws: any,
  tabType: "summary" | "highside" | "lowside" | "estimates" | "copper_pipes",
  eqLen = 0,
  lsLen = 0,
  acctStartRow = 0
) => {
  if (!ws) return;
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  ws["!views"] = [{ state: "frozen", ySplit: 9 }];
  ws["!protect"] = { selectLockedCells: true, selectUnlockedCells: true };

  for (let R = range.s.r; R <= range.e.r; ++R) {
    const rowNum = R + 1;
    const isSummaryRow = isRowSummary(ws, R, range);

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = ws[cellRef];
      if (!cell) continue;

      cell.s = {
        font: { name: "Segoe UI", sz: 9, color: { rgb: "334155" } },
        alignment: { vertical: "center", horizontal: "left", wrapText: false },
        border: {
          top:    { style: "thin", color: { rgb: "CBD5E1" } },
          bottom: { style: "thin", color: { rgb: "CBD5E1" } },
          left:   { style: "thin", color: { rgb: "CBD5E1" } },
          right:  { style: "thin", color: { rgb: "CBD5E1" } }
        }
      };

      if (C === 1 || (tabType === "estimates" && C === 3) || (tabType === "copper_pipes" && C === 0)) {
        cell.s.alignment.wrapText = true;
      }

      // Number formatting
      if (cell.t === "n") {
        cell.s.alignment.horizontal = "center";
        if (!cell.z) {
          const val = cell.v;
          if (typeof val === "number") {
            if (val > 0 && val <= 1 && (cellRef.includes("D") || cellRef.includes("F") || cellRef.includes("G") || cellRef.includes("H") || cellRef.includes("I") || cellRef.includes("J") || cellRef.includes("K"))) {
              cell.z = "0.0%";
            } else if (val > 5 && C >= 2) {
              cell.z = "₹#,##0";
            } else {
              cell.z = "0";
            }
          }
        }
      } else if (cell.t === "s" && typeof cell.v === "string") {
        if (/^\d+$/.test(cell.v)) cell.s.alignment.horizontal = "center";
      }

      // Banner rows
      if (rowNum === 2) {
        cell.s.font = { name: "Calibri", sz: 12, bold: true, color: { rgb: "FFFFFF" } };
        cell.s.fill = { fgColor: { rgb: "00B050" } };
        cell.s.alignment = { vertical: "center", horizontal: "center" };
      } else if (rowNum === 3) {
        cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } };
        cell.s.fill = { fgColor: { rgb: "00B050" } };
        cell.s.alignment = { vertical: "center", horizontal: "center" };
      } else if (rowNum >= 5 && rowNum <= 7) {
        if (C === 0 || C === 2 || C === 4 || C === 6) {
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "595959" } };
          cell.s.alignment = { vertical: "center", horizontal: "left" };
        } else {
          cell.s.font = { name: "Calibri", sz: 9, color: { rgb: "1E293B" } };
          cell.s.alignment = { vertical: "center", horizontal: "left" };
        }
      }

      // Table header rows
      const ESTIMATE_HEADER_VALUES = new Set([
        "Description", "UR", "Qty", "Unit", "Total",
        "Desc.", "Qty (Sq.m)", "No. Of Sheet", "Wt/Sheet", "Total Wt", "Rate/Kg", "Rate/SqMtr",
        "Grill Size/Desc", "Grill Size", "Area (Sq.ft)", "Rate/Sq. ft", "Rate"
      ]);
      const isTableHeaderRow =
        ((tabType === "summary" || tabType === "highside") && rowNum === 10) ||
        (tabType === "lowside" && (rowNum === 10 || rowNum === 11)) ||
        (tabType === "estimates" && ESTIMATE_HEADER_VALUES.has(cell.v as string)) ||
        (tabType === "copper_pipes" && (cell.v === "CU PIPE SIZES" || cell.v === "RATE" || cell.v === "SLEEVES" || cell.v === "UNIT" || cell.v === "TOTAL" || cell.v === "ADD 10 % ACCESR" || cell.v === "REMARKS"));

      if (isTableHeaderRow) {
        cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
        cell.s.fill = { fgColor: { rgb: "93CDDD" } };
        cell.s.alignment = { vertical: "center", horizontal: "center" };
      }

      // Summary rows
      if (isSummaryRow && rowNum > 8) {
        cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
        cell.s.fill = { fgColor: { rgb: "95B3D7" } };
        const cv = String(cell.v || "").toLowerCase();
        if (cv.includes("final project value") || cv.includes("final value with tax") || cv.includes("price per tr")) {
          cell.s.border.bottom = { style: "double", color: { rgb: "00B050" } };
        }
      }

      // HIGH SIDE accounts section → yellow
      if (tabType === "highside" && acctStartRow > 0 && rowNum >= acctStartRow) {
        if (rowNum === acctStartRow) {
          cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
          cell.s.alignment = { vertical: "center", horizontal: "center" };
        } else if (rowNum === acctStartRow + 1) {
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
          cell.s.alignment = { vertical: "center", horizontal: "center" };
        } else if (isSummaryRow) {
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
        }
      }

      // LOW SIDE accounts columns (J-M) → yellow
      if (tabType === "lowside" && C >= 9 && C <= 12) {
        if (rowNum === 9 || rowNum === 10) {
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
          cell.s.alignment = { vertical: "center", horizontal: "center" };
        } else if (isSummaryRow && rowNum > 10) {
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
        }
      }

      // MATERIAL SUMMARY section titles
      if (tabType === "estimates" && rowNum > 8) {
        const titleCell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
        if (titleCell && typeof titleCell.v === "string") {
          const desc = titleCell.v;
          const isNumberedSection = /^\d+\.\s/.test(desc);
          const isLetterSection   = /^[a-d]\.\s/.test(desc);
          const isTotalForRow     = desc.startsWith("Total for") || desc === "Total";
          if (isNumberedSection) {
            cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } };
            cell.s.fill = { patternType: "none" };
            cell.s.border.bottom = { style: "thin", color: { rgb: "93CDDD" } };
            cell.s.border.top    = { style: "thin", color: { rgb: "93CDDD" } };
          } else if (isLetterSection) {
            cell.s.font = { name: "Calibri", sz: 9, bold: true, italic: true, color: { rgb: "1E293B" } };
            cell.s.fill = { patternType: "none" };
          } else if (isTotalForRow) {
            cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          }
        }
      }

      // Copper pipe special headers
      if (tabType === "copper_pipes" && (cell.v === "HARD PIPES" || cell.v === "SOFT PIPES")) {
        cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } };
        cell.s.fill = { fgColor: { rgb: "00B050" } };
        cell.s.alignment = { vertical: "center", horizontal: "center" };
      }

      // Cell protection
      const isHeaderArea = rowNum <= 9;
      const locked = isHeaderArea || isSummaryRow || isTableHeaderRow || cell.f !== undefined;
      cell.s.protection = { locked };
    }
  }
};

// ─────────────────────────────────────────────────────────────
// Main export function
// ─────────────────────────────────────────────────────────────
export function exportCostingToExcel(activeCosting: ICosting) {
  const wb = XLSX.utils.book_new();

  const hsMarkups = [
    { name: "Design",              key: "designPercent" },
    { name: "Warranty",            key: "warrantyPercent" },
    { name: "Transporation",       key: "transportationPercent" },
    { name: "UnLoading & Shifting",key: "unloadingPercent" },
    { name: "Bank Charges",        key: "bankChargesPercent" },
    { name: "Commission",          key: "commissionPercent" }
  ];

  const lsMarkups: any[] = [
    { name: "Design",              key: "designPercent",       val: undefined },
    { name: "Warranty",            key: "warrantyPercent",     val: undefined },
    { name: "Contigency",          key: "contingencyPercent",  val: undefined },
    { name: "Transporation",       key: "transportationPercent", val: undefined },
    { name: "Accomadation & Food", key: undefined,             val: activeCosting.lowSide.accommodationValue },
    { name: "Unloading",           key: "unloadingPercent",    val: undefined },
    { name: "Bank Charges",        key: "bankChargesPercent",  val: undefined }
  ];

  // ── MATERIAL SUMMARY ──────────────────────────────────────
  const materialData: any[] = [];
  materialData.push(...createCompanyHeader("MATERIAL SUMMARY FOR DSU", activeCosting));

  const addSectionTable = (title: string, items: any[], subTitleLabel = "Total") => {
    materialData.push([title]);
    materialData.push(["Description", "UR", "Qty", "Unit", "Total"]);
    const startRow = materialData.length + 1;
    (items || []).forEach(() => {
      const currR = materialData.length + 1;
      const item = items[currR - startRow];
      const name = item.description || item.size || "";
      materialData.push([name, currencyCell(item.ur), qtyCell(item.qty), item.unit || "Rmt", formulaCell(`=B${currR}*C${currR}`, item.qty * item.ur)]);
    });
    const endRow = materialData.length;
    const totalR = materialData.length + 1;
    materialData.push([subTitleLabel, "", "", "", formulaCell(startRow <= endRow ? `=SUM(E${startRow}:E${endRow})` : "=0", items.reduce((s, i) => s + (i.qty * i.ur), 0))]);
    materialData.push([]);
    return totalR;
  };

  // Re-implement addSectionTable to handle items by reference correctly
  const addSection = (title: string, items: any[], subTitleLabel = "Total") => {
    materialData.push([title]);
    materialData.push(["Description", "UR", "Qty", "Unit", "Total"]);
    const startRow = materialData.length + 1;
    (items || []).forEach((item) => {
      const currR = materialData.length + 1;
      const name = item.description || item.size || "";
      materialData.push([name, currencyCell(item.ur), qtyCell(item.qty), item.unit || "Rmt", formulaCell(`=B${currR}*C${currR}`, item.qty * item.ur)]);
    });
    const endRow = materialData.length;
    const totalR = materialData.length + 1;
    materialData.push([subTitleLabel, "", "", "", formulaCell(startRow <= endRow ? `=SUM(E${startRow}:E${endRow})` : "=0", (items || []).reduce((s: number, i: any) => s + (i.qty * i.ur), 0))]);
    materialData.push([]);
    return totalR;
  };

  const estimate = activeCosting.lowSide.materialEstimate;

  const matInstTotalRow = addSection("1. Installation", estimate.installation?.items || []);
  const matTestTotalRow = addSection("2. Testing & Commissioining", estimate.testingCommissioning?.items || []);

  // Ref Piping
  materialData.push(["3. Ref piping"]);
  materialData.push(["Description", "UR", "Qty", "Unit", "Total"]);
  materialData.push(["Copper pipe"]);
  const cpStart = materialData.length + 1;
  estimate.refPiping.copperPipes.forEach((p) => {
    const currR = materialData.length + 1;
    materialData.push([p.size, currencyCell(p.ur), qtyCell(p.qty), "Rmt", formulaCell(`=B${currR}*C${currR}`, p.qty * p.ur)]);
  });
  const cpEnd = materialData.length;
  const cpSubtotalRow = materialData.length + 1;
  const cpSumValue = estimate.refPiping.copperPipes.reduce((sum, p) => sum + (p.qty * p.ur), 0);
  materialData.push(["Subtotal - Copper pipe", "", "", "", formulaCell(`=SUM(E${cpStart}:E${cpEnd})`, cpSumValue)]);
  materialData.push([]);

  materialData.push(["Insulation"]);
  const insStart = materialData.length + 1;
  estimate.refPiping.insulation.forEach((ins) => {
    const currR = materialData.length + 1;
    let cpIndex = estimate.refPiping.copperPipes.findIndex(cp => cp.size === ins.size);
    if (cpIndex === -1) cpIndex = estimate.refPiping.copperPipes.findIndex(cp => normalizeSize(cp.size) === normalizeSize(ins.size));
    const cpRow = cpIndex !== -1 ? cpStart + cpIndex : null;
    const calculatedQty = cpIndex !== -1 ? (estimate.refPiping.copperPipes[cpIndex].qty / 1.75) : ins.qty;
    materialData.push([ins.size, currencyCell(ins.ur), cpRow ? formulaCell(`=C${cpRow}/1.75`, calculatedQty, "#,##0") : qtyCell(calculatedQty), "Nos.", formulaCell(`=B${currR}*C${currR}`, calculatedQty * ins.ur)]);
  });
  const insEnd = materialData.length;
  const insSubtotalRow = materialData.length + 1;
  const insSumValue = estimate.refPiping.insulation.reduce((sum, ins) => {
    let cpIndex = estimate.refPiping.copperPipes.findIndex(cp => cp.size === ins.size);
    if (cpIndex === -1) cpIndex = estimate.refPiping.copperPipes.findIndex(cp => normalizeSize(cp.size) === normalizeSize(ins.size));
    const calculatedQty = cpIndex !== -1 ? (estimate.refPiping.copperPipes[cpIndex].qty / 1.75) : ins.qty;
    return sum + (calculatedQty * ins.ur);
  }, 0);
  materialData.push(["Subtotal - Insulation", "", "", "", formulaCell(`=SUM(E${insStart}:E${insEnd})`, insSumValue)]);
  materialData.push([]);

  materialData.push(["Accessories"]);
  const accStart = materialData.length + 1;
  (estimate.refPiping.accessories || []).forEach((acc) => {
    const currR = materialData.length + 1;
    materialData.push([acc.description, currencyCell(acc.ur), qtyCell(acc.qty), acc.unit, formulaCell(`=B${currR}*C${currR}`, acc.qty * acc.ur)]);
  });
  const accEnd = materialData.length;
  const accSubtotalRow = materialData.length + 1;
  const accSumValue = (estimate.refPiping.accessories || []).reduce((sum: number, acc: any) => sum + (acc.qty * acc.ur), 0);
  materialData.push(["Subtotal - Accessories", "", "", "", formulaCell(accStart <= accEnd ? `=SUM(E${accStart}:E${accEnd})` : "=0", accSumValue)]);
  materialData.push([]);

  const matRefPipingTotalRow = materialData.length + 1;
  const refPipingSumValue = cpSumValue + insSumValue + accSumValue;
  materialData.push(["Total Ref. Piping", "", "", "", formulaCell(`=E${cpSubtotalRow}+E${insSubtotalRow}+E${accSubtotalRow}`, refPipingSumValue)]);
  materialData.push([]);

  const matCtrlCablingTotalRow = addSection("4. Control Cabling", estimate.controlCabling?.cables || []);
  const matPwrCablingTotalRow  = addSection("5. Power Cabling",   estimate.powerCabling?.cables || []);

  // Drain piping
  materialData.push(["6. Drain piping"]);
  materialData.push(["Description", "UR", "Qty", "Unit", "Total"]);
  materialData.push(["UPVC or PVC pipe WITH SLEEV ( NITRILE RUBBER )"]);
  const dpStart = materialData.length + 1;
  estimate.drainPiping.pvcPipes.forEach((p) => {
    const currR = materialData.length + 1;
    materialData.push([p.size, currencyCell(p.ur), qtyCell(p.qty), "Rmt", formulaCell(`=B${currR}*C${currR}`, p.qty * p.ur)]);
  });
  const dpEnd = materialData.length;
  const dpSubtotalRow = materialData.length + 1;
  const dpSumValue = estimate.drainPiping.pvcPipes.reduce((s, p) => s + (p.qty * p.ur), 0);
  materialData.push(["Subtotal - PVC pipes", "", "", "", formulaCell(`=SUM(E${dpStart}:E${dpEnd})`, dpSumValue)]);
  materialData.push([]);

  materialData.push(["Accessories"]);
  const dpaStart = materialData.length + 1;
  (estimate.drainPiping.accessories || []).forEach((acc) => {
    const currR = materialData.length + 1;
    materialData.push([acc.description, currencyCell(acc.ur), qtyCell(acc.qty), acc.unit, formulaCell(`=B${currR}*C${currR}`, acc.qty * acc.ur)]);
  });
  const dpaEnd = materialData.length;
  const dpaSubtotalRow = materialData.length + 1;
  const dpaSumValue = (estimate.drainPiping.accessories || []).reduce((s: number, a: any) => s + (a.qty * a.ur), 0);
  materialData.push(["Subtotal - Accessories", "", "", "", formulaCell(dpaStart <= dpaEnd ? `=SUM(E${dpaStart}:E${dpaEnd})` : "=0", dpaSumValue)]);
  materialData.push([]);

  const matDrainPipingTotalRow = materialData.length + 1;
  materialData.push(["Total Drain Piping", "", "", "", formulaCell(`=E${dpSubtotalRow}+E${dpaSubtotalRow}`, dpSumValue + dpaSumValue)]);
  materialData.push([]);

  // Ducting
  const ductingTotalRowIndex = materialData.length + 1;
  materialData.push(["7. Ducting & Airterminals", "", "", "", "", "", "", "TR", { v: activeCosting.totalTR, t: "n", f: "='LOW SIDE DSU'!H5" }]);
  materialData.push(["a. GSS Ducting"]);
  materialData.push(["Desc.", "Qty (Sq.m)", "No. Of Sheet", "Wt/Sheet", "Total Wt", "Rate/Kg", "Total", "Rate/SqMtr"]);

  const r54 = materialData.length + 1;
  const gss24 = estimate.ducting.gssDucting.find((d: any) => d.gauge.includes("24")) || { qtySqMtr: 198, wtPerSheet: 14, ratePerKg: 95 };
  const qty24 = activeCosting.totalTR * 4.5;
  const sheets24 = qty24 / 3; const wt24 = sheets24 * gss24.wtPerSheet; const total24 = wt24 * gss24.ratePerKg;
  materialData.push(["24 SWG", formulaCell(`=4.5*I${ductingTotalRowIndex}`, qty24, "#,##0"), formulaCell(`=B${r54}/3`, sheets24, "#,##0.0"), numCell(14, "0"), formulaCell(`=C${r54}*D${r54}`, wt24, "#,##0"), currencyCell(gss24.ratePerKg), formulaCell(`=E${r54}*F${r54}`, total24), formulaCell(`=G${r54}/B${r54}`, qty24 > 0 ? total24 / qty24 : 0)]);

  const r55 = materialData.length + 1;
  const gss22 = estimate.ducting.gssDucting.find((d: any) => d.gauge.includes("22")) || { qtySqMtr: 44, wtPerSheet: 18, ratePerKg: 93 };
  const qty22 = activeCosting.totalTR * 1.0;
  const sheets22 = qty22 / 3; const wt22 = sheets22 * gss22.wtPerSheet; const total22 = wt22 * gss22.ratePerKg;
  materialData.push(["22 SWG", formulaCell(`=1*I${ductingTotalRowIndex}`, qty22, "#,##0"), formulaCell(`=B${r55}/3`, sheets22, "#,##0.0"), numCell(18, "0"), formulaCell(`=C${r55}*D${r55}`, wt22, "#,##0"), currencyCell(gss22.ratePerKg), formulaCell(`=E${r55}*F${r55}`, total22), formulaCell(`=G${r55}/B${r55}`, qty22 > 0 ? total22 / qty22 : 0)]);

  const r56 = materialData.length + 1;
  materialData.push(["Total GSS Ducting", formulaCell(`=SUM(B${r54}:B${r55})`, qty24 + qty22, "#,##0"), formulaCell(`=SUM(C${r54}:C${r55})`, sheets24 + sheets22, "#,##0.0"), "", formulaCell(`=SUM(E${r54}:E${r55})`, wt24 + wt22, "#,##0"), "", formulaCell(`=SUM(G${r54}:G${r55})`, total24 + total22), formulaCell(`=G${r56}/B${r56}`, (total24 + total22) / (qty24 + qty22))]);
  materialData.push([]);

  materialData.push(["b. Thermal Insulation"]);
  materialData.push(["Description", "UR", "Qty", "Unit", "Total"]);
  const r61 = materialData.length + 1;
  const thermalTotal = qty24 * estimate.ducting.thermalInsulationUR;
  materialData.push(["Thermal Insulation for GSS Ducting", currencyCell(estimate.ducting.thermalInsulationUR), formulaCell(`=B${r54}`, qty24, "#,##0"), "Sq. Mtr", formulaCell(`=B${r61}*C${r61}`, thermalTotal)]);
  const r62 = materialData.length + 1;
  materialData.push(["Total", "", "", "", formulaCell(`=E${r61}`, thermalTotal)]);
  materialData.push([]);

  materialData.push(["c. Accoustic Insulation"]);
  materialData.push(["Description", "UR", "Qty", "Unit", "Total"]);
  const r67 = materialData.length + 1;
  const acousticTotal = qty22 * estimate.ducting.acousticInsulationUR;
  materialData.push(["Acoustic Insulation for GSS Ducting", currencyCell(estimate.ducting.acousticInsulationUR), formulaCell(`=B${r55}`, qty22, "#,##0"), "Sq. Mtr", formulaCell(`=B${r67}*C${r67}`, acousticTotal)]);
  const r68 = materialData.length + 1;
  materialData.push(["Total", "", "", "", formulaCell(`=E${r67}`, acousticTotal)]);
  materialData.push([]);

  materialData.push(["d. MISC"]);
  materialData.push(["Description", "UR", "Qty", "Unit", "Total"]);
  const dmStart = materialData.length + 1;
  let miscDuctTotal = 0;
  (estimate.ducting.accessories || []).forEach((acc: any) => {
    const currR = materialData.length + 1;
    miscDuctTotal += acc.qty * acc.ur;
    materialData.push([acc.description, currencyCell(acc.ur), qtyCell(acc.qty), acc.unit, formulaCell(`=B${currR}*C${currR}`, acc.qty * acc.ur)]);
  });
  const dmEnd = materialData.length;
  const dmSubtotalRow = materialData.length + 1;
  materialData.push(["Total", "", "", "", formulaCell(dmStart <= dmEnd ? `=SUM(E${dmStart}:E${dmEnd})` : "=0", miscDuctTotal)]);
  materialData.push([]);

  const matDuctingTotalRow = materialData.length + 1;
  const grandDuctTotal = (total24 + total22) + thermalTotal + acousticTotal + miscDuctTotal;
  materialData.push(["Total for ducting, insulation & canvas", "", "", "", formulaCell(`=G${r56}+E${r62}+E${r68}+E${dmSubtotalRow}`, grandDuctTotal)]);
  materialData.push([]);

  // Air Terminals
  materialData.push(["8. Air Terminals"]);
  materialData.push(["Grill Size/Desc", "Qty", "Area (Sq.ft)", "Rate/Sq. ft", "Total"]);
  const atStart = materialData.length + 1;
  let airTerminalSubtotal = 0;
  (estimate.airTerminals?.items || []).forEach((item: any) => {
    const currR = materialData.length + 1;
    const isArea = item.description.toLowerCase().includes("grill") || item.description.toLowerCase().includes("damper");
    const areaVal = isArea ? item.qty * 10.764 : 0;
    const rowTotal = isArea ? areaVal * item.ur : item.qty * item.ur;
    airTerminalSubtotal += rowTotal;
    materialData.push([item.description, qtyCell(item.qty), isArea ? formulaCell(`=B${currR}*10.764`, areaVal, "#,##0.0") : "", currencyCell(item.ur), isArea ? formulaCell(`=C${currR}*D${currR}`, rowTotal) : formulaCell(`=B${currR}*D${currR}`, rowTotal)]);
  });
  const atEnd = materialData.length;
  const r88 = materialData.length + 1;
  materialData.push(["Total", "", "", "", formulaCell(`=SUM(E${atStart}:E${atEnd})`, airTerminalSubtotal)]);
  const r89 = materialData.length + 1;
  const atFreightRate = estimate.airTerminals?.freightRate !== undefined ? estimate.airTerminals.freightRate : 0.10;
  const airTerminalFreight = airTerminalSubtotal * atFreightRate;
  materialData.push(["Freight", percentCell(atFreightRate), "", "", formulaCell(`=E${r88}*B${r89}`, airTerminalFreight)]);
  const matAirTerminalsTotalRow = materialData.length + 1;
  materialData.push(["Total Air Terminals", "", "", "", formulaCell(`=E${r88}+E${r89}`, airTerminalSubtotal + airTerminalFreight)]);
  materialData.push([]);

  // Eyeball Diffuser
  materialData.push(["9. Eye ball Diffuser"]);
  materialData.push(["Grill Size/Desc", "Qty", "Unit", "Rate", "Total"]);
  const eyeStart = materialData.length + 1;
  let eyeballSubtotal = 0;
  (estimate.eyeballDiffuser?.items || []).forEach((item: any) => {
    const currR = materialData.length + 1;
    const rowTotal = item.qty * item.ur;
    eyeballSubtotal += rowTotal;
    materialData.push([item.description, qtyCell(item.qty), item.unit, currencyCell(item.ur), formulaCell(`=B${currR}*D${currR}`, rowTotal)]);
  });
  const eyeEnd = materialData.length;
  const r95 = materialData.length + 1;
  materialData.push(["Total", "", "", "", formulaCell(`=SUM(E${eyeStart}:E${eyeEnd})`, eyeballSubtotal)]);
  const r96 = materialData.length + 1;
  const eyeFreightRate = estimate.eyeballDiffuser?.freightRate !== undefined ? estimate.eyeballDiffuser.freightRate : 0.10;
  const eyeballFreight = eyeballSubtotal * eyeFreightRate;
  materialData.push(["Freight", percentCell(eyeFreightRate), "", "", formulaCell(`=E${r95}*B${r96}`, eyeballFreight)]);
  const matEyeballTotalRow = materialData.length + 1;
  materialData.push(["Total Eyeball Diffuser", "", "", "", formulaCell(`=E${r95}+E${r96}`, eyeballSubtotal + eyeballFreight)]);
  materialData.push([]);

  const matOduStandTotalRow  = addSection("10. Odu Stand",      estimate.oduStand?.items    || [], "Total Odu Stand");
  const matPvcCasingTotalRow = addSection("11. PVC Casing Cap", estimate.pvcCasingCap?.items || [], "Total PVC Casing Cap");

  addRevisionFooter(materialData, activeCosting);

  // ── HIGH SIDE PRE-CALCS ───────────────────────────────────
  const eqLen = activeCosting.highSide.equipment.length;
  const hsTotRow      = 11 + eqLen;
  const hsSubTotalRow = hsTotRow + 7;
  const hsOverheadRow = hsSubTotalRow + 1;
  const hsGrandTotalRow = hsOverheadRow + 1;
  const hsProfitRow   = hsGrandTotalRow + 1;
  const hsProjValRow  = hsProfitRow + 1;
  const hsGstRow      = hsProjValRow + 1;
  const hsFinalRow    = hsGstRow + 1;

  const hsSubtotal = activeCosting.highSide.equipment.reduce((sum, eq) => sum + (eq.qty * eq.unitRate), 0);
  const hsDesign   = hsSubtotal * activeCosting.highSide.designPercent;
  const hsWarranty = hsSubtotal * activeCosting.highSide.warrantyPercent;
  const hsTrans    = hsSubtotal * activeCosting.highSide.transportationPercent;
  const hsUnload   = hsSubtotal * activeCosting.highSide.unloadingPercent;
  const hsBank     = hsSubtotal * activeCosting.highSide.bankChargesPercent;
  const hsComm     = hsSubtotal * activeCosting.highSide.commissionPercent;
  const hsSubTotalOverhead = hsSubtotal + hsDesign + hsWarranty + hsTrans + hsUnload + hsBank + hsComm;
  const hsOverhead    = hsSubTotalOverhead * activeCosting.highSide.overheadPercent;
  const hsGrandTotal  = hsSubTotalOverhead + hsOverhead;

  const hsAcctDesign   = Math.round(hsSubtotal * activeCosting.highSide.designPercent);
  const hsAcctWarranty = Math.round(hsSubtotal * activeCosting.highSide.warrantyPercent);
  const hsAcctTrans    = Math.round(hsSubtotal * activeCosting.highSide.transportationPercent);
  const hsAcctBank     = Math.round(hsSubtotal * activeCosting.highSide.bankChargesPercent);
  const hsAcctSubtotal = hsSubtotal + hsAcctDesign + hsAcctWarranty + hsAcctTrans + hsAcctBank;
  const hsAcctOverhead = Math.round(hsAcctSubtotal * activeCosting.highSide.overheadPercent);
  const hsAcctGrandTotal = hsAcctSubtotal + hsAcctOverhead;
  const hsAcctProfit   = Math.round((hsAcctGrandTotal / (1 - activeCosting.highSide.profitPercent)) - hsAcctGrandTotal);
  const hsAcctProjectValue = hsAcctGrandTotal + hsAcctProfit;
  const hsAcctGst      = Math.round(hsAcctProjectValue * activeCosting.highSide.gstPercent);
  const hsAcctFinalValue = hsAcctProjectValue + hsAcctGst;

  const hsAcctStartRow   = hsFinalRow + 3;
  const hsAcctEqStartRow = hsAcctStartRow + 2;
  const hsAcctTotRow     = hsAcctEqStartRow + eqLen;
  const hsAcctSubTotalRow    = hsAcctTotRow + 7;
  const hsAcctOverheadRow    = hsAcctSubTotalRow + 1;
  const hsAcctGrandTotalRow  = hsAcctOverheadRow + 1;
  const hsAcctProfitRow      = hsAcctGrandTotalRow + 1;
  const hsAcctProjValRow     = hsAcctProfitRow + 1;
  const hsAcctGstRow         = hsAcctProjValRow + 1;
  const hsAcctFinalRow       = hsAcctGstRow + 1;

  // ── LOW SIDE PRE-CALCS ────────────────────────────────────
  const lsLen = activeCosting.lowSide.items.length;
  const lsTotRow      = 11 + lsLen;
  const lsSubTotalRow = lsTotRow + 8;
  const lsOverheadRow = lsSubTotalRow + 1;
  const lsGrandTotalRow2 = lsOverheadRow + 1;
  const lsProfitRow   = lsGrandTotalRow2 + 1;
  const lsProjValRow  = lsProfitRow + 1;
  const lsGstRow      = lsProjValRow + 1;
  const lsFinalRow    = lsGstRow + 1;

  const totalMaterial = activeCosting.lowSide.items.reduce((sum, item) => sum + item.materialRate, 0);
  const totalLabour   = activeCosting.lowSide.items.reduce((sum, item) => sum + item.labourRate, 0);
  const baseTotalCost = totalMaterial + totalLabour;
  const lsDesign      = baseTotalCost * activeCosting.lowSide.designPercent;
  const lsWarranty    = baseTotalCost * activeCosting.lowSide.warrantyPercent;
  const lsContingency = baseTotalCost * activeCosting.lowSide.contingencyPercent;
  const lsTrans       = baseTotalCost * activeCosting.lowSide.transportationPercent;
  const lsAccom       = activeCosting.lowSide.accommodationValue;
  const lsUnload      = baseTotalCost * activeCosting.lowSide.unloadingPercent;
  const lsBank        = baseTotalCost * activeCosting.lowSide.bankChargesPercent;
  const lsSubTotal    = baseTotalCost + lsDesign + lsWarranty + lsContingency + lsTrans + lsAccom + lsUnload + lsBank;
  const lsOverhead    = lsSubTotal * activeCosting.lowSide.overheadPercent;
  const lsGrandTotal  = lsSubTotal + lsOverhead;

  const lsAcctDesign      = Math.round(baseTotalCost * activeCosting.lowSide.designPercent);
  const lsAcctWarranty    = Math.round(baseTotalCost * activeCosting.lowSide.warrantyPercent);
  const lsAcctContingency = Math.round(baseTotalCost * activeCosting.lowSide.contingencyPercent);
  const lsAcctTrans       = Math.round(baseTotalCost * activeCosting.lowSide.transportationPercent);
  const lsAcctBank        = Math.round(baseTotalCost * activeCosting.lowSide.bankChargesPercent);
  const lsAcctSubtotal    = baseTotalCost + lsAcctDesign + lsAcctWarranty + lsAcctContingency + lsAcctTrans + lsAcctBank;
  const lsAcctOverhead    = Math.round(lsAcctSubtotal * activeCosting.lowSide.overheadPercent);
  const lsAcctGrandTotal  = lsAcctSubtotal + lsAcctOverhead;
  const lsAcctProfit      = Math.round((lsAcctGrandTotal / (1 - activeCosting.lowSide.profitPercent)) - lsAcctGrandTotal);
  const lsAcctProjectValue = lsAcctGrandTotal + lsAcctProfit;
  const lsAcctGst         = Math.round(lsAcctProjectValue * activeCosting.lowSide.gstPercent);
  const lsAcctFinalValue  = lsAcctProjectValue + lsAcctGst;
  const lsDuctStartRow    = lsFinalRow + 5;

  const lowSideMapping = [
    { sr: 1,  desc: "Installation of AC Unit",                                            matF: `='MATERIAL SUMMARY FOR DSU'!E${matInstTotalRow}`,       labF: "=H$5*1000",  qName: "Installation",         std: 1600,                           u: "per TR" },
    { sr: 2,  desc: "Testing & Commissioning of AC Unit",                                 matF: `='MATERIAL SUMMARY FOR DSU'!E${matTestTotalRow}`,       labF: "=0",         qName: "Testing & Commissioning",std: 0,                              u: "" },
    { sr: 3,  desc: "Ref. Piping",                                                        matF: `='MATERIAL SUMMARY FOR DSU'!E${matRefPipingTotalRow}`,  labF: "=C{R}*250",  qName: "Ref piping",            std: 2100,                           u: "per RMT" },
    { sr: 4,  desc: "Control Cabling",                                                    matF: `='MATERIAL SUMMARY FOR DSU'!E${matCtrlCablingTotalRow}`,labF: "=C{R}*50",   qName: "Control Cabling",        std: 350,                            u: "per RMT" },
    { sr: 5,  desc: "Power Cabling",                                                      matF: `='MATERIAL SUMMARY FOR DSU'!E${matPwrCablingTotalRow}`, labF: "=C{R}*100",  qName: "Power Cabling",          std: 350,                            u: "per RMT" },
    { sr: 6,  desc: "Drain Piping",                                                       matF: `='MATERIAL SUMMARY FOR DSU'!E${matDrainPipingTotalRow}`,labF: "=C{R}*50",   qName: "Drain Piping",           std: 250,                            u: "per RMT" },
    { sr: 7,  desc: "R32 Gas charging",                                                   matF: "=(950/1.18)*C{R}",                                      labF: "=0",         qName: "Ref. gas top up",        std: 1300,                           u: "per kg" },
    { sr: 8,  desc: "GSS Ducting with thermal,Accoustic insulation & canvas connection",  matF: `='MATERIAL SUMMARY FOR DSU'!E${matDuctingTotalRow}`,    labF: "=C{R}*500",  qName: "Ducting work",           std: `=J${lsDuctStartRow + 6}`,      u: "per sq.mtr" },
    { sr: 9,  desc: "Air terminals",                                                      matF: `='MATERIAL SUMMARY FOR DSU'!E${matAirTerminalsTotalRow}`,labF: "=1500*C{R}", qName: "Air terminals",          std: 10000,                          u: "per sq.mtr" },
    { sr: 10, desc: "ODU Stand",                                                          matF: `='MATERIAL SUMMARY FOR DSU'!E${matOduStandTotalRow}`,   labF: "=0",         qName: "ODU Stand",              std: 450,                            u: "per Nos" },
    { sr: 11, desc: "PVC Casing Cap",                                                     matF: `='MATERIAL SUMMARY FOR DSU'!E${matPvcCasingTotalRow}`,  labF: "=0",         qName: "PVC Casing Cap",         std: 800,                            u: "per RMT" }
  ];

  // ── COST SUMMARY ──────────────────────────────────────────
  const summaryData: any[] = [];
  summaryData.push(...createCompanyHeader("COST SUMMARY (EXECUTIVE SUMMARY)", activeCosting));
  summaryData.push(["Sr. No", "Description", "Project Value (Excl. Tax)", "Total Expense (Excl. tax)", "Over Head", "Over Head %", "Profit", "Profit %", "Total Price (Incl. tax)", "Price Per TR"]);

  summaryData.push([1, "HIGH SIDE WORK",
    formulaCell(`='HIGH SIDE'!G${hsProjValRow}`,    activeCosting.summary.highSideProjectValueExclTax),
    formulaCell(`='HIGH SIDE'!E${hsGrandTotalRow}`, activeCosting.summary.highSideTotalExpenseExclTax),
    formulaCell(`='HIGH SIDE'!E${hsOverheadRow}`,   activeCosting.summary.highSideOverhead),
    formulaCell(`=E10/D10`,                          activeCosting.summary.highSideOverheadPercent / 100, "0.0%"),
    formulaCell(`='HIGH SIDE'!E${hsProfitRow}`,     activeCosting.summary.highSideProfit),
    formulaCell(`=G10/C10`,                          activeCosting.summary.highSideProfitPercent / 100, "0.0%"),
    formulaCell(`='HIGH SIDE'!G${hsFinalRow}`,       activeCosting.summary.highSideTotalPriceInclTax),
    formulaCell(`=I10/H$5`,                          activeCosting.summary.highSidePricePerTR)
  ]);
  summaryData.push([2, "LOW SIDE WORK",
    formulaCell(`='LOW SIDE DSU'!I${lsProjValRow}`,     activeCosting.summary.lowSideProjectValueExclTax),
    formulaCell(`='LOW SIDE DSU'!M${lsGrandTotalRow2}`, activeCosting.summary.lowSideTotalExpenseExclTax),
    formulaCell(`='LOW SIDE DSU'!M${lsOverheadRow}`,    activeCosting.summary.lowSideOverhead),
    formulaCell(`=E11/D11`,                              activeCosting.summary.lowSideOverheadPercent / 100, "0.0%"),
    formulaCell(`='LOW SIDE DSU'!M${lsProfitRow}`,      activeCosting.summary.lowSideProfit),
    formulaCell(`=G11/C11`,                              activeCosting.summary.lowSideProfitPercent / 100, "0.0%"),
    formulaCell(`='LOW SIDE DSU'!I${lsFinalRow}`,        activeCosting.summary.lowSideTotalPriceInclTax),
    formulaCell(`=I11/H$5`,                              activeCosting.summary.lowSidePricePerTR)
  ]);
  summaryData.push(["Total", "",
    formulaCell(`=SUM(C10:C11)`, activeCosting.summary.totalProjectValueExclTax),
    formulaCell(`=SUM(D10:D11)`, activeCosting.summary.totalExpenseExclTax),
    formulaCell(`=SUM(E10:E11)`, activeCosting.summary.totalOverhead),
    formulaCell(`=E12/D12`,      activeCosting.summary.totalOverheadPercent / 100, "0.0%"),
    formulaCell(`=SUM(G10:G11)`, activeCosting.summary.totalProfit),
    formulaCell(`=G12/C12`,      activeCosting.summary.totalProfitPercent / 100, "0.0%"),
    formulaCell(`=SUM(I10:I11)`, activeCosting.summary.totalPriceInclTax),
    formulaCell(`=I12/H$5`,      activeCosting.summary.totalPricePerTR)
  ]);
  summaryData.push([]);
  summaryData.push(["PROJECT FINANCIAL SUMMARY"]);
  summaryData.push(["Total Material Cost",      formulaCell(`='HIGH SIDE'!C${hsAcctTotRow}+'LOW SIDE DSU'!J${lsTotRow}`, 0)]);
  summaryData.push(["Total Labour Cost",         formulaCell(`='HIGH SIDE'!D${hsAcctTotRow}+'LOW SIDE DSU'!K${lsTotRow}`, 0)]);
  summaryData.push(["Total Miscellaneous Cost",  formulaCell(`='HIGH SIDE'!E${hsAcctTotRow}+'LOW SIDE DSU'!L${lsTotRow}`, 0)]);
  summaryData.push(["Total Expense (Excl. Tax)", formulaCell(`=D12`, 0)]);
  summaryData.push(["Total Overhead Amount",     formulaCell(`=E12`, 0)]);
  summaryData.push(["Total Profit Amount",       formulaCell(`=G12`, 0)]);
  summaryData.push(["Total GST Amount",          formulaCell(`=I12-C12`, 0)]);
  summaryData.push(["Final Project Value",       formulaCell(`=I12`, 0)]);
  addRevisionFooter(summaryData, activeCosting);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!merges"] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
    { s: { r: 13, c: 0 }, e: { r: 13, c: 9 } }
  ];
  applyWorksheetStyles(wsSummary, "summary");
  autoFitColumns(wsSummary, [1], [6, 24, 16, 16, 16, 12, 16, 12, 16, 16]);
  XLSX.utils.book_append_sheet(wb, wsSummary, "COST SUMMARY");

  // ── HIGH SIDE ─────────────────────────────────────────────
  const highSideData: any[] = [];
  highSideData.push(...createCompanyHeader("HIGH SIDE COST SUMMARY (ENGINEERING VS ACTUALS)", activeCosting));
  highSideData.push(["HIGH SIDE EQUIPMENT COSTING & PRICING (ENGINEERING DEPT)"]);
  highSideData.push(["Sr. No", "Equipment Description", "Qty", "Unit Rate", "Total Rate", "CPF Markup %", "CPF (Client Price)"]);

  activeCosting.highSide.equipment.forEach((eq, i) => {
    const R = 11 + i;
    highSideData.push([i + 1, eq.description, qtyCell(eq.qty), currencyCell(eq.unitRate), formulaCell(`=C${R}*D${R}`, eq.qty * eq.unitRate), percentCell(activeCosting.highSide.cpfMarkupPercent / 100), formulaCell(`=E${R}*(1+F${R})`, eq.cpf ?? (eq.qty * eq.unitRate * (1 + activeCosting.highSide.cpfMarkupPercent / 100)))]);
  });
  highSideData.push(["Total", "", "", "", formulaCell(`=SUM(E11:E${hsTotRow - 1})`, hsSubtotal), "", formulaCell(`=SUM(G11:G${hsTotRow - 1})`, activeCosting.summary.highSideProjectValueExclTax)]);

  hsMarkups.forEach((m, idx) => {
    const R = hsTotRow + 1 + idx;
    const pct = (activeCosting.highSide as any)[m.key];
    const markupVal = Math.round(hsSubtotal * pct);
    highSideData.push([idx + 2, m.name, percentCell(pct), "", formulaCell(`=E${hsTotRow}*C${R}`, markupVal)]);
  });

  highSideData.push(["", "Sub Total",          "", "", formulaCell(`=SUM(E${hsTotRow}:E${hsSubTotalRow - 1})`, hsSubTotalOverhead)]);
  highSideData.push([8, "Over Head",            percentCell(activeCosting.highSide.overheadPercent), "", formulaCell(`=E${hsSubTotalRow}*C${hsOverheadRow}`, hsOverhead)]);
  highSideData.push(["", "Grand Total",         "", "", formulaCell(`=SUM(E${hsSubTotalRow}:E${hsOverheadRow})`, hsGrandTotal)]);
  highSideData.push([9, "Profit (mark up)",     percentCell(activeCosting.highSide.profitPercent), "", formulaCell(`=(E${hsGrandTotalRow}/(1-C${hsProfitRow}))-E${hsGrandTotalRow}`, activeCosting.summary.highSideProfit)]);
  highSideData.push(["", "Project Value",       "", "", formulaCell(`=SUM(E${hsGrandTotalRow}:E${hsProfitRow})`, activeCosting.summary.highSideProjectValueExclTax), "", formulaCell(`=G${hsTotRow}`, activeCosting.summary.highSideProjectValueExclTax)]);
  highSideData.push(["", "Gst",                 percentCell(activeCosting.highSide.gstPercent), "", formulaCell(`=E${hsProjValRow}*C${hsGstRow}`, activeCosting.summary.highSideProjectValueExclTax * activeCosting.highSide.gstPercent), "", formulaCell(`=G${hsProjValRow}*C${hsGstRow}`, activeCosting.summary.highSideProjectValueExclTax * activeCosting.highSide.gstPercent)]);
  highSideData.push(["", "Final Project Value", "", "", formulaCell(`=SUM(E${hsProjValRow}:E${hsGstRow})`, activeCosting.summary.highSideTotalPriceInclTax), "", formulaCell(`=SUM(G${hsProjValRow}:G${hsGstRow})`, activeCosting.summary.highSideTotalPriceInclTax)]);
  highSideData.push([], []);

  // Accounts section
  highSideData.push(["HIGH SIDE ACTUAL EXPENSES (ACCOUNTS DEPT)"]);
  highSideData.push(["Sr. No", "Equipment Description", "Material Cost", "Labour Cost", "MISC Cost", "Total Actual Cost"]);
  activeCosting.highSide.equipment.forEach((eq, i) => {
    const R_acct = hsAcctEqStartRow + i;
    highSideData.push([i + 1, eq.description, formulaCell(`=E${11 + i}`, eq.qty * eq.unitRate), numCell(0, "₹#,##0"), numCell(0, "₹#,##0"), formulaCell(`=SUM(C${R_acct}:E${R_acct})`, eq.qty * eq.unitRate)]);
  });
  highSideData.push(["Total", "", formulaCell(`=SUM(C${hsAcctEqStartRow}:C${hsAcctTotRow - 1})`, hsSubtotal), formulaCell(`=SUM(D${hsAcctEqStartRow}:D${hsAcctTotRow - 1})`, 0), formulaCell(`=SUM(E${hsAcctEqStartRow}:E${hsAcctTotRow - 1})`, 0), formulaCell(`=SUM(F${hsAcctEqStartRow}:F${hsAcctTotRow - 1})`, hsSubtotal)]);

  hsMarkups.forEach((m, idx) => {
    const R = hsAcctTotRow + 1 + idx;
    const pct = (activeCosting.highSide as any)[m.key];
    const acctVal = Math.round(hsSubtotal * pct);
    highSideData.push([idx + 2, m.name, percentCell(pct), "", formulaCell(`=F${hsAcctTotRow}*C${R}`, acctVal)]);
  });
  highSideData.push(["", "Sub Total",        "", "", formulaCell(`=F${hsAcctTotRow}+SUM(E${hsAcctTotRow + 1}:E${hsAcctSubTotalRow - 1})`, hsAcctSubtotal)]);
  highSideData.push([8, "Over Head",          percentCell(activeCosting.highSide.overheadPercent), "", formulaCell(`=E${hsAcctSubTotalRow}*C${hsAcctOverheadRow}`, hsAcctOverhead)]);
  highSideData.push(["", "Grand Total",       "", "", formulaCell(`=SUM(E${hsAcctSubTotalRow}:E${hsAcctOverheadRow})`, hsAcctGrandTotal)]);
  highSideData.push([9, "Profit (mark up)",   percentCell(activeCosting.highSide.profitPercent), "", formulaCell(`=(E${hsAcctGrandTotalRow}/(1-C${hsAcctProfitRow}))-E${hsAcctGrandTotalRow}`, hsAcctProfit)]);
  highSideData.push(["", "Invoiced Value",    "", "", formulaCell(`=SUM(E${hsAcctGrandTotalRow}:E${hsAcctProfitRow})`, hsAcctProjectValue)]);
  highSideData.push(["", "Gst",               percentCell(activeCosting.highSide.gstPercent), "", formulaCell(`=E${hsAcctProjValRow}*C${hsAcctGstRow}`, hsAcctGst)]);
  highSideData.push(["", "Final Value with Tax","","",formulaCell(`=SUM(E${hsAcctProjValRow}:E${hsAcctGstRow})`, hsAcctFinalValue)]);

  addRevisionFooter(highSideData, activeCosting);
  const wsHigh = XLSX.utils.aoa_to_sheet(highSideData);
  wsHigh["!merges"] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 6 } },
    { s: { r: hsAcctStartRow - 1, c: 0 }, e: { r: hsAcctStartRow - 1, c: 5 } }
  ];
  applyWorksheetStyles(wsHigh, "highside", eqLen, 0, hsAcctStartRow);
  autoFitColumns(wsHigh, [1], [6, 28, 12, 16, 16, 12, 16]);
  XLSX.utils.book_append_sheet(wb, wsHigh, "HIGH SIDE");

  // ── LOW SIDE DSU ──────────────────────────────────────────
  const lowSideData: any[] = [];
  lowSideData.push(...createCompanyHeader("LOW SIDE COST SUMMARY & CALCULATIONS", activeCosting));
  lowSideData.push(["", "", "", "", "", "LOW SIDE (ROYAL ENGINEERS)", "", "", "Q. Rate", "ACCOUNTS ACTUAL EXPENSE", "", "", "Total"]);
  lowSideData.push(["Sr. No", "Description", "Qty", "Unit", "Royal Engineers", "Material Rate", "Labour Rate", "Total", "", "Material", "Labour", "MISC", "Total"]);

  lowSideData.push(...activeCosting.lowSide.items.map((item, i) => {
    const R = 11 + i;
    const mapObj = lowSideMapping[i] || { sr: item.srNo, desc: item.description, matF: "", labF: "", qName: "", std: item.stdRate, u: item.rateUnit };
    const matFormula = mapObj.matF ? (mapObj.matF as string).replace(/{R}/g, String(R)) : "";
    return [
      item.srNo, item.description, qtyCell(item.qty), item.unit, numCell(0, "₹#,##0"),
      matFormula ? formulaCell(matFormula, item.materialRate) : currencyCell(item.materialRate),
      currencyCell(item.labourRate),
      formulaCell(`=F${R}+G${R}`, item.materialRate + item.labourRate),
      currencyCell(Math.round(item.qRate || 0)),
      formulaCell(`=F${R}`, item.materialRate),
      formulaCell(`=G${R}`, item.labourRate),
      numCell(0, "₹#,##0"),
      formulaCell(`=SUM(J${R}:L${R})`, item.materialRate + item.labourRate)
    ];
  }));

  // Total row
  lowSideData.push(["Total", "", "", "",
    formulaCell(`=SUM(E11:E${lsTotRow - 1})`, 0),
    formulaCell(`=SUM(F11:F${lsTotRow - 1})`, totalMaterial),
    formulaCell(`=SUM(G11:G${lsTotRow - 1})`, totalLabour),
    formulaCell(`=SUM(H11:H${lsTotRow - 1})`, baseTotalCost),
    formulaCell(`=SUM(I11:I${lsTotRow - 1})`, activeCosting.summary.lowSideProjectValueExclTax),
    formulaCell(`=SUM(J11:J${lsTotRow - 1})`, totalMaterial),
    formulaCell(`=SUM(K11:K${lsTotRow - 1})`, totalLabour),
    formulaCell(`=SUM(L11:L${lsTotRow - 1})`, 0),
    formulaCell(`=SUM(M11:M${lsTotRow - 1})`, baseTotalCost)
  ]);

  // Markup rows
  lsMarkups.forEach((m, idx) => {
    const R = lsTotRow + 1 + idx;
    const isPercent = m.val === undefined;
    const valOrPct  = isPercent ? (activeCosting.lowSide as any)[m.key!] : m.val;
    const markupVal = isPercent ? Math.round(baseTotalCost * valOrPct) : valOrPct;
    lowSideData.push([
      idx + 2, m.name,
      isPercent ? percentCell(valOrPct) : currencyCell(valOrPct),
      "", "", "", "",
      formulaCell(isPercent ? `=H${lsTotRow}*C${R}` : `=C${R}`, markupVal),
      "", "", "", "",
      formulaCell(isPercent ? `=M${lsTotRow}*C${R}` : `=C${R}`, markupVal)
    ]);
  });

  lowSideData.push(["", "Sub Total",    "", "", "", "", "", formulaCell(`=H${lsTotRow}+SUM(H${lsTotRow + 1}:H${lsSubTotalRow - 1})`, lsSubTotal), "", "", "", "", formulaCell(`=M${lsTotRow}+SUM(M${lsTotRow + 1}:M${lsSubTotalRow - 1})`, lsSubTotal)]);
  lowSideData.push([9, "Over Head",     percentCell(activeCosting.lowSide.overheadPercent), "", "", "", "", formulaCell(`=H${lsSubTotalRow}*C${lsOverheadRow}`, lsOverhead), "", "", "", "", formulaCell(`=M${lsSubTotalRow}*C${lsOverheadRow}`, lsAcctOverhead)]);
  lowSideData.push(["", "Grand Total",  "", "", "", "", "", formulaCell(`=SUM(H${lsSubTotalRow}:H${lsOverheadRow})`, lsGrandTotal), "", "", "", "", formulaCell(`=SUM(M${lsSubTotalRow}:M${lsOverheadRow})`, lsAcctGrandTotal)]);
  lowSideData.push([10, "Profit (mark up)", percentCell(activeCosting.lowSide.profitPercent), "", "", "", "", formulaCell(`=(H${lsGrandTotalRow2}/(1-C${lsProfitRow}))-H${lsGrandTotalRow2}`, activeCosting.summary.lowSideProfit), "", "", "", "", formulaCell(`=(M${lsGrandTotalRow2}/(1-C${lsProfitRow}))-M${lsGrandTotalRow2}`, activeCosting.summary.lowSideProfit)]);
  lowSideData.push(["", "Project Value", "", "", "", "", "", formulaCell(`=SUM(H${lsGrandTotalRow2}:H${lsProfitRow})`, lsGrandTotal + activeCosting.summary.lowSideProfit), formulaCell(`=I${lsTotRow}`, activeCosting.summary.lowSideProjectValueExclTax), "", "", "", formulaCell(`=SUM(M${lsGrandTotalRow2}:M${lsProfitRow})`, lsAcctProjectValue)]);
  lowSideData.push(["", "Gst",           percentCell(activeCosting.lowSide.gstPercent), "", "", "", "", formulaCell(`=H${lsProjValRow}*C${lsGstRow}`, (lsGrandTotal + activeCosting.summary.lowSideProfit) * activeCosting.lowSide.gstPercent), formulaCell(`=I${lsProjValRow}*C${lsGstRow}`, activeCosting.summary.lowSideProjectValueExclTax * activeCosting.lowSide.gstPercent), "", "", "", formulaCell(`=M${lsProjValRow}*C${lsGstRow}`, lsAcctGst)]);
  lowSideData.push(["", "Final Project Value", "", "", "", "", "", formulaCell(`=SUM(H${lsProjValRow}:H${lsGstRow})`, (lsGrandTotal + activeCosting.summary.lowSideProfit) * (1 + activeCosting.lowSide.gstPercent)), formulaCell(`=I${lsProjValRow}+I${lsGstRow}`, activeCosting.summary.lowSideTotalPriceInclTax), "", "", "", formulaCell(`=SUM(M${lsProjValRow}:M${lsGstRow})`, lsAcctFinalValue)]);

  lowSideData.push([], []);
  addRevisionFooter(lowSideData, activeCosting);

  const wsLow = XLSX.utils.aoa_to_sheet(lowSideData);
  wsLow["!merges"] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 6 } }
  ];
  applyWorksheetStyles(wsLow, "lowside", eqLen, lsLen);
  autoFitColumns(wsLow, [1], [6, 28, 8, 8, 10, 14, 14, 14, 14, 14, 14, 10, 14]);
  XLSX.utils.book_append_sheet(wb, wsLow, "LOW SIDE DSU");

  // ── MATERIAL SUMMARY sheet ────────────────────────────────
  const wsMat = XLSX.utils.aoa_to_sheet(materialData);
  wsMat["!merges"] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }
  ];
  applyWorksheetStyles(wsMat, "estimates");
  autoFitColumns(wsMat, [0], [28, 14, 10, 10, 14, 10, 14, 14]);
  XLSX.utils.book_append_sheet(wb, wsMat, "MATERIAL SUMMARY FOR DSU");

  // ── Save ──────────────────────────────────────────────────
  XLSX.writeFile(wb, `Continental_Costing_${activeCosting.enquiryNo}_Rev${activeCosting.revision}.xlsx`);
}

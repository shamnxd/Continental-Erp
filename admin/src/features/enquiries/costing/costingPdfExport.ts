/**
 * costingPdfExport.ts
 * ───────────────────
 * Generates a minimal, classical black & white PDF document for costing.
 * Contains only the core tables in grayscale:
 * 1. Cost Summary & Financial Summary
 * 2. High Side Works & Markups
 * 3. Low Side DSU Works & Markups
 * 4. Materials Summary Category Table & Detailed Section Breakdowns
 *
 * Visual Guidelines:
 * - Standard Portrait A4 format
 * - Grayscale colors (no brand greens, blues, or yellows)
 * - No logo, watermark, KPI cards, QR codes, or approval badges
 * - No Rupee symbol (currency amounts are formatted as raw values with commas, e.g. 12,34,567)
 *
 * Entry point: exportCostingToPdf(costing: ICosting)
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ICosting } from "../../../interfaces/costing.interface";
import { normalizeSize } from "./CostingCalculator";

// ─── Visual Theme Grayscale Tokens ──────────────────────────────────────────
const COLOR_TEXT      = "#000000"; // Black text
const COLOR_MUTED     = "#555555"; // Charcoal/gray for secondary elements
const COLOR_BORDER    = "#CCCCCC"; // Subtle gray for table boundaries
const COLOR_HEADER_BG = "#F1F5F9"; // Light gray fill for headers
const WHITE           = "#FFFFFF";

// ─── Format Helpers ──────────────────────────────────────────────────────────
const fmt = (n: number) => {
  const val = Math.round(n || 0);
  return val.toLocaleString("en-IN");
};

const pct = (n: number) => {
  return (n * 100).toFixed(2) + "%";
};

const fmtTR = (n: number) => {
  return `${n || 0} TR`;
};

// ─── Layout Components ───────────────────────────────────────────────────────

/**
 * Draws a minimal page header with report title and document credentials
 */
const drawMinimalHeader = (doc: jsPDF, costing: ICosting, pageTitle: string) => {
  const pw = doc.internal.pageSize.getWidth();
  
  // Document Metadata Title on the left
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT);
  doc.text(pageTitle.toUpperCase(), 15, 15);
  
  // Document Reference details on the right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED);
  doc.text(
    `Enquiry Ref: ${costing.enquiryNo}  |  Rev: ${costing.revision}`,
    pw - 15,
    15,
    { align: "right" }
  );
  
  // Separation line
  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.4);
  doc.line(15, 18, pw - 15, 18);
  
  return 24; // next content y-offset
};

/**
 * Draws a minimal page footer
 */
const drawMinimalFooter = (doc: jsPDF, costing: ICosting, pageNum: number, totalPages: number) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  
  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.4);
  doc.line(15, ph - 12, pw - 15, ph - 12);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED);
  
  // Left footer details
  doc.text(
    `Continental Costing Sheet  |  Enquiry No: ${costing.enquiryNo}  |  Revision ${costing.revision}`,
    15,
    ph - 8
  );
  
  // Right footer page indexing
  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    pw - 15,
    ph - 8,
    { align: "right" }
  );
};

/**
 * Prepends a new page and sets up the minimal header
 */
const prepareNewPage = (doc: jsPDF, costing: ICosting, pageTitle: string) => {
  doc.addPage();
  return drawMinimalHeader(doc, costing, pageTitle);
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1: COST SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
const addPage1CostSummary = (doc: jsPDF, c: ICosting) => {
  const startY = drawMinimalHeader(doc, c, "Cost Summary & Details");
  const s = c.summary;
  const pw = doc.internal.pageSize.getWidth();
  
  // 1. Metadata Details Block (Simple text list with thin borders)
  const metaY = startY + 4;
  const metaH = 26;
  const metaW = pw - 30;
  
  doc.setFillColor(WHITE);
  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.4);
  doc.rect(15, metaY, metaW, metaH, "S");
  doc.line(15 + metaW / 2, metaY, 15 + metaW / 2, metaY + metaH);
  
  const textX1 = 18;
  const textX2 = 15 + metaW / 2 + 3;
  let rowY = metaY + 5;
  
  doc.setFontSize(7.5);
  
  // Left side metadata
  const leftDetails = [
    ["Project Name", c.projectName],
    ["Client Name", c.clientName],
    ["Location", c.location]
  ];
  leftDetails.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_MUTED);
    doc.text(`${label}:`, textX1, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT);
    doc.text(val || "—", textX1 + 24, rowY);
    rowY += 7;
  });
  
  // Right side metadata
  rowY = metaY + 5;
  const formattedDate = new Date(c.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  const rightDetails = [
    ["Enquiry Date", formattedDate],
    ["Capacity (TR)", fmtTR(c.totalTR)],
    ["Unit / Make", `${c.unitType || "—"} (${c.make || "—"})`]
  ];
  rightDetails.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_MUTED);
    doc.text(`${label}:`, textX2, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT);
    doc.text(val || "—", textX2 + 24, rowY);
    rowY += 7;
  });
  
  // 2. Cost Summary Table
  const tblY = metaY + metaH + 8;
  
  autoTable(doc, {
    startY: tblY,
    head: [["Classification", "Project Value (Excl. Tax)", "Estimated Expense", "Overhead Cost", "Net Profit", "Final Price (Incl. Tax)"]],
    body: [
      [
        "High Side Works",
        fmt(s.highSideProjectValueExclTax),
        fmt(s.highSideTotalExpenseExclTax),
        fmt(s.highSideOverhead),
        fmt(s.highSideProfit),
        fmt(s.highSideTotalPriceInclTax)
      ],
      [
        "Low Side Works",
        fmt(s.lowSideProjectValueExclTax),
        fmt(s.lowSideTotalExpenseExclTax),
        fmt(s.lowSideOverhead),
        fmt(s.lowSideProfit),
        fmt(s.lowSideTotalPriceInclTax)
      ],
      [
        "Grand Summary",
        fmt(s.totalProjectValueExclTax),
        fmt(s.totalExpenseExclTax),
        fmt(s.totalOverhead),
        fmt(s.totalProfit),
        fmt(s.totalPriceInclTax)
      ]
    ],
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 3,
      textColor: COLOR_TEXT,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      halign: "right"
    },
    headStyles: {
      fillColor: COLOR_HEADER_BG,
      textColor: COLOR_TEXT,
      fontStyle: "bold",
      halign: "center",
      lineColor: COLOR_BORDER,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 42 }
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === 2) {
        Object.assign(data.cell.styles, {
          fillColor: COLOR_HEADER_BG,
          fontStyle: "bold"
        });
      }
    },
    margin: { left: 15, right: 15 }
  });
  
  const finY = (doc as any).lastAutoTable.finalY + 8;
  
  // 3. Financial Summary Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT);
  doc.text("PROJECT FINANCIAL SUMMARY BREAKDOWN", 15, finY + 3);
  
  const totalGst = s.totalPriceInclTax - s.totalProjectValueExclTax;
  
  autoTable(doc, {
    startY: finY + 6,
    body: [
      ["Total Material Cost",      fmt(c.highSide.equipment.reduce((a, e) => a + e.qty * e.unitRate, 0) + c.lowSide.items.reduce((a, i) => a + i.materialRate, 0))],
      ["Total Labour Cost",         fmt(c.lowSide.items.reduce((a, i) => a + i.labourRate, 0))],
      ["Total Miscellaneous Cost",  fmt(0)],
      ["Total Expense (Excl. Tax)", fmt(s.totalExpenseExclTax)],
      ["Total Overhead Amount",     fmt(s.totalOverhead)],
      ["Total Profit Amount",       fmt(s.totalProfit)],
      ["Total GST Amount",          fmt(totalGst)],
      ["Final Project Value",       fmt(s.totalPriceInclTax)]
    ],
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: COLOR_TEXT,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      halign: "right"
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 100 }
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === 7) {
        Object.assign(data.cell.styles, {
          fillColor: COLOR_HEADER_BG,
          fontStyle: "bold"
        });
      }
    },
    margin: { left: 15, right: 15 }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2: HIGH SIDE WORKS
// ─────────────────────────────────────────────────────────────────────────────
const addPage2HighSide = (doc: jsPDF, c: ICosting) => {
  const startY = prepareNewPage(doc, c, "High Side Works Cost Summary");
  const hs = c.highSide;
  
  // Section Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT);
  doc.text("HIGH SIDE EQUIPMENT COSTING & BASE RATES", 15, startY + 5);
  
  const subtotal = hs.equipment.reduce((sum, e) => sum + e.qty * e.unitRate, 0);
  const cpfTotal  = c.summary.highSideProjectValueExclTax;
  
  // Table: Equipments
  const eqBody: any[] = hs.equipment.map((eq, i) => [
    String(i + 1),
    eq.description,
    eq.qty.toString(),
    fmt(eq.unitRate),
    fmt(eq.qty * eq.unitRate),
    pct(hs.cpfMarkupPercent / 100),
    fmt(eq.cpf ?? eq.qty * eq.unitRate * (1 + hs.cpfMarkupPercent / 100))
  ]);
  eqBody.push(["Total Base Costs", "", "", "", fmt(subtotal), "", fmt(cpfTotal)]);
  
  autoTable(doc, {
    startY: startY + 9,
    head: [["Sr.", "Equipment Description", "Qty", "Unit Rate", "Base Amount", "CPF Markup %", "CPF Client Price"]],
    body: eqBody,
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2,
      textColor: COLOR_TEXT,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      halign: "right"
    },
    headStyles: {
      fillColor: COLOR_HEADER_BG,
      textColor: COLOR_TEXT,
      fontStyle: "bold",
      halign: "center",
      lineColor: COLOR_BORDER,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left",   cellWidth: 62 },
      2: { halign: "center", cellWidth: 12 },
      5: { halign: "center", cellWidth: 22 }
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === eqBody.length - 1) {
        Object.assign(data.cell.styles, {
          fillColor: COLOR_HEADER_BG,
          fontStyle: "bold"
        });
      }
    },
    margin: { left: 15, right: 15 }
  });
  
  const nextY = (doc as any).lastAutoTable.finalY + 8;
  
  // Section 2 Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT);
  doc.text("HIGH SIDE MARKUPS & INDIRECT EXPENSES", 15, nextY + 3);
  
  const design   = Math.round(subtotal * hs.designPercent);
  const warranty = Math.round(subtotal * hs.warrantyPercent);
  const trans    = Math.round(subtotal * hs.transportationPercent);
  const unload   = Math.round(subtotal * hs.unloadingPercent);
  const bank     = Math.round(subtotal * hs.bankChargesPercent);
  const comm     = Math.round(subtotal * hs.commissionPercent);
  const subTotal2 = subtotal + design + warranty + trans + unload + bank + comm;
  const overhead  = Math.round(subTotal2 * hs.overheadPercent);
  const grandTotal = subTotal2 + overhead;
  const profit    = c.summary.highSideProfit;
  const projVal   = grandTotal + profit;
  const gst       = Math.round(projVal * hs.gstPercent);
  const finalVal  = projVal + gst;
  const cpfFinal  = c.summary.highSideTotalPriceInclTax;
  
  const markupRows = [
    ["1", "Equipment Base Costs Subtotal",   "",                       fmt(subtotal)],
    ["2", "Design & Plan Markup",            pct(hs.designPercent),    fmt(design)],
    ["3", "Warranty Coverage",               pct(hs.warrantyPercent),  fmt(warranty)],
    ["4", "Transportation Expenses",          pct(hs.transportationPercent), fmt(trans)],
    ["5", "Unloading & Shifting Cost",       pct(hs.unloadingPercent), fmt(unload)],
    ["6", "Bank & Administrative Charges",   pct(hs.bankChargesPercent),fmt(bank)],
    ["7", "Commission Charge Rate",          pct(hs.commissionPercent),fmt(comm)],
    ["",  "Cumulative Base Total (Subtotal 2)", "",                   fmt(subTotal2)],
    ["8", "Overhead Costs Allowance",         pct(hs.overheadPercent),  fmt(overhead)],
    ["",  "Grand Expense Total (Actual Cost)", "",                    fmt(grandTotal)],
    ["9", "Profit Margin Markup",            pct(hs.profitPercent),    fmt(profit)],
    ["",  "Project Value (Excl. Tax)",       "",                       fmt(projVal)],
    ["",  "Goods & Services Tax (GST)",      pct(hs.gstPercent),       fmt(gst)],
    ["",  "Final Project Value (With Tax)",  "",                       fmt(finalVal)],
    ["",  "CPF Confirmed Project Value",     "",                       fmt(cpfTotal)],
    ["",  "CPF Final Price (Incl. GST)",     "",                       fmt(cpfFinal)]
  ];
  
  autoTable(doc, {
    startY: nextY + 6,
    head: [["Ref.", "Indirect Cost Elements / Metrics", "Markup Rate", "Amount"]],
    body: markupRows,
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: COLOR_TEXT,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      halign: "right"
    },
    headStyles: {
      fillColor: COLOR_HEADER_BG,
      textColor: COLOR_TEXT,
      fontStyle: "bold",
      halign: "center",
      lineColor: COLOR_BORDER,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "left",   cellWidth: 80 },
      2: { halign: "center", cellWidth: 28 }
    },
    didParseCell: (data: any) => {
      if (data.section === "body") {
        const desc = String(markupRows[data.row.index]?.[1] || "");
        const isSummary =
          desc.startsWith("Cumulative") ||
          desc.startsWith("Grand Expense") ||
          desc.startsWith("Project Value") ||
          desc.startsWith("Final Project") ||
          desc.startsWith("CPF Confirmed") ||
          desc.startsWith("CPF Final");
        
        if (isSummary) {
          Object.assign(data.cell.styles, {
            fillColor: COLOR_HEADER_BG,
            fontStyle: "bold"
          });
        }
      }
    },
    margin: { left: 15, right: 15 }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3: LOW SIDE DSU WORKS
// ─────────────────────────────────────────────────────────────────────────────
const addPage3LowSide = (doc: jsPDF, c: ICosting) => {
  const startY = prepareNewPage(doc, c, "Low Side DSU Works Cost Summary");
  const ls = c.lowSide;
  
  // Section Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT);
  doc.text("LOW SIDE DSU WORKS BASE CONTRACTING CONFIGURATION", 15, startY + 5);
  
  const items = ls.items;
  const totMat  = items.reduce((s, i) => s + i.materialRate, 0);
  const totLab  = items.reduce((s, i) => s + i.labourRate, 0);
  const baseCost = totMat + totLab;
  
  // Main Table Items
  const itemBody = items.map((item) => [
    String(item.srNo),
    item.description,
    item.qty.toString(),
    item.unit,
    fmt(item.materialRate),
    fmt(item.labourRate),
    fmt(item.materialRate + item.labourRate),
    fmt(Math.round(item.qRate || 0))
  ]);
  itemBody.push([
    "Total Base Contracting Costs", "", "", "",
    fmt(totMat), fmt(totLab), fmt(baseCost),
    fmt(c.summary.lowSideProjectValueExclTax)
  ]);
  
  autoTable(doc, {
    startY: startY + 9,
    head: [["Sr.", "Contracting Description Details", "Qty", "Unit", "Material Rate", "Labour Rate", "Base Cost", "Client Price (Q.Rate)"]],
    body: itemBody,
    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 2,
      textColor: COLOR_TEXT,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      halign: "right"
    },
    headStyles: {
      fillColor: COLOR_HEADER_BG,
      textColor: COLOR_TEXT,
      fontStyle: "bold",
      halign: "center",
      lineColor: COLOR_BORDER,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { halign: "left",   cellWidth: 62 },
      2: { halign: "center", cellWidth: 10 },
      3: { halign: "center", cellWidth: 12 }
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === itemBody.length - 1) {
        Object.assign(data.cell.styles, {
          fillColor: COLOR_HEADER_BG,
          fontStyle: "bold"
        });
      }
    },
    margin: { left: 15, right: 15 }
  });
  
  const nextY = (doc as any).lastAutoTable.finalY + 8;
  
  // Low Side Markups
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT);
  doc.text("LOW SIDE INDIRECT MARKUPS & FINANCIAL SUMMARY", 15, nextY + 3);
  
  const lsDesign   = baseCost * ls.designPercent;
  const lsWarranty = baseCost * ls.warrantyPercent;
  const lsConting  = baseCost * ls.contingencyPercent;
  const lsTrans    = baseCost * ls.transportationPercent;
  const lsAccom    = ls.accommodationValue;
  const lsUnload   = baseCost * ls.unloadingPercent;
  const lsBank     = baseCost * ls.bankChargesPercent;
  const lsSubTotal = baseCost + lsDesign + lsWarranty + lsConting + lsTrans + lsAccom + lsUnload + lsBank;
  const lsOverhead = lsSubTotal * ls.overheadPercent;
  const lsGrand    = lsSubTotal + lsOverhead;
  const lsProfit   = c.summary.lowSideProfit;
  const lsProjVal  = c.summary.lowSideProjectValueExclTax;
  const lsGst      = Math.round(lsProjVal * ls.gstPercent);
  const lsFinal    = c.summary.lowSideTotalPriceInclTax;
  
  const lsMarkupRows = [
    ["1", "Contracting Base Cost Subtotal",  "",                            fmt(baseCost)],
    ["2", "Design & Contracting Fee",       pct(ls.designPercent),         fmt(lsDesign)],
    ["3", "Warranty & Compliance Allocation", pct(ls.warrantyPercent),        fmt(lsWarranty)],
    ["4", "Unforeseen Contingencies",        pct(ls.contingencyPercent),    fmt(lsConting)],
    ["5", "Transportation & Freight Cost",   pct(ls.transportationPercent), fmt(lsTrans)],
    ["6", "Accommodation & Food Allowance",   `Flat ${fmt(lsAccom)}`,        fmt(lsAccom)],
    ["7", "Site Unloading / Safety Charge",  pct(ls.unloadingPercent),      fmt(lsUnload)],
    ["8", "Bank charges / Administrative",    pct(ls.bankChargesPercent),    fmt(lsBank)],
    ["",  "Low Side Sub Total Cost",         "",                            fmt(lsSubTotal)],
    ["9", "Contracting Overhead Amount",     pct(ls.overheadPercent),       fmt(lsOverhead)],
    ["",  "Grand Total Low Side Expense",    "",                            fmt(lsGrand)],
    ["10","Contracting Profit Margin",       pct(ls.profitPercent),         fmt(lsProfit)],
    ["",  "Low Side Project Value (Excl Tax)", "",                          fmt(lsProjVal)],
    ["",  "Contracting GST Liability",       pct(ls.gstPercent),            fmt(lsGst)],
    ["",  "Low Side Final Price (Incl Tax)", "",                            fmt(lsFinal)]
  ];
  
  autoTable(doc, {
    startY: nextY + 6,
    head: [["Ref.", "Indirect Cost Elements / Markups", "Rate / Config", "Amount"]],
    body: lsMarkupRows,
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: COLOR_TEXT,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      halign: "right"
    },
    headStyles: {
      fillColor: COLOR_HEADER_BG,
      textColor: COLOR_TEXT,
      fontStyle: "bold",
      halign: "center",
      lineColor: COLOR_BORDER,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "left",   cellWidth: 80 },
      2: { halign: "center", cellWidth: 28 }
    },
    didParseCell: (data: any) => {
      if (data.section === "body") {
        const desc = String(lsMarkupRows[data.row.index]?.[1]);
        const isSum =
          desc.includes("Sub Total") ||
          desc.includes("Grand Total") ||
          desc.includes("Project Value") ||
          desc.includes("Final Price");
        
        if (isSum) {
          Object.assign(data.cell.styles, {
            fillColor: COLOR_HEADER_BG,
            fontStyle: "bold"
          });
        }
      }
    },
    margin: { left: 15, right: 15 }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4+: MATERIALS SUMMARY & DETAILED BREAKDOWN
// ─────────────────────────────────────────────────────────────────────────────
const addPage4MaterialSummary = (doc: jsPDF, c: ICosting) => {
  let curY = prepareNewPage(doc, c, "Materials Summary & Details");
  const est = c.lowSide.materialEstimate;
  
  // Section 1: Categories Side-by-Side Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_TEXT);
  doc.text("UNIFIED MATERIAL & LABOUR CATEGORY SUMMARY", 15, curY + 5);
  
  // Compute category totals
  const getSecTotals = (items?: any[]) => {
    const total = (items || []).reduce((sum, item) => sum + (item.qty * item.ur), 0);
    return total;
  };
  
  const instCost = getSecTotals(est.installation?.items);
  const testCost = getSecTotals(est.testingCommissioning?.items);
  
  const cpCost = est.refPiping.copperPipes.reduce((s, p) => s + p.qty * p.ur, 0);
  const insCost = est.refPiping.insulation.reduce((s, ins) => {
    let cpIndex = est.refPiping.copperPipes.findIndex(cp => cp.size === ins.size || normalizeSize(cp.size) === normalizeSize(ins.size));
    const qty = cpIndex !== -1 ? est.refPiping.copperPipes[cpIndex].qty / 1.75 : ins.qty;
    return s + qty * ins.ur;
  }, 0);
  const accCost = getSecTotals(est.refPiping.accessories);
  const refPipingCost = cpCost + insCost + accCost;
  
  const ctrlCost = est.controlCabling.cables.reduce((s, cab) => s + cab.qty * cab.ur, 0);
  const pwrCost  = est.powerCabling.cables.reduce((s, cab) => s + cab.qty * cab.ur, 0);
  
  const dpCost  = est.drainPiping.pvcPipes.reduce((s, p) => s + p.qty * p.ur, 0);
  const dpaCost = getSecTotals(est.drainPiping.accessories);
  const drainCost = dpCost + dpaCost;
  
  let gssDuctingTotal = 0;
  est.ducting.gssDucting.forEach((d) => {
    const totalWt = (d.qtySqMtr / 3) * d.wtPerSheet;
    gssDuctingTotal += totalWt * d.ratePerKg;
  });
  const thermalInsSqMtr = est.ducting.gssDucting.find(d => d.gauge.includes("24"))?.qtySqMtr || 0;
  const acousticInsSqMtr = est.ducting.gssDucting.find(d => d.gauge.includes("22"))?.qtySqMtr || 0;
  const ductingAccessoriesCost = getSecTotals(est.ducting.accessories);
  const ductingCost = gssDuctingTotal + (thermalInsSqMtr * est.ducting.thermalInsulationUR) + (acousticInsSqMtr * est.ducting.acousticInsulationUR) + ductingAccessoriesCost;
  
  const atSub = (est.airTerminals?.items || [])
    .filter((i: any) => i.description.toLowerCase() !== "freight")
    .reduce((s, i) => {
      const isArea = i.description.toLowerCase().includes("grill") || i.description.toLowerCase().includes("damper");
      return s + (isArea ? i.qty * 10.764 * i.ur : i.qty * i.ur);
    }, 0);
  const atFreightRate = est.airTerminals?.freightRate ?? 0.10;
  const atCost = atSub * (1 + atFreightRate);
  
  const eyeSub = (est.eyeballDiffuser?.items || [])
    .filter((i: any) => i.description.toLowerCase() !== "freight")
    .reduce((s, i) => s + i.qty * i.ur, 0);
  const eyeFreightRate = est.eyeballDiffuser?.freightRate ?? 0.10;
  const eyeCost = eyeSub * (1 + eyeFreightRate);
  
  const standCost = getSecTotals(est.oduStand?.items);
  const fillPvcCapCost = getSecTotals(est.pvcCasingCap?.items);
  
  // Low Side labour rates references
  const lowSideItems = c.lowSide.items;
  const getLabour = (descFrag: string) => {
    const it = lowSideItems.find(i => i.description.toLowerCase().includes(descFrag));
    return it ? it.labourRate : 0;
  };
  
  const sideBySideData = [
    ["1. Installation works",           fmt(instCost),       fmt(getLabour("installation")),   fmt(0), fmt(instCost + getLabour("installation"))],
    ["2. Testing & Commissioning",      fmt(testCost),       fmt(getLabour("testing")),        fmt(0), fmt(testCost + getLabour("testing"))],
    ["3. Refrigerant Copper Piping",    fmt(refPipingCost),  fmt(getLabour("piping")),         fmt(0), fmt(refPipingCost + getLabour("piping"))],
    ["4. Control Cabling system",       fmt(ctrlCost),       fmt(getLabour("control cabling")),fmt(0), fmt(ctrlCost + getLabour("control cabling"))],
    ["5. Power Cabling system",         fmt(pwrCost),        fmt(getLabour("power cabling")),  fmt(0), fmt(pwrCost + getLabour("power cabling"))],
    ["6. Condensate Drain Piping",      fmt(drainCost),      fmt(getLabour("drain piping")),   fmt(0), fmt(drainCost + getLabour("drain piping"))],
    ["7. R32 Gas Top-Up Charging",      fmt(Math.round((950 / 1.18) * (c.lowSide.items.find(i => i.description.toLowerCase().includes("gas charging"))?.qty || 0))), fmt(0), fmt(0), fmt(Math.round((950 / 1.18) * (c.lowSide.items.find(i => i.description.toLowerCase().includes("gas charging"))?.qty || 0)))],
    ["8. GSS Ducting & Insulation",     fmt(ductingCost),    fmt(getLabour("ducting")),        fmt(0), fmt(ductingCost + getLabour("ducting"))],
    ["9. Air Terminals / Diffusers",    fmt(atCost),         fmt(getLabour("air terminal")),   fmt(0), fmt(atCost + getLabour("air terminal"))],
    ["10. Eyeball Diffusers",           fmt(eyeCost),        fmt(getLabour("eyeball")),        fmt(0), fmt(eyeCost + getLabour("eyeball"))],
    ["11. Outdoor Unit (ODU) Stands",   fmt(standCost),      fmt(getLabour("odu stand")),      fmt(0), fmt(standCost + getLabour("odu stand"))],
    ["12. PVC Casing Cap details",      fmt(fillPvcCapCost), fmt(getLabour("casing")),         fmt(0), fmt(fillPvcCapCost + getLabour("casing"))],
    [
      "Total Low Side Breakdown",
      fmt(instCost + testCost + refPipingCost + ctrlCost + pwrCost + drainCost + ductingCost + atCost + eyeCost + standCost + fillPvcCapCost + Math.round((950 / 1.18) * (c.lowSide.items.find(i => i.description.toLowerCase().includes("gas charging"))?.qty || 0))),
      fmt(lowSideItems.reduce((s, i) => s + i.labourRate, 0)),
      fmt(0),
      fmt(lowSideItems.reduce((s, i) => s + i.materialRate + i.labourRate, 0))
    ]
  ];
  
  autoTable(doc, {
    startY: curY + 9,
    head: [["Category Classification Section", "Material Cost", "Labour Cost", "Misc. Cost", "Total Combined"]],
    body: sideBySideData,
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: COLOR_TEXT,
      lineColor: COLOR_BORDER,
      lineWidth: 0.2,
      halign: "right"
    },
    headStyles: {
      fillColor: COLOR_HEADER_BG,
      textColor: COLOR_TEXT,
      fontStyle: "bold",
      halign: "center",
      lineColor: COLOR_BORDER,
      lineWidth: 0.2
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 60 }
    },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.index === sideBySideData.length - 1) {
        Object.assign(data.cell.styles, {
          fillColor: COLOR_HEADER_BG,
          fontStyle: "bold"
        });
      }
    },
    margin: { left: 15, right: 15 }
  });
  
  curY = (doc as any).lastAutoTable.finalY + 8;
  const ph = doc.internal.pageSize.getHeight();
  const pw = doc.internal.pageSize.getWidth();
  
  // Reusable function to render detailed tables on subsequent space or new pages
  const addDetailedSection = (title: string, headers: string[], rows: any[], colStyles: any = {}) => {
    if (curY > ph - 45) {
      curY = prepareNewPage(doc, c, "Materials Summary & Details (cont.)");
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(COLOR_TEXT);
    doc.text(title.toUpperCase(), 15, curY + 4);
    
    doc.setDrawColor(COLOR_BORDER);
    doc.setLineWidth(0.4);
    doc.line(15, curY + 6, pw - 15, curY + 6);
    
    curY += 8;
    
    autoTable(doc, {
      startY: curY,
      head: [headers],
      body: rows,
      styles: {
        font: "helvetica",
        fontSize: 7.2,
        cellPadding: 1.8,
        textColor: COLOR_TEXT,
        lineColor: COLOR_BORDER,
        lineWidth: 0.2,
        halign: "right"
      },
      headStyles: {
        fillColor: COLOR_HEADER_BG,
        textColor: COLOR_TEXT,
        fontStyle: "bold",
        halign: "center",
        lineColor: COLOR_BORDER,
        lineWidth: 0.2
      },
      columnStyles: {
        0: { halign: "left", cellWidth: 70 },
        ...colStyles
      },
      didParseCell: (data: any) => {
        if (data.section === "body") {
          const rowLabel = String(data.row.raw[0]);
          if (rowLabel.toLowerCase().includes("total") || rowLabel.toLowerCase().includes("subtotal")) {
            Object.assign(data.cell.styles, {
              fillColor: COLOR_HEADER_BG,
              fontStyle: "bold"
            });
          }
        }
      },
      margin: { left: 15, right: 15 }
    });
    
    curY = (doc as any).lastAutoTable.finalY + 6;
  };
  
  // Detailed Section Tables (rendered one by one with pagination checks)
  
  // 1. Installation Details
  const instItems = est.installation?.items || [];
  addDetailedSection(
    "1. Installation Materials Breakdown",
    ["Material Item Details", "Unit Rate", "Qty", "Unit", "Total Rate"],
    [
      ...instItems.map((i: any) => [i.description || i.size, fmt(i.ur), i.qty.toFixed(2), i.unit || "Rmt", fmt(i.qty * i.ur)]),
      ["Subtotal - Installation Materials", "", "", "", fmt(instCost)]
    ]
  );
  
  // 2. Testing Details
  const testItems = est.testingCommissioning?.items || [];
  addDetailedSection(
    "2. Testing & Commissioning Materials",
    ["Testing Category Details", "Unit Rate", "Qty", "Unit", "Total Rate"],
    [
      ...testItems.map((i: any) => [i.description || i.size, fmt(i.ur), i.qty.toFixed(2), i.unit || "Nos", fmt(i.qty * i.ur)]),
      ["Subtotal - Testing Materials", "", "", "", fmt(testCost)]
    ]
  );
  
  // 3. Refrigerant Piping
  const cpPipes = est.refPiping.copperPipes || [];
  const insul   = est.refPiping.insulation || [];
  const accs    = est.refPiping.accessories || [];
  const refPipingRows: any[] = [];
  
  refPipingRows.push(["Copper Piping Runs (Hard/Soft)", "", "", "", ""]);
  cpPipes.forEach((p: any) => {
    refPipingRows.push([`Copper Pipe: ${p.size} (${p.type})`, fmt(p.ur), p.qty.toFixed(2), "Rmt", fmt(p.qty * p.ur)]);
  });
  refPipingRows.push(["Subtotal - Copper Pipes Only", "", "", "", fmt(cpCost)]);
  
  refPipingRows.push(["Insulation Sleeves / Nitrile Runs", "", "", "", ""]);
  insul.forEach((ins: any) => {
    let cpIndex = est.refPiping.copperPipes.findIndex(cp => cp.size === ins.size || normalizeSize(cp.size) === normalizeSize(ins.size));
    const calculatedQty = cpIndex !== -1 ? est.refPiping.copperPipes[cpIndex].qty / 1.75 : ins.qty;
    refPipingRows.push([`Insulation: ${ins.size}`, fmt(ins.ur), calculatedQty.toFixed(2), "Nos.", fmt(calculatedQty * ins.ur)]);
  });
  refPipingRows.push(["Subtotal - Insulation Runs", "", "", "", fmt(insCost)]);
  
  refPipingRows.push(["Copper Pipe Accessories & Fittings", "", "", "", ""]);
  accs.forEach((a: any) => {
    refPipingRows.push([a.description, fmt(a.ur), a.qty.toFixed(2), a.unit, fmt(a.qty * a.ur)]);
  });
  refPipingRows.push(["Subtotal - Pipe Accessories", "", "", "", fmt(accCost)]);
  refPipingRows.push(["Total Refrigerant Copper Piping Cost", "", "", "", fmt(refPipingCost)]);
  
  addDetailedSection(
    "3. Refrigerant Copper Piping & Accessories",
    ["Piping Run / Accessory Component", "Unit Rate", "Qty", "Unit", "Total Rate"],
    refPipingRows
  );
  
  // 4. Cabling (Control & Power)
  const ctrlCables = est.controlCabling?.cables || [];
  addDetailedSection(
    "4. Control Cabling Detail Items",
    ["Cable Specification / Size", "Unit Rate", "Qty", "Unit", "Total Rate"],
    [
      ...ctrlCables.map((i: any) => [i.description || i.size, fmt(i.ur), i.qty.toFixed(2), i.unit || "Rmt", fmt(i.qty * i.ur)]),
      ["Total Control Cabling", "", "", "", fmt(ctrlCost)]
    ]
  );
  
  const pwrCables = est.powerCabling?.cables || [];
  addDetailedSection(
    "5. Power Cabling Detail Items",
    ["Cable Specification / Size", "Unit Rate", "Qty", "Unit", "Total Rate"],
    [
      ...pwrCables.map((i: any) => [i.description || i.size, fmt(i.ur), i.qty.toFixed(2), i.unit || "Rmt", fmt(i.qty * i.ur)]),
      ["Total Power Cabling", "", "", "", fmt(pwrCost)]
    ]
  );
  
  // 6. Drain Piping Detail
  const pvcPipes = est.drainPiping.pvcPipes || [];
  const dpAccs   = est.drainPiping.accessories || [];
  const drainRows: any[] = [];
  pvcPipes.forEach((p: any) => {
    drainRows.push([`PVC Pipe size: ${p.size}`, fmt(p.ur), p.qty.toFixed(2), "Rmt", fmt(p.qty * p.ur)]);
  });
  drainRows.push(["Subtotal - PVC Pipes", "", "", "", fmt(dpCost)]);
  dpAccs.forEach((a: any) => {
    drainRows.push([a.description, fmt(a.ur), a.qty.toFixed(2), a.unit, fmt(a.qty * a.ur)]);
  });
  drainRows.push(["Subtotal - Drain Accessories", "", "", "", fmt(dpaCost)]);
  drainRows.push(["Total Drain Piping System Cost", "", "", "", fmt(drainCost)]);
  
  addDetailedSection(
    "6. Condensate Drain Piping System",
    ["Drain Pipe Component Detail", "Unit Rate", "Qty", "Unit", "Total Rate"],
    drainRows
  );
  
  // 7. Ducting & Air Terminals
  const qty24 = c.totalTR * 4.5;
  const qty22 = c.totalTR * 1.0;
  const gss24 = est.ducting.gssDucting.find((d: any) => d.gauge.includes("24")) || { wtPerSheet: 14, ratePerKg: 95 };
  const gss22 = est.ducting.gssDucting.find((d: any) => d.gauge.includes("22")) || { wtPerSheet: 18, ratePerKg: 93 };
  const total24 = (qty24 / 3) * gss24.wtPerSheet * gss24.ratePerKg;
  const total22 = (qty22 / 3) * gss22.wtPerSheet * gss22.ratePerKg;
  const thermalTotal = qty24 * est.ducting.thermalInsulationUR;
  const acousticTotal = qty22 * est.ducting.acousticInsulationUR;
  
  const ductRows = [
    ["GSS Ducting - 24 SWG", `${gss24.ratePerKg}/kg`, qty24.toFixed(1) + " Sq.m", "", fmt(total24)],
    ["GSS Ducting - 22 SWG", `${gss22.ratePerKg}/kg`, qty22.toFixed(1) + " Sq.m", "", fmt(total22)],
    ["Subtotal - GSS Ducting Sheets Only", "", "", "", fmt(total24 + total22)],
    ["Thermal Insulation GSS Wrap", fmt(est.ducting.thermalInsulationUR), qty24.toFixed(1), "Sq.m", fmt(thermalTotal)],
    ["Acoustic Lining GSS Wrap", fmt(est.ducting.acousticInsulationUR), qty22.toFixed(1), "Sq.m", fmt(acousticTotal)],
    ...(est.ducting.accessories || []).map((a: any) => [a.description, fmt(a.ur), a.qty.toFixed(2), a.unit, fmt(a.qty * a.ur)]),
    ["Total Ducting, Insulation & Canvas Cost", "", "", "", fmt(ductingCost)]
  ];
  
  addDetailedSection(
    "7. Ducting & Air Terminals Insulation",
    ["Ducting System Element", "Rate", "Qty", "Unit", "Total Rate"],
    ductRows
  );
  
  // 8. Air Terminals Detail
  const atItems = est.airTerminals?.items || [];
  addDetailedSection(
    "8. Air Terminals Elements",
    ["Air Terminal Component", "Rate Value", "Qty", "Unit", "Total Rate"],
    [
      ...atItems.map((i: any) => {
        const isArea = i.description.toLowerCase().includes("grill") || i.description.toLowerCase().includes("damper");
        const total  = isArea ? i.qty * 10.764 * i.ur : i.qty * i.ur;
        return [i.description, fmt(i.ur), i.qty.toString(), i.unit || "Nos.", fmt(total)];
      }),
      ["Total Air Terminals (before Freight)", "", "", "", fmt(atSub)],
      [`Freight Margin Cost (${pct(atFreightRate)})`, "", "", "", fmt(atSub * atFreightRate)],
      ["Total Combined Air Terminals Cost", "", "", "", fmt(atCost)]
    ]
  );
  
  // 9. Eyeball Diffusers
  const eyeItems = est.eyeballDiffuser?.items || [];
  addDetailedSection(
    "9. Eyeball Diffuser Items",
    ["Eyeball Diffuser Spec", "Rate Value", "Qty", "Unit", "Total Rate"],
    [
      ...eyeItems.map((i: any) => [i.description, fmt(i.ur), i.qty.toString(), i.unit || "Nos.", fmt(i.qty * i.ur)]),
      ["Total Eyeball Diffuser (before Freight)", "", "", "", fmt(eyeSub)],
      [`Freight Margin Cost (${pct(eyeFreightRate)})`, "", "", "", fmt(eyeSub * eyeFreightRate)],
      ["Total Combined Eyeball Diffuser Cost", "", "", "", fmt(eyeCost)]
    ]
  );
  
  // 10. ODU Stand
  const OduItems = est.oduStand?.items || [];
  addDetailedSection(
    "10. ODU Stand Mount Details",
    ["ODU Stand Specifications", "Unit Rate", "Qty", "Unit", "Total Rate"],
    [
      ...OduItems.map((i: any) => [i.description || i.size, fmt(i.ur), i.qty.toFixed(2), i.unit || "Nos", fmt(i.qty * i.ur)]),
      ["Total ODU Stands Material Cost", "", "", "", fmt(standCost)]
    ]
  );
  
  // 11. PVC Casing Cap
  const pvcItems = est.pvcCasingCap?.items || [];
  addDetailedSection(
    "11. PVC Casing Cap Details",
    ["Casing Cap Specification", "Unit Rate", "Qty", "Unit", "Total Rate"],
    [
      ...pvcItems.map((i: any) => [i.description || i.size, fmt(i.ur), i.qty.toFixed(2), i.unit || "Rmt", fmt(i.qty * i.ur)]),
      ["Total PVC Casing Cap Material Cost", "", "", "", fmt(fillPvcCapCost)]
    ]
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
export function exportCostingToPdf(costing: ICosting) {
  // A4 Portrait Format (210mm x 297mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  // Draw page 1 Cost Summary
  addPage1CostSummary(doc, costing);
  
  // Draw page 2 High Side Works
  addPage2HighSide(doc, costing);
  
  // Draw page 3 Low Side DSU Works
  addPage3LowSide(doc, costing);
  
  // Draw page 4 Materials Summary & Breakdowns
  addPage4MaterialSummary(doc, costing);
  
  // Global Footer Page Numbering Injection
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawMinimalFooter(doc, costing, i, totalPages);
  }
  
  // Save ERP PDF Costing File
  doc.save(`Continental_Costing_Report_${costing.enquiryNo}_Rev${costing.revision}.pdf`);
}

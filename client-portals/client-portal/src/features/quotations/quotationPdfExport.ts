import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quotation } from "../../interfaces/quotation.interface";

// ── Corporate proposal colors ──────────────────────
const COLOR_TEXT             = "#111111";
const COLOR_MUTED            = "#555555";
const COLOR_BORDER           = "#333333";
const COLOR_PRIMARY_MAGENTA  = "#B5165A";
const COLOR_PRIMARY_BLUE     = [142, 170, 209] as [number, number, number]; // Soft blue #8EAAD1
const COLOR_SEAL_PINK        = [224, 147, 179] as [number, number, number]; // Seal pink for stamp

const fmt = (n: number) =>
  Math.round(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtDate = (dStr: string) =>
  new Date(dStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload  = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

export interface PdfExportOptions {
  includeSpecialNote: boolean;
  specialNoteText: string;
  includeNotes: boolean;
  notes: string[];
  includeExclusions: boolean;
  exclusions: string[];
  includeValidity: boolean;
  validityText: string;
  includeWarranty: boolean;
  warrantyText: string;
  includePaymentTerms: boolean;
  paymentTerms: string[];
  includeSignatures: boolean;
  closingLine1: string;
  closingLine2: string;
  signerName: string;
  signerTitle: string;
  ccList: string[];
  subjectText?: string;
  introText?: string;
  locationText?: string;
  unitTypeText?: string;
  makeText?: string;
}

export async function exportQuotationToPdf(q: Quotation, options?: PdfExportOptions) {
  let bannerImg: HTMLImageElement | null = null;
  try {
    bannerImg = await loadImage("/banner.jpeg");
  } catch (e) {
    console.error("Failed to load banner.jpeg", e);
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const defaultOptions: PdfExportOptions = {
    includeSpecialNote: true,
    specialNoteText: "Special Note: Deliver of A/C units will take minimum 3 weeks from the date of 100% payment.",
    includeNotes: true,
    notes: [
      "1. The quantities mentioned in BOQ are tentative, exact measurements can be appraised only after approval of shop drawings, locations of indoor and out door units etc. and any additional requirement, except the scope of work and quantity mentioned, will be charged extra.",
      "2. Any structural support/Scaffolding necessary for our installation shall be done by the client to our requirement.",
      "3. Service access for Indoor and outdoor units shall be provided by the customer."
    ],
    includeExclusions: true,
    exclusions: [
      "1. All types of civil / builders work such as wall /ceiling openings, unit foundations, angle support for IDU/ODU, Core cutting, ceiling, cladding, painting, water proofing, finishing etc. and are to executed to our requirements.",
      "2. Power supply terminated in isolators to IDU/ ODU, Exhaust works, Provision of drain points near to IDU, Hoist for locating condensing units.",
      "3. Power stabilizers, BMS, home atomization etc and related works.",
      "4. Fees, approvals, Insurance etc from any Governmental institutions, Municipality, civil defence, union staffs or any other agencies involved.",
      "5. Spare parts, consumables, refrigerant, PPM service etc. during warranty period.",
      "6. Power required during our installation and commissioning.",
      "7. Any other item specifically not mentioned by us.",
      "8. MS Angle frame works for outdoor unit support, catwalk etc."
    ],
    includeValidity: true,
    validityText: "Our offer is valid for a period of 15 days from the date of our offer and subject to written confirmation thereafter.",
    includeWarranty: true,
    warrantyText: "12 months from the date of commissioning of machines or 18 months from the date of billing which ever comes early.",
    includePaymentTerms: true,
    paymentTerms: [
      "1. 100% advance payment for A/C ( High Side) unit along with P.O",
      "2. 50% advance payment for  low side works.",
      "3. 25% against delivery of materials at site.",
      "4. 20% against erection of units, laying of copper pipes, installation of ducts & grills at site.",
      "5. 5% prior to testing and commissioning."
    ],
    includeSignatures: true,
    closingLine1: "We hope the above quote meet your requirements. Expecting your earliest confirmation and we will ensure our sincere attention",
    closingLine2: "Should you have any clarifications, please do not hesitate to contact us.",
    signerName: "Sreejith Balan",
    signerTitle: "Sales Manager",
    ccList: [
      "Martin Xavier, MD",
      "T.P. Paul, TD",
      "Roy Pascal, GM"
    ],
    subjectText: `Airconditioning works for ${q.clientName}.`,
    introText: "With reference to the discussions, we are pleased to submit our offer for the airconditioning works , based on the following terms and conditions.",
    locationText: `${q.clientName}${q.clientAddress ? ", " + q.clientAddress : ""}`,
    unitTypeText: "Ductable Split Unit",
    makeText: "DAIKIN"
  };

  const opt = { ...defaultOptions, ...options };
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();  // 297

  const ML = 20;  // Left margin 12mm
  const MR = 20;  // Right margin 12mm
  const CW = pw - ML - MR; // 186mm content width

  const drawnPages = new Set<number>();

  // ══════════════════════════════════════════════════════════
  //  PER-PAGE HEADER + FOOTER
  // ══════════════════════════════════════════════════════════
  const drawPageDecor = (pdf: jsPDF, pageNum: number) => {
    if (drawnPages.has(pageNum)) return;
    drawnPages.add(pageNum);

    const isFirstPage = pageNum === 1;

    if (isFirstPage) {
      // ── FIRST PAGE HEADER (90-100mm area total) ──
      // Centered logo banner
      if (bannerImg) {
        // Logo width 180px = 47.6mm, height proportional (ratio 2.87 => 16.6mm)
        const bannerW = 80;
        const bannerH = 70 / 2.87;
        const bannerX = (pw - bannerW) / 2;
        pdf.addImage(bannerImg, "JPEG", bannerX, 10, bannerW, bannerH);
      } else {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(COLOR_PRIMARY_MAGENTA);
        pdf.text("CONTINENTAL", pw / 2, 18, { align: "center" });
        pdf.setFontSize(8);
        pdf.setTextColor(COLOR_TEXT);
        pdf.text("PROJECTS & FACILITIES", pw / 2, 22, { align: "center" });
      }

      // Credentials line below logo (PAN / Service Tax / GSTIN)
      pdf.setFont("times", "italic");
      pdf.setFontSize(9.5);
      pdf.setTextColor("#000000");
      const cred = `PAN NO: ${q.panNo ?? "AALFC2396N"}, Service Tax No: ${q.serviceTaxNo ?? "AALFC2396NSD001"}, GSTIN: ${q.gstin ?? "32AALFC2396N2Z1"}`;
      pdf.text(cred, pw / 2, 37, { align: "center" });

      // Horizontal separator line under credentials (20px / 5.3mm spacing)
      pdf.setDrawColor(COLOR_BORDER);
      pdf.setLineWidth(0.4);
      pdf.line(ML, 37.5, pw - MR, 38.5);

      // ── FIRST PAGE FOOTER (Reduced height, original proportions) ──
      // Address text line
      pdf.setFont("times", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(COLOR_MUTED);
      pdf.text(
        "BUILDING NO. 18/2459C, PYARI JUNCTION, THOPPUMPADY, KOCHI-5, TEL: +914844069307 E-MAIL: info@contproj.com",
        ML, ph - 9
      );

      // Accent color bar at very bottom
      pdf.setFillColor(COLOR_PRIMARY_MAGENTA);
      pdf.rect(ML, ph - 6, CW, 3, "F");

      // www.contproj.com centered on the bar
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.setTextColor("#FFFFFF");
      pdf.text("www.contproj.com", pw / 2, ph - 3.8, { align: "center" });
    } else {
      // ── PAGES 2+ HEADER (No logo, only maroon divider line at 10mm) ──
      pdf.setDrawColor(COLOR_PRIMARY_MAGENTA);
      pdf.setLineWidth(0.5);
      pdf.line(ML, 10, pw - MR, 10);

      // // ── PAGES 2+ WATERMARK ──
      // pdf.saveGraphicsState();
      // pdf.setTextColor("#F5F5F5");
      // pdf.setFont("helvetica", "bold");
      // pdf.setFontSize(26);
      // pdf.text("CONTINENTAL PROJECTS & FACILITIES", pw / 2, ph / 2, {
      //   align: "center",
      //   angle: 45,
      // });
      // pdf.restoreGraphicsState();
    }

    pdf.setTextColor(COLOR_TEXT); // reset
  };

  // Draw Page 1 header and footer initially
  drawPageDecor(doc, 1);

  // ══════════════════════════════════════════════════════════
  //  CONTENT STARTS (Page 1 starts after header at y=95)
  // ══════════════════════════════════════════════════════════
  let y = 48;

  // ── Ref & Date (stacked on left) ──
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT);
  doc.text(`Ref: ${q.quotationNo}`, ML, y);
  y += 4.5;
  doc.text(`Date: ${fmtDate(q.date)}`, ML, y);
  y += 9; // 12mm spacing after Ref/Date block

  // ── To, ──
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("To,", ML, y);
  y += 6;

  // Client details
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text(q.clientName, ML + 8, y);
  y += 4.5;

  if (q.clientAddress) {
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(q.clientAddress, ML + 8, y);
    y += 4.5;
  }

  y += 10; // 12mm spacing after Address block

  // ── Dear Sir ──
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text("Dear Sir,", ML, y);
  y += 7;

  // ── Subject ──
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  const subjectLabel = "Subject:";
  doc.text(subjectLabel, ML, y);
  doc.setFont("times", "italic");
  const subText = opt.subjectText || `Airconditioning works for ${q.clientName}.`;
  const splitSubject = doc.splitTextToSize(subText, CW - doc.getTextWidth(subjectLabel) - 1.5);
  if (splitSubject.length > 0) {
    doc.text(splitSubject[0], ML + doc.getTextWidth(subjectLabel) + 1.5, y);
    for (let i = 1; i < splitSubject.length; i++) {
      y += 4.5;
      doc.text(splitSubject[i], ML + doc.getTextWidth(subjectLabel) + 1.5, y);
    }
  }
  y += 9; // 12mm spacing after Subject block

  // ── Intro paragraph ──
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  const introTextVal = opt.introText || "With reference to the discussions, we are pleased to submit our offer for the airconditioning works , based on the following terms and conditions.";
  const splitIntro = doc.splitTextToSize(introTextVal, CW);
  if (splitIntro.length > 0) {
    doc.text("     " + splitIntro[0], ML, y);
    for (let i = 1; i < splitIntro.length; i++) {
      y += 4.5;
      doc.text(splitIntro[i], ML, y);
    }
  }
  y += 14; // 16px whitespace before heading

  // ════════════════════════════════════════════════════════
  //  SECTION HELPER (Roman numeral + underlined title)
  // ════════════════════════════════════════════════════════
  const drawSectionTitle = (roman: string, title: string, atY: number) => {
    doc.setFont("times", "bold");
    doc.setFontSize(10); // Section headings at 13pt
    doc.setTextColor(COLOR_TEXT);
    const fullTitle = `${roman}. ${title}`;
    doc.text(fullTitle, ML, atY);
    // Underline entire heading
    doc.setDrawColor(COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(ML, atY + 1.2, ML + doc.getTextWidth(fullTitle), atY + 1.2);
  };

  // ── I. BUILDING ──
  drawSectionTitle("I", "BUILDING :-", y);
  y += 6.5; // 10px spacing after heading
  doc.setFont("times", "normal"); // Reduced bold usage
  doc.setFontSize(9);
  const locVal = opt.locationText || `${q.clientName}${q.clientAddress ? ", " + q.clientAddress : ""}`;
  const locationText = `Location: ${locVal}.`;
  const splitLoc = doc.splitTextToSize(locationText, CW);
  splitLoc.forEach((line: string, idx: number) => {
    doc.text(line, ML, y);
    if (idx < splitLoc.length - 1) {
      y += 4.5;
    }
  });
  y += 10; // 16px whitespace before heading

  // ── II. PROPOSED EQUIPMENT ──
  drawSectionTitle("II", "PROPOSED EQUIPMENT/ MATERIALS:-", y);
  y += 6.5; // 10px spacing after heading
  doc.setFont("times", "normal"); // Reduced bold usage
  doc.setFontSize(9);
  const unitVal = opt.unitTypeText || "Ductable Split Unit";
  const unitText = `Type of Unit: ${unitVal}.`;
  const splitUnit = doc.splitTextToSize(unitText, CW);
  splitUnit.forEach((line: string) => {
    doc.text(line, ML, y);
    y += 4.5;
  });

  const makeVal = opt.makeText || "DAIKIN";
  const makeText = `Make: ${makeVal}.`;
  const splitMake = doc.splitTextToSize(makeText, CW);
  splitMake.forEach((line: string) => {
    doc.text(line, ML, y);
    y += 4.5;
  });
  y += 5.5; // 16px whitespace before heading

  // ── III. SCOPE OF WORK ──
  drawSectionTitle("III", "SCOPE OF WORK WITH RATES :-", y);
  y += 6.5; // 10px spacing after heading
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text("Ducted Unit (DAIKIN - Inverter)", ML, y);
  y += 14;

  // ════════════════════════════════════════════════════════
  //  SCOPE ITEMS TABLE
  // ════════════════════════════════════════════════════════
  const machineItems = q.items.filter((i) => !i.section || i.section === "machine_side");
  const lowSideItems = q.items.filter((i) => i.section === "low_side");
  const machineTotal = machineItems.reduce((s, i) => s + i.total, 0);
  const lowSideTotal  = lowSideItems.reduce((s, i) => s + i.total, 0);
  const grandTotal    = machineTotal + lowSideTotal;

  // Cell Styles (Standard proposal styling)
  const sectionCellStyle = {
    font: "times",
    fontStyle: "italic" as const,
    fillColor: [255, 255, 255] as [number, number, number],
    textColor: [17, 17, 17] as [number, number, number],
    lineColor: [51, 51, 51] as [number, number, number],
  };
  const groupCellStyle = {
    font: "times",
    fontStyle: "bold" as const,
    fillColor: [255, 255, 255] as [number, number, number],
    textColor: [17, 17, 17] as [number, number, number],
    lineColor: [51, 51, 51] as [number, number, number],
  };
  const totalCellStyle = {
    font: "times",
    fontStyle: "bold" as const,
    fillColor: COLOR_PRIMARY_BLUE,
    textColor: [17, 17, 17] as [number, number, number],
    lineColor: [51, 51, 51] as [number, number, number],
  };

  const rows: any[] = [];

  // ── A. MACHINE SIDE ──
  rows.push([
    { content: "A.", styles: { ...sectionCellStyle, fontStyle: "italic", halign: "left" } },
    { content: "MACHINE SIDE:-", colSpan: 5, styles: { ...sectionCellStyle, fontStyle: "bolditalic", halign: "left" } },
  ]);

  const machineGroups: Record<string, typeof machineItems> = {};
  machineItems.forEach((item) => {
    const grp = item.group || "Supply of inverter Ductable AC Unit";
    if (!machineGroups[grp]) machineGroups[grp] = [];
    machineGroups[grp].push(item);
  });

  let mGIdx = 1;
  for (const [groupName, groupItems] of Object.entries(machineGroups)) {
    rows.push([
      { content: String(mGIdx), styles: { ...groupCellStyle, halign: "center" } },
      { content: groupName, colSpan: 5, styles: { ...groupCellStyle, halign: "left" } },
    ]);
    groupItems.forEach((item, idx) => {
      if (item.isDescriptionOnly) {
        rows.push([
          `${mGIdx}.${idx + 1}`,
          { content: item.description, colSpan: 5, styles: { fontStyle: "italic", halign: "left" } },
        ]);
      } else {
        rows.push([
          `${mGIdx}.${idx + 1}`,
          item.description,
          item.unit || "No",
          item.qty.toString(),
          fmt(item.rate),
          fmt(item.total),
        ]);
      }
    });
    mGIdx++;
  }

  rows.push([
    {
      content: "TOTAL MACHINE SIDE COST WITH GST  (INR)",
      colSpan: 5,
      styles: { ...totalCellStyle, halign: "center" },
    },
    {
      content: fmt(machineTotal),
      styles: { ...totalCellStyle, halign: "right" },
    },
  ]);

  // ── B. LOW SIDE ──
  if (lowSideItems.length > 0) {
    rows.push([
      { content: "B.", styles: { ...sectionCellStyle, fontStyle: "italic", halign: "left" } },
      { content: "LOW SIDE WORKS:-", colSpan: 5, styles: { ...sectionCellStyle, fontStyle: "bolditalic", halign: "left" } },
    ]);

    const lowGroups: Record<string, typeof lowSideItems> = {};
    lowSideItems.forEach((item) => {
      const grp = item.group || "Ungrouped Low Side Works";
      if (!lowGroups[grp]) lowGroups[grp] = [];
      lowGroups[grp].push(item);
    });

    let lGIdx = 1;
    for (const [groupName, groupItems] of Object.entries(lowGroups)) {
      rows.push([
        { content: String(lGIdx), styles: { ...groupCellStyle, halign: "center" } },
        { content: groupName, colSpan: 5, styles: { ...groupCellStyle, halign: "left" } },
      ]);
      groupItems.forEach((item, idx) => {
        if (item.isDescriptionOnly) {
          rows.push([
            `${lGIdx}.${idx + 1}`,
            { content: item.description, colSpan: 5, styles: { fontStyle: "italic", halign: "left" } },
          ]);
        } else {
          rows.push([
            `${lGIdx}.${idx + 1}`,
            item.description,
            item.unit || "Rmt",
            item.qty.toString(),
            fmt(item.rate),
            fmt(item.total),
          ]);
        }
      });
      lGIdx++;
    }

    rows.push([
      {
        content: "TOTAL LOW SIDE COST WITH GST  (INR)",
        colSpan: 5,
        styles: { ...totalCellStyle, halign: "center" },
      },
      {
        content: fmt(lowSideTotal),
        styles: { ...totalCellStyle, halign: "right" },
      },
    ]);

    rows.push([
      {
        content: "GRAND TOTAL ( HIGH SIDE+LOWSIDE)",
        colSpan: 5,
        styles: { ...totalCellStyle, halign: "center" },
      },
      {
        content: fmt(grandTotal),
        styles: { ...totalCellStyle, halign: "right" },
      },
    ]);
  }

  // ── Render table ──
  autoTable(doc, {
    startY: y,
    head: [["SL.NO", "DESCRIPTION", "UNIT", "QTY", "RATE", "AMOUNT"]],
    body: rows,
    theme: "grid",
    styles: {
      font: "times",
      fontStyle: "normal", // Times New Roman Regular for table body content
      fontSize: 8.5,
      minCellHeight: 8.5, // 32px height equivalent
      cellPadding: { top: 2.3, bottom: 2.3, left: 2, right: 2 }, // 8-10px padding equivalent
      textColor: [17, 17, 17],
      lineColor: [51, 51, 51],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLOR_PRIMARY_BLUE,
      textColor: [17, 17, 17],
      font: "times",
      fontStyle: "bold",
      halign: "center",
      fontSize: 8.5,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "left" },
      2: { halign: "center", cellWidth: 15 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right",  cellWidth: 25 },
      5: { halign: "right",  cellWidth: 28 },
    },
    margin: { top: 22, bottom: 18, left: ML, right: MR },
    didDrawPage: (data) => {
      drawPageDecor(doc, data.pageNumber);
    },
  });

  let nextY = (doc as any).lastAutoTable.finalY + 8;

  const ensureSpace = (h: number) => {
    const limit = ph - (doc.getNumberOfPages() === 1 ? 20 : 15);
    if (nextY + h > limit) {
      doc.addPage();
      drawPageDecor(doc, doc.getNumberOfPages());
      nextY = 22; // Page 2+ content starts at 22mm
    }
  };


  // ════════════════════════════════════════════════════════
  //  SUMMARY BLOCK (White background, thick borders, centered title, large totals)
  // ════════════════════════════════════════════════════════
  ensureSpace(45);
  nextY += 9.5; // 35px whitespace before summary

  autoTable(doc, {
    startY: nextY,
    body: [
      [
        {
          content: "SUMMARY",
          colSpan: 2,
          styles: {
            halign: "center",
            fontStyle: "bold",
            fillColor: [255, 255, 255],
            textColor: [17, 17, 17],
            font: "helvetica",
            fontSize: 10.5,
          },
        },
      ],
      [
        { content: "TOTAL FOR HIGH SIDE  WORKS ( AC MACHINES SUPPLY)", styles: { font: "times", fontStyle: "normal" } },
        { content: fmt(machineTotal), styles: { font: "times", fontStyle: "normal", halign: "right" } }
      ],
      [
        { content: "TOTAL FOR LOW SIDE  WORKS", styles: { font: "times", fontStyle: "normal" } },
        { content: fmt(lowSideTotal), styles: { font: "times", fontStyle: "normal", halign: "right" } }
      ],
      [
        {
          content: "GRAND TOTAL WITH GST",
          styles: {
            font: "helvetica",
            fontStyle: "bold",
            fillColor: [255, 255, 255],
            textColor: [17, 17, 17],
            fontSize: 11,
          },
        },
        {
          content: fmt(q.total ?? grandTotal),
          styles: {
            font: "helvetica",
            fontStyle: "bold",
            fillColor: [255, 255, 255],
            textColor: [17, 17, 17],
            halign: "right",
            fontSize: 11,
          },
        },
      ],
    ],
    theme: "grid",
    styles: {
      fillColor: [255, 255, 255], // White background
      textColor: [17, 17, 17],
      lineColor: [51, 51, 51],
      lineWidth: 0.5, // Thick borders
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "right", cellWidth: 50 },
    },
    margin: { top: 22, bottom: 18, left: ML, right: MR },
  });

  nextY = (doc as any).lastAutoTable.finalY + 8;

  // ── Special Note ──
  if (opt.includeSpecialNote && opt.specialNoteText) {
    ensureSpace(13);
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(COLOR_TEXT);
    const snLines = doc.splitTextToSize(opt.specialNoteText, CW);
    snLines.forEach((line: string, i: number) => {
      const ly = nextY + i * 4.5;
      doc.text(line, ML, ly);
      doc.setDrawColor(COLOR_BORDER);
      doc.setLineWidth(0.25);
      doc.line(ML, ly + 0.6, ML + doc.getTextWidth(line), ly + 0.6);
    });
    nextY += snLines.length * 4.5 + 6;
  }

  // ════════════════════════════════════════════════════════
  //  IV–VIII  NOTES, EXCLUSIONS, VALIDITY, WARRANTY, PAYMENT
  // ════════════════════════════════════════════════════════
  const drawSection = (roman: string, title: string, lines: string[]) => {
    ensureSpace(lines.length * 5 + 14);
    
    // Section headings spacing: 16px before
    nextY += 4.2;

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLOR_TEXT);
    const fullTitle = `${roman}. ${title}`;
    doc.text(fullTitle, ML, nextY);
    // Underline heading
    doc.setDrawColor(COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(ML, nextY + 1.2, ML + doc.getTextWidth(fullTitle), nextY + 1.2);
    
    // Spacing after: 10px
    nextY += 7;

    doc.setFontSize(9);
    lines.forEach((text) => {
      const isBoldItalic = text.includes("Scaffolding") || text.includes("MS Angle");
      const style = isBoldItalic ? "bolditalic" : "normal";
      doc.setFont("times", style);
      
      const split = doc.splitTextToSize(text, CW - 5);
      split.forEach((sl: string, si: number) => {
        const ly = nextY + si * 4.2;
        doc.text(sl, ML, ly);
        if (style === "bolditalic") {
          doc.setDrawColor(COLOR_BORDER);
          doc.setLineWidth(0.25);
          doc.line(ML, ly + 0.6, ML + doc.getTextWidth(sl), ly + 0.6);
        }
      });
      nextY += split.length * 4.2 + 1.5;
    });
    nextY += 4;
  };

  if (opt.includeNotes && opt.notes && opt.notes.length > 0) {
    drawSection("IV", "NOTES:-", opt.notes);
  }

  if (opt.includeExclusions && opt.exclusions && opt.exclusions.length > 0) {
    drawSection("V", "WORKS EXCLUDED:-", opt.exclusions);
  }

  if (opt.includeValidity && opt.validityText) {
    drawSection("VI", "VALIDITY:-", [opt.validityText]);
  }

  if (opt.includeWarranty && opt.warrantyText) {
    drawSection("VII", "WARRANTY:-", [opt.warrantyText]);
  }

  // ── VIII. TERMS OF PAYMENT ──
  if (opt.includePaymentTerms && opt.paymentTerms && opt.paymentTerms.length > 0) {
    ensureSpace(opt.paymentTerms.length * 5 + 14);
    
    // 16px spacing before
    nextY += 4.2;

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(COLOR_TEXT);
    const topTitle = "VIII. TERMS OF PAYMENT:-";
    doc.text(topTitle, ML, nextY);
    // Underline
    doc.setDrawColor(COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.line(ML, nextY + 1.2, ML + doc.getTextWidth(topTitle), nextY + 1.2);
    
    // 10px spacing after
    nextY += 7;

    doc.setFont("times", "italic");
    doc.setFontSize(9);
    opt.paymentTerms.forEach((line) => {
      const split = doc.splitTextToSize(line, CW - 5);
      split.forEach((sl: string, si: number) => {
        doc.text(sl, ML + 8, nextY + si * 4.2);
      });
      nextY += split.length * 4.2 + 1;
    });
    nextY += 6;
  }

  // ── Closing & Signatures ──
  if (opt.includeSignatures) {
    ensureSpace(55);
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    if (opt.closingLine1) {
      doc.text(opt.closingLine1, ML, nextY);
      nextY += 5;
    }
    if (opt.closingLine2) {
      doc.text(opt.closingLine2, ML, nextY);
      nextY += 10.6; // 40px spacing before signature block
    }
    
    doc.text("Thanking you,", ML, nextY);
    nextY += 4.5;
    doc.setFont("times", "bold");
    doc.text("For Continental Projects & Facilities", ML, nextY);

    // ── DRAW BOTTOM-RIGHT SEMI-TRANSPARENT COMPANY SEAL WATERMARK ──
    // const sealX = pw - MR - 22;
    // const sealY = nextY + 12;
    // doc.saveGraphicsState();
    // doc.setDrawColor(COLOR_SEAL_PINK[0], COLOR_SEAL_PINK[1], COLOR_SEAL_PINK[2]);
    // doc.setLineWidth(0.45);
    // doc.circle(sealX, sealY, 15, "S");
    // doc.setLineWidth(0.2);
    // doc.circle(sealX, sealY, 13, "S");
    // doc.setFont("helvetica", "bold");
    // doc.setFontSize(5.2);
    // doc.setTextColor(COLOR_SEAL_PINK[0], COLOR_SEAL_PINK[1], COLOR_SEAL_PINK[2]);
    // doc.text("CONTINENTAL PROJECTS", sealX, sealY - 4.5, { align: "center" });
    // doc.text("& FACILITIES", sealX, sealY - 1.8, { align: "center" });
    // doc.setFontSize(4.8);
    // doc.text("* KOCHI-5 *", sealX, sealY + 2.0, { align: "center" });
    // doc.setFontSize(5.8);
    // doc.text("SEAL", sealX, sealY + 6.8, { align: "center" });
    // doc.restoreGraphicsState();

    nextY += 18; // signature space

    if (opt.signerName) {
      doc.setFont("times", "bold");
      doc.text(opt.signerName, ML, nextY);
      nextY += 4.5;
    }
    if (opt.signerTitle) {
      doc.setFont("times", "bold");
      doc.text(opt.signerTitle, ML, nextY);
      nextY += 10;
    }

    if (opt.ccList && opt.ccList.length > 0) {
      doc.setFont("times", "normal");
      doc.setFontSize(8);
      doc.text("cc: " + opt.ccList[0], ML, nextY);
      for (let i = 1; i < opt.ccList.length; i++) {
        nextY += 4;
        doc.text("    " + opt.ccList[i], ML, nextY);
      }
    }
  }

  // ════════════════════════════════════════════════════════
  //  PAGE NUMBERS
  // ════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("times", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(COLOR_MUTED);
    if (i === 1) {
      doc.text(`Page ${i} of ${totalPages}`, pw - MR, ph - 12, { align: "right" });
    } else {
      doc.text(`Page ${i} of ${totalPages}`, pw - MR, ph - 8, { align: "right" });
    }
  }

  doc.save(`Quotation_${q.quotationNo}.pdf`);
}
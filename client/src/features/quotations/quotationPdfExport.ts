import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Quotation } from "../../interfaces/quotation.interface";

const COLOR_TEXT = "#000000";
const COLOR_MUTED = "#555555";
const COLOR_BORDER = "#CCCCCC";
const COLOR_HEADER_BG = "#D9EAFD"; // Pastel blue header styling
const WHITE = "#FFFFFF";

const fmt = (n: number) => {
  const val = Math.round(n || 0);
  return val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = (dStr: string) => {
  const d = new Date(dStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export function exportQuotationToPdf(q: Quotation) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // Draw Page border
  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, pw - 20, ph - 20);

  // ─── Header Logo & Info ──────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#BE185D"); // Pink theme primary color for branding
  doc.text("CONTINENTAL", 15, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(COLOR_TEXT);
  doc.text("PROJECTS & FACILITIES", 15, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("A COMPLETE MEP SOLUTION", 15, 27);

  // Address and credentials on right
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED);
  doc.text("PAN NO: AALFC2396N", pw - 15, 20, { align: "right" });
  doc.text("Service Tax No: AALFC2396NSD001", pw - 15, 23.5, { align: "right" });
  doc.text("GSTIN: 32AALFC2396N2Z1", pw - 15, 27, { align: "right" });

  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.5);
  doc.line(15, 29, pw - 15, 29);

  // ─── Quotation Details Meta ──────────────────────────────
  let y = 35;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(COLOR_TEXT);
  doc.text(`Ref: ${q.quotationNo}`, 15, y);
  doc.text(`Date: ${fmtDate(q.date)}`, pw - 15, y, { align: "right" });

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("To,", 15, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(q.clientName, 15, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text("Dear Sir,", 15, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`Subject: Airconditioning works for ${q.clientName}.`, 15, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const introText = "With reference to the discussions, we are pleased to submit our offer for the airconditioning works, based on the following terms and conditions.";
  const splitIntro = doc.splitTextToSize(introText, pw - 30);
  doc.text(splitIntro, 15, y);
  y += splitIntro.length * 4.5 + 2;

  // I. Building & II. Equipment
  doc.setFont("helvetica", "bold");
  doc.text("I.  BUILDING :-", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Location: ${q.clientName}.`, 42, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("II. PROPOSED EQUIPMENT/ MATERIALS:-", 15, y);
  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.text("Type of Unit: Ductable Split Unit.", 20, y);
  y += 4;
  doc.text("Make: DAIKIN.", 20, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("III. SCOPE OF WORK WITH RATES :-", 15, y);

  // ─── Table Construction ──────────────────────────────────
  const machineItems = q.items.filter((i) => !i.section || i.section === "machine_side");
  const lowSideItems = q.items.filter((i) => i.section === "low_side");

  const rows: any[] = [];
  
  // A. Machine Side Section
  rows.push([{ content: "A. MACHINE SIDE:-", colSpan: 6, styles: { fontStyle: "bold", fillColor: "#F1F5F9" } }]);
  machineItems.forEach((item, idx) => {
    rows.push([
      `1.${idx + 1}`,
      item.description,
      item.unit || "No",
      item.qty.toString(),
      fmt(item.rate),
      fmt(item.qty * item.rate),
    ]);
  });
  const machineTotal = machineItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
  rows.push([
    { content: "TOTAL MACHINE SIDE COST (INR)", colSpan: 5, styles: { fontStyle: "bold", halign: "right" } },
    { content: fmt(machineTotal), styles: { fontStyle: "bold", halign: "right" } },
  ]);

  // B. Low Side Section
  if (lowSideItems.length > 0) {
    rows.push([{ content: "B. LOW SIDE WORKS:-", colSpan: 6, styles: { fontStyle: "bold", fillColor: "#F1F5F9" } }]);
    lowSideItems.forEach((item, idx) => {
      rows.push([
        `2.${idx + 1}`,
        item.description,
        item.unit || "Rmt",
        item.qty.toString(),
        fmt(item.rate),
        fmt(item.qty * item.rate),
      ]);
    });
    const lowSideTotal = lowSideItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
    rows.push([
      { content: "TOTAL LOW SIDE COST (INR)", colSpan: 5, styles: { fontStyle: "bold", halign: "right" } },
      { content: fmt(lowSideTotal), styles: { fontStyle: "bold", halign: "right" } },
    ]);
  }

  const subtotal = q.amount;
  const gst = q.gst;
  const grandTotal = q.total;

  autoTable(doc, {
    startY: y + 3,
    head: [["SL.NO", "DESCRIPTION", "UNIT", "QTY", "RATE", "AMOUNT"]],
    body: rows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      textColor: COLOR_TEXT,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: COLOR_HEADER_BG,
      textColor: COLOR_TEXT,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { halign: "left" },
      2: { halign: "center", cellWidth: 15 },
      3: { halign: "center", cellWidth: 15 },
      4: { halign: "right", cellWidth: 25 },
      5: { halign: "right", cellWidth: 30 },
    },
    margin: { left: 15, right: 15 },
  });

  let nextY = (doc as any).lastAutoTable.finalY + 8;

  // Check if summary fits page, otherwise add page
  if (nextY > ph - 80) {
    doc.addPage();
    doc.rect(10, 10, pw - 20, ph - 20);
    nextY = 20;
  }

  // Summary Table Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SUMMARY", 15, nextY);

  autoTable(doc, {
    startY: nextY + 2,
    body: [
      ["TOTAL FOR HIGH SIDE WORKS (AC MACHINES SUPPLY)", fmt(machineTotal)],
      ["TOTAL FOR LOW SIDE WORKS", fmt(q.total - machineTotal - q.gst)], // auto-compute low side base
      ["SUBTOTAL (EXCL. GST)", fmt(subtotal)],
      [`GST (${q.gstPercent}%)`, fmt(gst)],
      ["GRAND TOTAL WITH GST", fmt(grandTotal)],
    ],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 2,
      textColor: COLOR_TEXT,
      lineColor: COLOR_BORDER,
      lineWidth: 0.15,
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "left" },
      1: { fontStyle: "bold", halign: "right", cellWidth: 40 },
    },
    margin: { left: 15, right: 15 },
    didParseCell: (data) => {
      if (data.row.index === 4) {
        data.cell.styles.fillColor = COLOR_HEADER_BG;
      }
    },
  });

  nextY = (doc as any).lastAutoTable.finalY + 8;

  if (nextY > ph - 70) {
    doc.addPage();
    doc.rect(10, 10, pw - 20, ph - 20);
    nextY = 20;
  }

  // IV. NOTES & V. EXCLUSIONS & VI. VALIDITY
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("IV. NOTES & TERMS OF PAYMENT:-", 15, nextY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const notesText = 
    "1. Our offer is valid for a period of 15 days from the date of our offer.\n" +
    "2. Warranty: 12 months from the date of commissioning or 18 months from billing.\n" +
    "3. Terms of Payment:\n" +
    "   - 100% advance payment for A/C (High Side) unit along with P.O.\n" +
    "   - 50% advance payment for low side works.\n" +
    "   - 25% against delivery of materials at site.\n" +
    "   - 20% against erection of units, laying of copper pipes, installation of ducts & grills.\n" +
    "   - 5% prior to testing and commissioning.";
  doc.text(notesText, 15, nextY + 4);

  // Signatures
  const sigY = ph - 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Thanking you,", 15, sigY);
  doc.setFont("helvetica", "bold");
  doc.text("For Continental Projects & Facilities", 15, sigY + 4);

  doc.text("Sreejith Balan", 15, sigY + 16);
  doc.setFont("helvetica", "normal");
  doc.text("Sales Manager", 15, sigY + 20);

  // Save the PDF
  doc.save(`Quotation_${q.quotationNo}.pdf`);
}

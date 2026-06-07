import React, { useState, useEffect } from "react";
import { useAppSelector } from "../../../store/hooks";
import {
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  Save,
  Copy,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
  Settings,
  DollarSign,
  RefreshCw,
  MessageSquare,
  MessageSquarePlus,
  Pencil
} from "lucide-react";
// @ts-ignore
import XLSX from "xlsx-js-style";
import { toast } from "sonner";
import { Enquiry } from "../../../interfaces/enquiry.interface";
import { ICosting, ILowSideItem, IHighSideEquipment, IEstimateItem } from "../../../interfaces/costing.interface";
import {
  getCostingsByEnquiryIdApi,
  createCostingApi,
  updateCostingApi,
  createCostingRevisionApi,
  getCopperPipeRatesApi,
  syncCopperPipeRatesApi,
  createCopperPipeRateApi,
  updateCopperPipeRateApi,
  deleteCopperPipeRateApi,
  ICopperPipeRateConfig
} from "../../../api/costing.api";
import { calculateCosting, createDefaultCosting, getHvacTemplateItems, syncEstimatesToLowSide, normalizeSize } from "./CostingCalculator";
import { CostingPrintView } from "./CostingPrintView";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "../../../components/ui/popover";
import { exportCostingToExcel } from "./costingExcelExport";
import { exportCostingToPdf }   from "./costingPdfExport";


interface PercentageAndAmountInputProps {
  label: string;
  percentValue: number;
  baseValue: number;
  isProfitMode?: boolean;
  onPercentChange: (val: number) => void;
  onAmountChange: (val: number) => void;
}

const PercentageAndAmountInput = ({
  label,
  percentValue,
  baseValue,
  isProfitMode = false,
  onPercentChange,
  onAmountChange
}: PercentageAndAmountInputProps) => {
  let calculatedAmount = 0;
  if (isProfitMode) {
    calculatedAmount = Math.round((baseValue / (1 - percentValue)) - baseValue);
  } else {
    calculatedAmount = Math.round(baseValue * percentValue);
  }
  const percentDisplay = (percentValue * 100).toFixed(2);

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{label}</label>
      <div className="flex gap-2">
        {/* Percentage Input */}
        <div className="relative flex-1">
          <input
            type="number"
            step="0.01"
            value={parseFloat(percentDisplay) || 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              onPercentChange(val / 100);
            }}
            className="h-9 w-full rounded border border-border bg-white pl-3 pr-6 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <span className="absolute right-2.5 top-2 text-xs text-muted-foreground font-bold">%</span>
        </div>
        {/* Flat Amount Input */}
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-bold">â‚¹</span>
          <input
            type="number"
            value={calculatedAmount || 0}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              if (isProfitMode) {
                const newPercent = val + baseValue > 0 ? val / (val + baseValue) : 0;
                onAmountChange(newPercent);
              } else {
                const newPercent = baseValue > 0 ? val / baseValue : 0;
                onAmountChange(newPercent);
              }
            }}
            className="h-9 w-full rounded border border-border bg-white pl-6 pr-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// REMARK CELL â€“ reusable icon button + modal for adding/editing notes
// ---------------------------------------------------------------------------
interface RemarkCellProps {
  remark: string | undefined;
  onSave: (remark: string) => void;
}

interface AutoResizeTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  className: string;
  placeholder: string;
}

const AutoResizeTextarea = ({ value, onChange, onFocus, className, placeholder }: AutoResizeTextareaProps) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      className={className}
      placeholder={placeholder}
      rows={1}
    />
  );
};

const RemarkCell = ({ remark, onSave }: RemarkCellProps) => {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(remark || "");

  const handleOpen = () => { setDraft(remark || ""); setOpen(true); };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Hover tooltip using Popover (portal-rendered â€” escapes table overflow) */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={handleOpen}
            className={`p-1.5 rounded transition duration-150 ${
              remark
                ? "text-blue-500 hover:text-blue-700 hover:bg-blue-50/50"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
            }`}
          >
            {remark
              ? <MessageSquare className="h-4 w-4" />
              : <MessageSquarePlus className="h-4 w-4" />}
          </button>
        </PopoverTrigger>
        {remark && (
          <PopoverContent
            side="top"
            align="center"
            sideOffset={6}
            className="w-52 p-2.5 text-xs z-50 pointer-events-none"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <div className="font-bold text-muted-foreground mb-1 text-[10px] uppercase tracking-wider">Remark:</div>
            <div className="break-words leading-relaxed font-semibold text-foreground">{remark}</div>
          </PopoverContent>
        )}
      </Popover>

      {/* Edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-card rounded-xl border border-border p-5 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-sm font-bold text-card-foreground mb-3">
              {remark ? "Edit Remark" : "Add Remark"}
            </h4>
            <textarea
              autoFocus
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
              placeholder="Enter a note or remark..."
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setOpen(false)}
                className="px-3 h-8 text-xs font-bold border border-border text-foreground hover:bg-muted rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => { onSave(draft.trim()); setOpen(false); }}
                className="px-3 h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const autoFitColumns = (ws: any, descCols: number[] = [], minWidths: number[] = []) => {
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
        if (cell.f && !cell.v) {
          valStr = "123,456.00";
        }
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      }
    }
    const isDesc = descCols.includes(C);
    const limit = isDesc ? 25 : 18;
    cols.push({ wch: Math.min(limit, maxLen + 3) });
  }
  ws["!cols"] = cols;
};

const isRowSummary = (ws: any, R: number, range: any) => {
  for (let C = 0; C <= 1; ++C) {
    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
    if (cell && typeof cell.v === "string") {
      const valLower = cell.v.toLowerCase().trim();
      if (
        valLower.startsWith("total") ||
        valLower.startsWith("subtotal") ||
        valLower.startsWith("sub total") ||
        valLower.startsWith("sub-total") ||
        valLower.startsWith("project value") ||
        valLower.startsWith("final value") ||
        valLower.startsWith("final project value") ||
        valLower.startsWith("invoiced value") ||
        valLower.startsWith("grand total") ||
        valLower === "gst" ||
        valLower === "over head" ||
        valLower.startsWith("profit")
        // NOTE: "freight" removed â€” Freight is a calculation row in estimates, not a grand-total summary
      ) {
        return true;
      }
    }
  }
  return false;
};

const createCompanyHeader = (sheetTitle: string, costing: any) => {
  return [
    [], // Row 1
    ["CONTINENTAL - SERVICE MANAGEMENT SYSTEM"], // Row 2
    [sheetTitle], // Row 3
    [], // Row 4
    ["Enquiry No:", costing.enquiryNo, "Date:", new Date(costing.date).toLocaleDateString(), "Location:", costing.location, "TR:", { v: costing.totalTR, t: "n", z: "0.0" }], // Row 5
    ["Project Name:", costing.projectName, "Type of Unit:", costing.unitType, "Make:", costing.make, "", ""], // Row 6
    ["Prepared By:", costing.preparedBy, "Approved By:", costing.approvedBy || "Admin", "", "", "", ""], // Row 7
    [] // Row 8
  ];
};

const addRevisionFooter = (data: any[], costing: any) => {
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

const applyWorksheetStyles = (ws: any, tabType: "summary" | "highside" | "lowside" | "estimates" | "copper_pipes", eqLen = 0, lsLen = 0, acctStartRow = 0) => {
  if (!ws) return;
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
  
  // Set freeze panes for top 9 rows
  ws["!views"] = [{ state: "frozen", ySplit: 9 }];
  
  // Enable protection: formulas and headers locked, inputs unlocked
  ws["!protect"] = { selectLockedCells: true, selectUnlockedCells: true };

  for (let R = range.s.r; R <= range.e.r; ++R) {
    const rowNum = R + 1;
    const isSummaryRow = isRowSummary(ws, R, range);

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = ws[cellRef];
      if (!cell) continue;

      // Determine standard text/number alignment & font
      cell.s = {
        font: { name: "Segoe UI", sz: 9, color: { rgb: "334155" } },
        alignment: { vertical: "center", horizontal: "left", wrapText: false },
        border: {
          top: { style: "thin", color: { rgb: "CBD5E1" } },
          bottom: { style: "thin", color: { rgb: "CBD5E1" } },
          left: { style: "thin", color: { rgb: "CBD5E1" } },
          right: { style: "thin", color: { rgb: "CBD5E1" } }
        }
      };

      // Wrap text in description column (Column B, index 1; or column A in estimates/copper)
      if (C === 1 || (tabType === "estimates" && C === 3) || (tabType === "copper_pipes" && C === 0)) {
        cell.s.alignment.wrapText = true;
      }

      // Format numeric values
      if (cell.t === "n") {
        cell.s.alignment.horizontal = "center"; // Center numbers as requested
        if (!cell.z) {
          const val = cell.v;
          if (typeof val === "number") {
            if (val > 0 && val <= 1 && (cellRef.includes("D") || cellRef.includes("F") || cellRef.includes("G") || cellRef.includes("H") || cellRef.includes("I") || cellRef.includes("J") || cellRef.includes("K"))) {
              cell.z = "0.0%";
            } else if (val > 5 && C >= 2) {
              // Only apply â‚¹ format from column C onwards â€” columns A (Sr.No) and B (Description)
              // are never monetary values. Without this guard, Sr.No 6, 7, 8, 9 render as â‚¹6, â‚¹7â€¦
              cell.z = "â‚¹#,##0";
            } else {
              cell.z = "0";
            }
          }
        }
      } else if (cell.t === "s" && typeof cell.v === "string") {
        if (/^\d+$/.test(cell.v)) {
          cell.s.alignment.horizontal = "center";
        }
      }

      // â”€â”€ Reference theme: Banner rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Row 2: Sheet-title banner â†’ bright green #00B050 (matches reference exactly)
      if (rowNum === 2) {
        cell.s.font = { name: "Calibri", sz: 12, bold: true, color: { rgb: "FFFFFF" } };
        cell.s.fill = { fgColor: { rgb: "00B050" } }; // Reference green
        cell.s.alignment = { vertical: "center", horizontal: "center" };
      } else if (rowNum === 3) {
        // Row 3: Sub-title banner â†’ same green, white bold text
        cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } };
        cell.s.fill = { fgColor: { rgb: "00B050" } }; // Reference green
        cell.s.alignment = { vertical: "center", horizontal: "center" };
      } else if (rowNum >= 5 && rowNum <= 7) {
        // Rows 5-7: Project info (label / value alternating)
        if (C === 0 || C === 2 || C === 4 || C === 6) {
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "595959" } };
          cell.s.alignment = { vertical: "center", horizontal: "left" };
        } else if (C === 1 || C === 3 || C === 5 || C === 7) {
          cell.s.font = { name: "Calibri", sz: 9, color: { rgb: "1E293B" } };
          cell.s.alignment = { vertical: "center", horizontal: "left" };
        }
      }

      // Table Header Rows
      const ESTIMATE_HEADER_VALUES = new Set([
        // Generic headers
        "Description", "UR", "Qty", "Unit", "Total",
        // Section 7 â€“ GSS Ducting
        "Desc.", "Qty (Sq.m)", "No. Of Sheet", "Wt/Sheet", "Total Wt", "Rate/Kg", "Rate/SqMtr",
        // Section 8 â€“ Air Terminals
        "Grill Size/Desc", "Grill Size", "Area (Sq.ft)", "Rate/Sq. ft",
        // Section 9 â€“ Eyeball Diffuser
        "Rate",
      ]);
      const isTableHeaderRow = 
        ((tabType === "summary" || tabType === "highside") && rowNum === 10) ||
        (tabType === "lowside" && (rowNum === 10 || rowNum === 11)) ||
        (tabType === "estimates" && ESTIMATE_HEADER_VALUES.has(cell.v as string)) ||
        (tabType === "copper_pipes" && (cell.v === "CU PIPE SIZES" || cell.v === "RATE" || cell.v === "SLEEVES" || cell.v === "UNIT" || cell.v === "TOTAL" || cell.v === "ADD 10 % ACCESR" || cell.v === "REMARKS"));

      if (isTableHeaderRow) {
        // Reference: light-blue #93CDDD with dark text (NOT white-on-dark)
        cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
        cell.s.fill = { fgColor: { rgb: "93CDDD" } }; // Reference light blue
        cell.s.alignment = { vertical: "center", horizontal: "center" };
      }

      // â”€â”€ Summary rows (Total, Sub Total, Grand Total, Project Value, Final Value) â”€â”€
      // Reference: soft blue #95B3D7 (accounts section gets yellow override below)
      if (isSummaryRow && rowNum > 8) {
        cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
        cell.s.fill = { fgColor: { rgb: "95B3D7" } }; // Reference soft blue
        const cellValLower = String(cell.v || "").toLowerCase();
        if (cellValLower.includes("final project value") || cellValLower.includes("final value with tax") || cellValLower.includes("price per tr")) {
          cell.s.border.bottom = { style: "double", color: { rgb: "00B050" } };
        }
      }

      // â”€â”€ HIGH SIDE: Accounts section â†’ yellow #FFFF00 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // The accounts section (stacked below engineering) gets yellow background
      // on its title, header, and all summary/total rows â€” matching the reference
      // yellow band applied to the accounts columns (H-K) in the original.
      if (tabType === "highside" && acctStartRow > 0 && rowNum >= acctStartRow) {
        if (rowNum === acctStartRow) {
          // Accounts title row: "HIGH SIDE ACTUAL EXPENSES (ACCOUNTS DEPT)"
          cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
          cell.s.alignment = { vertical: "center", horizontal: "center" };
        } else if (rowNum === acctStartRow + 1) {
          // Accounts column-header row (Sr.No, Equipment Description, Material Costâ€¦)
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
          cell.s.alignment = { vertical: "center", horizontal: "center" };
        } else if (isSummaryRow) {
          // Sub Total / Grand Total / Invoiced Value / Final Value in accounts
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
        }
      }

      // â”€â”€ LOW SIDE: Accounts columns (J-M, indices 9-12) â†’ yellow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Reference uses yellow on the ACTUAL EXPENSE header columns and total rows
      if (tabType === "lowside" && C >= 9 && C <= 12) {
        if (rowNum === 9 || rowNum === 10) {
          // Header rows: "ACCOUNTS ACTUAL EXPENSE" / "Material", "Labour", "MISC", "Total"
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
          cell.s.alignment = { vertical: "center", horizontal: "center" };
        } else if (isSummaryRow && rowNum > 10) {
          // Total / Sub Total / Grand Total / Project Value / Final Value in accounts cols
          cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          cell.s.fill = { fgColor: { rgb: "FFFF00" } };
        }
      }

      // â”€â”€ MATERIAL SUMMARY: Section / sub-section title styling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Reference has NO colored fills on section titles â€” just bold text + borders.
      if (tabType === "estimates" && rowNum > 8) {
        const titleCell = ws[XLSX.utils.encode_cell({ r: R, c: 0 })];
        if (titleCell && typeof titleCell.v === "string") {
          const desc = titleCell.v;
          // IMPORTANT: Use \.\s (dot + space) not just \. so decimal numbers like
          // "0.875", "0.5", "1.125" (pipe sizes) are NOT matched as section headers.
          // "1. Installation" has a space â†’ matches. "0.875" has no space â†’ does NOT match.
          const isNumberedSection = /^\d+\.\s/.test(desc);   // "1. Installation", "7. Ductingâ€¦"
          const isLetterSection   = /^[a-d]\.\s/.test(desc); // "a. GSS Ducting", "b. Thermalâ€¦"
          const isTotalForRow     = desc.startsWith("Total for") || desc === "Total";
          if (isNumberedSection) {
            // Bold, slightly larger text, blue top+bottom border â€” NO fill
            // (cell.s.fill = {} renders as BLACK in xlsx-js-style â€” must use patternType:"none")
            cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: "1E293B" } };
            cell.s.fill = { patternType: "none" }; // Explicit "no fill" â€” avoids black default
            cell.s.border.bottom = { style: "thin", color: { rgb: "93CDDD" } };
            cell.s.border.top    = { style: "thin", color: { rgb: "93CDDD" } };
          } else if (isLetterSection) {
            // Italic bold text, no fill
            cell.s.font = { name: "Calibri", sz: 9, bold: true, italic: true, color: { rgb: "1E293B" } };
            cell.s.fill = { patternType: "none" }; // Explicit "no fill"
          } else if (isTotalForRow) {
            cell.s.font = { name: "Calibri", sz: 9, bold: true, color: { rgb: "1E293B" } };
          }
        }
      }

      // Copper pipe rates special headers â€” use reference green
      if (tabType === "copper_pipes" && (cell.v === "HARD PIPES" || cell.v === "SOFT PIPES")) {
        cell.s.font = { name: "Calibri", sz: 10, bold: true, color: { rgb: "FFFFFF" } };
        cell.s.fill = { fgColor: { rgb: "00B050" } }; // Reference green
        cell.s.alignment = { vertical: "center", horizontal: "center" };
      }

      // Locked / Unlocked cells protection
      let locked = true;
      const isHeaderArea = rowNum <= 9;
      if (!isHeaderArea && !isSummaryRow && cell.f === undefined && !isTableHeaderRow) {
        locked = false;
      }
      cell.s.protection = { locked };
    }
  }
};

interface CostingTabProps {
  enquiry: Enquiry;
}

export function CostingTab({ enquiry }: CostingTabProps) {
  const [costings, setCostings] = useState<ICosting[]>([]);
  const [activeCosting, setActiveCosting] = useState<ICosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "highside" | "lowside" | "estimates" | "copper_pipes">("summary");
  const [copperPipeRates, setCopperPipeRates] = useState<ICopperPipeRateConfig[]>([]);

  // Copper pipe rates modals states
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateModalMode, setRateModalMode] = useState<"add" | "edit">("add");
  const [selectedRate, setSelectedRate] = useState<ICopperPipeRateConfig | null>(null);
  const [rateForm, setRateForm] = useState<Partial<ICopperPipeRateConfig>>({
    size: "",
    type: "hard",
    rate: 0,
    sleeveRate: 0,
    unit: "M",
    remarks: ""
  });
  const [isDeleteRateConfirmOpen, setIsDeleteRateConfirmOpen] = useState(false);

  
  // Collapsible estimates sections states
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [activeSuggestionRow, setActiveSuggestionRow] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { user } = useAppSelector((state) => state.auth);

  const detailedEstimatorSuggestions = React.useMemo(() => {
    if (!activeCosting) return [];
    const est = activeCosting.lowSide.materialEstimate;
    const list: { description: string; qty: number; unit: string; ur: number; category: string }[] = [];

    if (est) {
      // 1. Installation
      (est.installation?.items || []).forEach(item => {
        if (item.description) list.push({ description: item.description, qty: item.qty || 0, unit: item.unit || "Lot", ur: item.ur || 0, category: "installation" });
      });
      
      // 2. Testing
      (est.testingCommissioning?.items || []).forEach(item => {
        if (item.description) list.push({ description: item.description, qty: item.qty || 0, unit: item.unit || "Cylinder", ur: item.ur || 0, category: "testing" });
      });

      // 3. Copper Pipes & accessories
      (est.refPiping?.copperPipes || []).forEach(pipe => {
        if (pipe.size) {
          list.push({
            description: `Copper Pipe ${pipe.size} (${pipe.type || "hard"})`,
            qty: pipe.qty || 0,
            unit: "Rmt",
            ur: pipe.ur || 0,
            category: "ref_piping"
          });
        }
      });
      (est.refPiping?.accessories || []).forEach(item => {
        if (item.description) list.push({ description: item.description, qty: item.qty || 0, unit: item.unit || "Lot", ur: item.ur || 0, category: "ref_piping" });
      });

      // 4 & 5. Cabling
      (est.controlCabling?.cables || []).forEach(cable => {
        if (cable.size) {
          list.push({
            description: `Control Cable ${cable.size}`,
            qty: cable.qty || 0,
            unit: "Rmt",
            ur: cable.ur || 0,
            category: "control_cabling"
          });
        }
      });
      (est.powerCabling?.cables || []).forEach(cable => {
        if (cable.size) {
          list.push({
            description: `Power Cable ${cable.size}`,
            qty: cable.qty || 0,
            unit: "Rmt",
            ur: cable.ur || 0,
            category: "power_cabling"
          });
        }
      });

      // 6. Drain Piping
      (est.drainPiping?.pvcPipes || []).forEach(pipe => {
        if (pipe.size) {
          list.push({
            description: `PVC Drain Pipe ${pipe.size}`,
            qty: pipe.qty || 0,
            unit: "Rmt",
            ur: pipe.ur || 0,
            category: "drain_piping"
          });
        }
      });
      (est.drainPiping?.accessories || []).forEach(item => {
        if (item.description) list.push({ description: item.description, qty: item.qty || 0, unit: item.unit || "Lot", ur: item.ur || 0, category: "drain_piping" });
      });

      // 7. GSS Ducting & Insulation
      (est.ducting?.gssDucting || []).forEach(d => {
        if (d.gauge) {
          list.push({
            description: `GSS Ducting ${d.gauge}`,
            qty: d.qtySqMtr || 0,
            unit: "Sq.mtr",
            ur: d.ur || 0,
            category: "ducting"
          });
        }
      });
      const thermalInsSqMtr = est.ducting?.gssDucting?.find(d => d.gauge.includes("24"))?.qtySqMtr || 0;
      const acousticInsSqMtr = est.ducting?.gssDucting?.find(d => d.gauge.includes("22"))?.qtySqMtr || 0;
      list.push({
        description: "Thermal Insulation for GSS Ducting",
        qty: thermalInsSqMtr,
        unit: "Sq.mtr",
        ur: est.ducting?.thermalInsulationUR || 0,
        category: "ducting"
      });
      list.push({
        description: "Acoustic Insulation for GSS Ducting",
        qty: acousticInsSqMtr,
        unit: "Sq.mtr",
        ur: est.ducting?.acousticInsulationUR || 0,
        category: "ducting"
      });
      (est.ducting?.accessories || []).forEach(item => {
        if (item.description) list.push({ description: item.description, qty: item.qty || 0, unit: item.unit || "Lot", ur: item.ur || 0, category: "ducting" });
      });
      
      // 8. Air Terminals â€“ dynamic items
      (est.airTerminals?.items || []).forEach(item => {
        if (item.description) list.push({ description: item.description, qty: item.qty || 0, unit: item.unit || "Nos", ur: item.ur || 0, category: "air_terminals" });
      });

      // 9. Eyeball Diffusers â€“ dynamic items
      (est.eyeballDiffuser?.items || []).forEach(item => {
        if (item.description) list.push({ description: item.description, qty: item.qty || 0, unit: item.unit || "Nos", ur: item.ur || 0, category: "eyeball_diffusers" });
      });

      // 10. ODU Stands â€“ dynamic items
      (est.oduStand?.items || []).forEach(item => {
        if (item.description) list.push({ description: item.description, qty: item.qty || 0, unit: item.unit || "Nos", ur: item.ur || 0, category: "odu_stands" });
      });

      // 11. PVC Casing Caps â€“ dynamic items
      (est.pvcCasingCap?.items || []).forEach(item => {
        if (item.description) list.push({ description: item.description, qty: item.qty || 0, unit: item.unit || "Rmt", ur: item.ur || 0, category: "pvc_casing_caps" });
      });
    }

    return list;
  }, [activeCosting]);

  const getRowCategory = (srNo: number, description: string): string => {
    const desc = (description || "").toLowerCase();
    if (desc.includes("installation")) return "installation";
    if (desc.includes("testing") || desc.includes("commissioning")) return "testing";
    if (desc.includes("ref. piping") || (desc.includes("piping") && (desc.includes("copper") || desc.includes("ref")))) return "ref_piping";
    if (desc.includes("control cabling") || (desc.includes("cabling") && desc.includes("control"))) return "control_cabling";
    if (desc.includes("power cabling") || (desc.includes("cabling") && desc.includes("power"))) return "power_cabling";
    if (desc.includes("drain piping") || (desc.includes("piping") && desc.includes("drain"))) return "drain_piping";
    if (desc.includes("gas charging") || desc.includes("refrigerant")) return "ref_piping";
    if (desc.includes("ducting") || desc.includes("gss") || desc.includes("insulation")) return "ducting";
    if (desc.includes("air terminal") || desc.includes("grill") || desc.includes("damper") || desc.includes("diffuser")) {
      if (desc.includes("eyeball")) return "eyeball_diffusers";
      return "air_terminals";
    }
    if (desc.includes("eyeball")) return "eyeball_diffusers";
    if (desc.includes("odu stand") || desc.includes("stand")) return "odu_stands";
    if (desc.includes("casing") || desc.includes("cap")) return "pvc_casing_caps";

    switch (srNo) {
      case 1: return "installation";
      case 2: return "testing";
      case 3: return "ref_piping";
      case 4: return "control_cabling";
      case 5: return "power_cabling";
      case 6: return "drain_piping";
      case 7: return "ref_piping"; // R32 Gas Charging
      case 8: return "ducting";
      case 9: return "air_terminals";
      case 10: return "odu_stands";
      case 11: return "pvc_casing_caps";
      default: return "";
    }
  };
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approverName, setApproverName] = useState("");
  useEffect(() => {
    if (user?.name) {
      setApproverName(user.name);
    }
  }, [user]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatPercent = (val: number) => {
    return `${((val || 0) * 100).toFixed(1)}%`;
  };

  const loadCopperPipeRates = async () => {
    try {
      const res = await getCopperPipeRatesApi();
      if (res.success) {
        setCopperPipeRates(res.data);
      }
    } catch (err) {
      console.error("Failed to load copper pipe rates", err);
    }
  };

  const handleSaveCopperPipeRates = async () => {
    try {
      const res = await syncCopperPipeRatesApi(copperPipeRates);
      if (res.success) {
        toast.success("Copper pipe rates saved successfully!");
        setCopperPipeRates(res.data);
      }
    } catch (err) {
      console.error("Failed to save copper pipe rates", err);
      toast.error("Failed to save copper pipe rates");
    }
  };

  const loadCostings = async () => {
    if (!enquiry.id) return;
    setIsLoading(true);
    try {
      const res = await getCostingsByEnquiryIdApi(enquiry.id);
      if (res.success && res.data.length > 0) {
        setCostings(res.data);
        // Set active to the currently active costing, or the latest revision
        const active = res.data.find((c) => c.isActive) || res.data[0];
        setActiveCosting(calculateCosting(active));
      } else {
        setCostings([]);
        setActiveCosting(null);
      }
    } catch (err) {
      console.error("Failed to load costing sheets", err);
      toast.error("Failed to load costing sheets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCostings();
    loadCopperPipeRates();
  }, [enquiry.id]);

  const handleCreateCosting = async () => {
    if (!enquiry.id) return;
    setIsSaving(true);
    try {
      // Extract capacity from description or default to 0
      let trCapacity = 0;
      const trMatch = enquiry.description?.match(/(\d+(?:\.\d+)?)\s*(?:TR|tons)/i);
      if (trMatch) {
        trCapacity = parseFloat(trMatch[1]);
      }

      const minimalObj = {
        enquiryId: enquiry.id,
        enquiryNo: enquiry.enquiryNo,
        clientId: enquiry.clientId,
        clientName: enquiry.clientName,
        projectName: enquiry.requirement || "AC Installation",
        location: enquiry.description?.includes("Aluva") ? "Aluva" : "Kochi",
        totalTR: trCapacity,
        preparedBy: user?.name || "Admin",
      };

      const res = await createCostingApi(minimalObj);
      if (res.success) {
        toast.success("Costing sheet generated successfully!");
        loadCostings();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate costing sheet");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCosting = async () => {
    if (!activeCosting?.id) return;
    setIsSaving(true);
    try {
      // Re-run calculations just before saving to ensure state consistency
      const finalCalculated = calculateCosting(activeCosting);
      const res = await updateCostingApi(activeCosting.id, finalCalculated);
      if (res.success) {
        setActiveCosting(res.data);
        toast.success("Costing sheet saved successfully!");
        // Reload list to update labels
        const listRes = await getCostingsByEnquiryIdApi(enquiry.id!);
        if (listRes.success) setCostings(listRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save costing sheet");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!activeCosting?.id) return;
    setIsCloning(true);
    try {
      const res = await createCostingRevisionApi(activeCosting.id);
      if (res.success) {
        toast.success(`Created revision Rev ${res.data.revision} successfully!`);
        loadCostings();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create costing revision");
    } finally {
      setIsCloning(false);
    }
  };

  // Recalculates dynamically on field change
  const handleFieldChange = (updater: (draft: ICosting) => void) => {
    if (!activeCosting) return;
    const clone = JSON.parse(JSON.stringify(activeCosting)) as ICosting;
    updater(clone);

    const calculated = calculateCosting(clone);
    setActiveCosting(calculated);
  };

  const handleManualSync = () => {
    if (!activeCosting) return;
    const synced = syncEstimatesToLowSide(activeCosting);
    setActiveCosting(synced);
    toast.success("Synced estimates to Low Side successfully!");
  };

  const handleExportExcel = () => {
    if (!activeCosting) return;
    try {
      exportCostingToExcel(activeCosting);
      toast.success("Excel sheet downloaded successfully!");
    } catch (err) {
      console.error("Excel export failed:", err);
      toast.error("Excel export failed. Please try again.");
    }
  };

  const handleExportPDF = () => {
    if (!activeCosting) return;
    try {
      exportCostingToPdf(activeCosting);
      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("PDF export failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-pink-700" />
        <span>Loading costing records...</span>
      </div>
    );
  }


  // --- WELCOME STATE ---
  if (!activeCosting) {
    return (
      <div className="bg-card rounded-xl border border-dashed border-border/80 p-12 text-center shadow-sm">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground mb-1">No Costing Sheet Found</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
          This enquiry does not have any costings configured. Generate a costing sheet templates to start calculating
          high-side equipment markups and detailed low-side installation summaries.
        </p>
        <button
          onClick={handleCreateCosting}
          disabled={isSaving}
          className="bg-pink-700 hover:bg-pink-800 text-white font-bold h-9 px-4 rounded-lg shadow-sm transition duration-200 flex items-center gap-1.5 mx-auto text-xs"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Generate Costing Sheet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* COSTING PRINT VIEW (HIDDEN IN SCREEN, SHOWN ONLY IN PRINT) */}
      <CostingPrintView costing={activeCosting} copperPipeRates={copperPipeRates} />

      {/* TOP HEADER CONTROLS (SCREEN ONLY) */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Costing Revision:</label>
          <select
            value={activeCosting.id}
            onChange={(e) => {
              const selected = costings.find((c) => c.id === e.target.value);
              if (selected) setActiveCosting(selected);
            }}
            className="h-9 rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground"
          >
            {costings.map((c) => (
              <option key={c.id} value={c.id}>
                Rev {c.revision} {c.isActive ? "(Active)" : ""}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreateRevision}
            disabled={isCloning}
            className="flex items-center gap-1 text-xs font-bold px-3.5 h-9 rounded-lg border border-border text-foreground hover:bg-muted"
          >
            {isCloning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Clone Revision
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
          {activeCosting.approvedBy ? (
            <div className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-green-200 bg-green-50 text-green-700">
              Approved by: {activeCosting.approvedBy}
            </div>
          ) : (
            <button
              onClick={() => setIsApproveModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              Approve Costing
            </button>
          )}
          <button
            onClick={handleSaveCosting}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg bg-pink-700 hover:bg-pink-850 text-white"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="bg-card rounded-xl border border-border overflow-hidden print:hidden">
        <div className="border-b border-border/50 bg-muted/40 p-1.5">
          <div className="flex gap-2">
            {[
              { id: "summary", label: "Cost Summary" },
              { id: "highside", label: "High-Side Works" },
              { id: "lowside", label: "Low-Side Works" },
              { id: "estimates", label: "Materials Summary" },
              { id: "copper_pipes", label: "Copper Pipe Rates" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-5 rounded-lg text-sm font-bold transition duration-200 ${
                  activeTab === tab.id
                    ? "bg-pink-700 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              {/* METADATA FORM */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-border">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Name</label>
                  <input
                    type="text"
                    value={activeCosting.projectName}
                    onChange={(e) => handleFieldChange((c) => { c.projectName = e.target.value; })}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    value={activeCosting.location}
                    onChange={(e) => handleFieldChange((c) => { c.location = e.target.value; })}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prepared By</label>
                  <input
                    type="text"
                    value={activeCosting.preparedBy}
                    onChange={(e) => handleFieldChange((c) => { c.preparedBy = e.target.value; })}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approved By</label>
                  <input
                    type="text"
                    value={activeCosting.approvedBy}
                    readOnly
                    className="mt-1 h-9 w-full rounded border border-border bg-muted/40 px-3 text-sm font-medium text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Make (Daikin/Volt/etc)</label>
                  <input
                    type="text"
                    value={activeCosting.make}
                    onChange={(e) => handleFieldChange((c) => { c.make = e.target.value; })}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit Type (Ductable/etc)</label>
                  <input
                    type="text"
                    value={activeCosting.unitType}
                    onChange={(e) => handleFieldChange((c) => { c.unitType = e.target.value; })}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Capacity (TR)</label>
                  <input
                    type="number"
                    value={activeCosting.totalTR}
                    onChange={(e) => handleFieldChange((c) => { c.totalTR = parseFloat(e.target.value) || 0; })}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* DASHBOARD SUMMARY CARD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-pink-50/20 border border-pink-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-pink-100/10 rounded-bl-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-pink-700" />
                  </div>
                  <span className="text-xs font-bold text-pink-700 uppercase tracking-wider block">Total Quotation Value (Excl Tax)</span>
                  <span className="text-2xl font-extrabold text-slate-800 mt-2 block">{formatCurrency(activeCosting.summary.totalProjectValueExclTax)}</span>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span>High Side: {formatCurrency(activeCosting.summary.highSideProjectValueExclTax)}</span>
                    <span>Low Side: {formatCurrency(activeCosting.summary.lowSideProjectValueExclTax)}</span>
                  </div>
                </div>

                <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Est. Cost of Expense (Excl Tax)</span>
                  <span className="text-2xl font-extrabold text-slate-800 mt-2 block">{formatCurrency(activeCosting.summary.totalExpenseExclTax)}</span>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span>High Side: {formatCurrency(activeCosting.summary.highSideTotalExpenseExclTax)}</span>
                    <span>Low Side: {formatCurrency(activeCosting.summary.lowSideTotalExpenseExclTax)}</span>
                  </div>
                </div>

                <div className="bg-green-50/20 border border-green-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wider block">Calculated Profit (Margin %)</span>
                  <span className="text-2xl font-extrabold text-slate-800 mt-2 block">
                    {formatCurrency(activeCosting.summary.totalProfit)}{" "}
                    <span className="text-sm font-semibold text-green-600">({formatPercent(activeCosting.summary.totalProfitPercent / 100)})</span>
                  </span>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span>High Side: {formatPercent(activeCosting.summary.highSideProfitPercent / 100)}</span>
                    <span>Low Side: {formatPercent(activeCosting.summary.lowSideProfitPercent / 100)}</span>
                  </div>
                </div>
              </div>

              {/* DETAILED SUMMARY GRID */}
              <div className="border border-border/80 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b border-border/60">
                      <th className="p-3">Section Description</th>
                      <th className="p-3 text-right">Project Value (Excl Tax)</th>
                      <th className="p-3 text-right">Total Expense</th>
                      <th className="p-3 text-right">Overhead</th>
                      <th className="p-3 text-right">Profit</th>
                      <th className="p-3 text-right">Margin %</th>
                      <th className="p-3 text-right">Final Value (with Tax)</th>
                      <th className="p-3 text-right">Rate / TR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">High-Side Equipment</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.highSideProjectValueExclTax)}</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.highSideTotalExpenseExclTax)}</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.highSideOverhead)}</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.highSideProfit)}</td>
                      <td className="p-3 text-right text-green-600">{formatPercent(activeCosting.summary.highSideProfitPercent / 100)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(activeCosting.summary.highSideTotalPriceInclTax)}</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.highSidePricePerTR)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">Low-Side Contracting</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.lowSideProjectValueExclTax)}</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.lowSideTotalExpenseExclTax)}</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.lowSideOverhead)}</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.lowSideProfit)}</td>
                      <td className="p-3 text-right text-green-600">{formatPercent(activeCosting.summary.lowSideProfitPercent / 100)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(activeCosting.summary.lowSideTotalPriceInclTax)}</td>
                      <td className="p-3 text-right">{formatCurrency(activeCosting.summary.lowSidePricePerTR)}</td>
                    </tr>
                    <tr className="bg-muted/40 font-bold border-t border-border/80 text-sm">
                      <td className="p-3 text-slate-900">Total Project</td>
                      <td className="p-3 text-right text-slate-900">{formatCurrency(activeCosting.summary.totalProjectValueExclTax)}</td>
                      <td className="p-3 text-right text-slate-900">{formatCurrency(activeCosting.summary.totalExpenseExclTax)}</td>
                      <td className="p-3 text-right text-slate-900">{formatCurrency(activeCosting.summary.totalOverhead)}</td>
                      <td className="p-3 text-right text-slate-900">{formatCurrency(activeCosting.summary.totalProfit)}</td>
                      <td className="p-3 text-right text-green-600">{formatPercent(activeCosting.summary.totalProfitPercent / 100)}</td>
                      <td className="p-3 text-right text-pink-700 font-extrabold">{formatCurrency(activeCosting.summary.totalPriceInclTax)}</td>
                      <td className="p-3 text-right text-slate-900">{formatCurrency(activeCosting.summary.totalPricePerTR)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: HIGH SIDE WORKS */}
          {activeTab === "highside" && (() => {
            const hsSubtotal = activeCosting.highSide.equipment.reduce((sum, eq) => sum + (eq.qty * eq.unitRate), 0);
            const hsCpfTotal = activeCosting.highSide.equipment.reduce((sum, eq) => {
              const pct = eq.cpfMarkupPercent ?? 16;
              return sum + (eq.qty * eq.unitRate * (1 + pct / 100));
            }, 0);
            const hsDesign = hsSubtotal * activeCosting.highSide.designPercent;
            const hsWarranty = hsSubtotal * activeCosting.highSide.warrantyPercent;
            const hsTrans = hsSubtotal * activeCosting.highSide.transportationPercent;
            const hsUnload = hsSubtotal * activeCosting.highSide.unloadingPercent;
            const hsBank = hsSubtotal * activeCosting.highSide.bankChargesPercent;
            const hsComm = hsSubtotal * activeCosting.highSide.commissionPercent;
            const hsSubTotalOverhead = hsSubtotal + hsDesign + hsWarranty + hsTrans + hsUnload + hsBank + hsComm;
            const hsOverhead = hsSubTotalOverhead * activeCosting.highSide.overheadPercent;
            const hsGrandTotal = hsSubTotalOverhead + hsOverhead;

            return (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">High Side Equipment List</h3>
                  <button
                    onClick={() => handleFieldChange((c) => {
                      c.highSide.equipment.push({ description: "NEW AC UNIT", qty: 1, unitRate: 0, cpfMarkupPercent: 16 });
                    })}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Equipment
                  </button>
                </div>

                <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b border-border/60">
                        <th className="p-3 w-16">Sr</th>
                        <th className="p-3">Equipment Description</th>
                        <th className="p-3 w-28 text-center">Qty</th>
                        <th className="p-3 w-40 text-right">Unit Rate (Excl Tax)</th>
                        <th className="p-3 w-40 text-right">Total Rate</th>
                        <th className="p-3 w-44 text-right" title="Client Price Format â€” quoted price to client incl. tax">CPF (Client Price)</th>
                        <th className="p-3 w-16 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {activeCosting.highSide.equipment.map((eq, i) => (
                        <tr key={i} className="bg-white align-top">
                          <td className="p-3 font-semibold text-slate-500">{i + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={eq.description}
                              onChange={(e) => handleFieldChange((c) => {
                                c.highSide.equipment[i].description = e.target.value;
                              })}
                              className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={eq.qty}
                              onChange={(e) => handleFieldChange((c) => {
                                c.highSide.equipment[i].qty = parseFloat(e.target.value) || 0;
                              })}
                              className="h-9 w-full rounded border border-border bg-white px-3 text-center text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={eq.unitRate}
                              onChange={(e) => handleFieldChange((c) => {
                                c.highSide.equipment[i].unitRate = parseFloat(e.target.value) || 0;
                              })}
                              className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                            />
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800 text-sm">
                            {formatCurrency(eq.qty * eq.unitRate)}
                          </td>
                          {/* CPF column: % input on top, computed value below */}
                          <td className="p-2">
                            <div className="flex flex-col gap-1">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={eq.cpfMarkupPercent ?? 16}
                                  onChange={(e) => handleFieldChange((c) => {
                                    c.highSide.equipment[i].cpfMarkupPercent = parseFloat(e.target.value) || 0;
                                  })}
                                  className="h-8 w-full rounded border border-amber-300 bg-amber-50 pl-2 pr-6 text-right text-xs font-bold text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                  title="CPF markup % for this item (e.g. 16 = Ã—1.16)"
                                />
                                <span className="absolute right-2 top-1.5 text-[10px] text-amber-500 font-bold">%</span>
                              </div>
                              <div className="text-right text-sm font-bold text-amber-900 px-1">
                                {formatCurrency(eq.qty * eq.unitRate * (1 + (eq.cpfMarkupPercent ?? 16) / 100))}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                c.highSide.equipment.splice(i, 1);
                              })}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* HIGHSIDE MARKUP CONFIGURES */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/20 border border-border/50 rounded-xl p-5">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 border-border/50">Indirect Cost Factors</h4>
                    <div className="space-y-3">
                      {[
                        { key: "designPercent", label: "Design & Plan" },
                        { key: "warrantyPercent", label: "Warranty" },
                        { key: "transportationPercent", label: "Transportation" },
                        { key: "unloadingPercent", label: "Unloading" },
                        { key: "bankChargesPercent", label: "Bank Charges" },
                        { key: "commissionPercent", label: "Commission" }
                      ].map((factor) => (
                        <PercentageAndAmountInput
                          key={factor.key}
                          label={factor.label}
                          percentValue={(activeCosting.highSide as any)[factor.key]}
                          baseValue={hsSubtotal}
                          onPercentChange={(val) => handleFieldChange((c) => { (c.highSide as any)[factor.key] = val; })}
                          onAmountChange={(val) => handleFieldChange((c) => { (c.highSide as any)[factor.key] = val; })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 border-border/50">Overhead, Profit & Tax</h4>
                    <div className="space-y-3">
                      <PercentageAndAmountInput
                        label="Overhead (on cumulative total)"
                        percentValue={activeCosting.highSide.overheadPercent}
                        baseValue={hsSubTotalOverhead}
                        onPercentChange={(val) => handleFieldChange((c) => { c.highSide.overheadPercent = val; })}
                        onAmountChange={(val) => handleFieldChange((c) => { c.highSide.overheadPercent = val; })}
                      />
                      <PercentageAndAmountInput
                        label="Profit Markup"
                        percentValue={activeCosting.highSide.profitPercent}
                        baseValue={hsGrandTotal}
                        isProfitMode={true}
                        onPercentChange={(val) => handleFieldChange((c) => { c.highSide.profitPercent = val; })}
                        onAmountChange={(val) => handleFieldChange((c) => { c.highSide.profitPercent = val; })}
                      />


                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">GST Rate % (Chillers/ACs standard: 28%)</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            step="0.01"
                            value={activeCosting.highSide.gstPercent * 100}
                            onChange={(e) => handleFieldChange((c) => {
                              c.highSide.gstPercent = (parseFloat(e.target.value) || 0) / 100;
                            })}
                            className="h-9 w-full rounded border border-border bg-white pl-3 pr-6 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                          <span className="absolute right-2.5 top-2 text-xs text-muted-foreground font-bold">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 bg-white p-4 rounded-xl border border-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 border-border/50">High-Side Totals</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">Equipment Subtotal (Total Rate):</span>
                        <span className="text-slate-800 font-semibold">{formatCurrency(hsSubtotal)}</span>
                      </div>

                      {/* Internal Cost Chain â€” mirrors Excel Column F */}
                      <div className="flex justify-between font-medium text-[11px] border-t pt-1.5">
                        <span className="text-slate-400 italic">â€” Internal Cost Chain (Col F) â€”</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">Grand Total (incl. overheads):</span>
                        <span className="text-slate-700">{formatCurrency(hsGrandTotal)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">Profit ({(activeCosting.highSide.profitPercent * 100).toFixed(1)}%):</span>
                        <span className="text-slate-700">{formatCurrency(activeCosting.summary.highSideProfit)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-700">
                        <span>Project Value (Excl. Tax):</span>
                        <span>{formatCurrency(hsGrandTotal + activeCosting.summary.highSideProfit)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">GST ({(activeCosting.highSide.gstPercent * 100).toFixed(0)}%):</span>
                        <span className="text-slate-700">{formatCurrency((hsGrandTotal + activeCosting.summary.highSideProfit) * activeCosting.highSide.gstPercent)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Final Project Value (Incl. Tax):</span>
                        <span>{formatCurrency((hsGrandTotal + activeCosting.summary.highSideProfit) * (1 + activeCosting.highSide.gstPercent))}</span>
                      </div>

                      {/* CPF-Based â€” mirrors Excel Column G (Client Quoted Price) */}
                      <div className="flex justify-between font-medium text-[11px] border-t pt-1.5 mt-1">
                        <span className="text-amber-600 italic font-semibold">â€” CPF Column (Col G â€” Client Quote) â€”</span>
                      </div>
                      <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                        <span className="text-amber-700 text-xs font-medium">CPF Total (per-item % â€” Project Value):</span>

                        <span className="text-amber-900 font-bold">{formatCurrency(hsCpfTotal)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">GST on CPF ({(activeCosting.highSide.gstPercent * 100).toFixed(0)}%):</span>
                        <span className="text-slate-700">{formatCurrency(hsCpfTotal * activeCosting.highSide.gstPercent)}</span>
                      </div>
                      <div className="flex justify-between text-pink-700 font-extrabold text-sm border-t pt-2">
                        <span>Final Project Value (CPF + GST):</span>
                        <span>{formatCurrency(activeCosting.summary.highSideTotalPriceInclTax)}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })()}          {/* TAB 3: LOW SIDE WORKS */}
          {activeTab === "lowside" && (() => {
            const totalMaterial = activeCosting.lowSide.items.reduce((sum, item) => sum + item.materialRate, 0);
            const totalLabour = activeCosting.lowSide.items.reduce((sum, item) => sum + item.labourRate, 0);
            const baseTotalCost = totalMaterial + totalLabour;
            const lsDesign = baseTotalCost * activeCosting.lowSide.designPercent;
            const lsWarranty = baseTotalCost * activeCosting.lowSide.warrantyPercent;
            const lsContingency = baseTotalCost * activeCosting.lowSide.contingencyPercent;
            const lsTrans = baseTotalCost * activeCosting.lowSide.transportationPercent;
            const lsAccom = activeCosting.lowSide.accommodationValue;
            const lsUnload = baseTotalCost * activeCosting.lowSide.unloadingPercent;
            const lsBank = baseTotalCost * activeCosting.lowSide.bankChargesPercent;
            const lsSubTotal = baseTotalCost + lsDesign + lsWarranty + lsContingency + lsTrans + lsAccom + lsUnload + lsBank;
            const lsOverhead = lsSubTotal * activeCosting.lowSide.overheadPercent;
            const lsGrandTotal = lsSubTotal + lsOverhead;

            return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Low Side Work Items</h3>
                  <button
                    type="button"
                    onClick={handleManualSync}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 h-9 rounded-lg border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100 transition duration-150 shadow-sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Sync from Materials Summary
                  </button>
                </div>

                {activeCosting.lowSide.items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-8 bg-muted/20 text-center">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">No Low-Side Work Items Found</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      This costing sheet currently has no contracting items. Load standard HVAC installation template rows or add a custom item to begin.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleFieldChange((c) => {
                          c.lowSide.items = getHvacTemplateItems();
                        })}
                        className="bg-pink-700 hover:bg-pink-850 text-white font-bold h-9 px-4 rounded-lg shadow-sm transition duration-200 flex items-center gap-1.5 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Load Standard HVAC Template
                      </button>
                      <button
                        onClick={() => handleFieldChange((c) => {
                          c.lowSide.items.push({
                            srNo: 1,
                            description: "",
                            qty: 1,
                            unit: "Nos",
                            materialRate: 0,
                            labourRate: 0,
                            stdRate: 0,
                            rateUnit: "Flat"
                          });
                        })}
                        className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                      >
                        <Plus className="h-4 w-4" />
                                Add Custom Item
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm mt-4">
                      <table className="w-full border-collapse text-left text-[13px] table-fixed">
                        <thead>
                          <tr className="bg-muted text-muted-foreground uppercase font-bold text-[11px] tracking-wider border-b border-border/60">
                            <th className="py-3 pl-4 w-[3.5%] text-center">Sr</th>
                            <th className="py-3 px-2 w-[19%]">Description</th>
                            <th className="py-3 px-2 w-[6%] text-center">Qty</th>
                            <th className="py-3 px-2 w-[6%] text-center">Unit</th>
                            <th className="py-3 px-2 w-[9%] text-right">Material Cost</th>
                            <th className="py-3 px-2 w-[9%] text-right">Labour Cost</th>
                            <th className="py-3 px-2 w-[9%] text-right">Total Cost</th>
                            <th className="py-3 px-2 w-[10%] text-right">Proposal Std Rate</th>
                            <th className="py-3 px-2 w-[11%] text-right">Proposal CPF (Tax Incl)</th>
                            <th className="py-3 px-2 w-[10.5%] text-right">Q. Rate (Tax Excl)</th>
                            <th className="py-3 pr-4 w-[7%] text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {activeCosting.lowSide.items.map((item, i) => {
                            return (
                              <tr key={item.srNo} className="bg-white">
                                <td className="p-1.5 pl-4 text-center font-semibold text-slate-500 text-xs">{item.srNo}</td>
                                <td className="p-1.5 px-2">
                                  <Popover
                                    modal={false}
                                    open={activeSuggestionRow === i}
                                    onOpenChange={(open) => {
                                      if (!open) {
                                        setActiveSuggestionRow(null);
                                      }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <div className="w-full relative">
                                        <AutoResizeTextarea
                                          value={item.description}
                                          onFocus={() => {
                                            setActiveSuggestionRow(i);
                                            setSearchQuery("");
                                          }}
                                          onChange={(e) => {
                                            handleFieldChange((c) => {
                                              c.lowSide.items[i].description = e.target.value;
                                            });
                                            setSearchQuery(e.target.value);
                                          }}
                                          className="min-h-[36px] w-full rounded border border-border bg-white px-2 py-2 text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none overflow-hidden leading-normal"
                                          placeholder="Enter description..."
                                        />
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-96 p-2 bg-card border border-border shadow-lg max-h-60 overflow-y-auto z-50 text-xs"
                                      align="start"
                                      side="bottom"
                                      sideOffset={4}
                                      onOpenAutoFocus={(e) => e.preventDefault()}
                                    >
                                      {(() => {
                                        const query = searchQuery || "";
                                        const category = getRowCategory(item.srNo, item.description);
                                        let filtered: typeof detailedEstimatorSuggestions = [];
                                        if (query.trim() === "") {
                                          if (category) {
                                            filtered = detailedEstimatorSuggestions.filter((s) => s.category === category);
                                          }
                                          if (filtered.length === 0) {
                                            filtered = detailedEstimatorSuggestions;
                                          }
                                        } else {
                                          filtered = detailedEstimatorSuggestions.filter((s) =>
                                            s.description.toLowerCase().includes(query.toLowerCase())
                                          );
                                        }
                                        if (filtered.length === 0) {
                                          return <div className="p-2 text-muted-foreground text-center">No matching summary items</div>;
                                        }
                                        return (
                                          <div className="flex flex-col gap-1">
                                            {filtered.map((s, idx) => (
                                              <button
                                                key={idx}
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                  handleFieldChange((c) => {
                                                    const row = c.lowSide.items[i];
                                                    row.description = s.description;
                                                    row.qty = s.qty;
                                                    row.unit = s.unit;
                                                    row.materialRate = Math.round(s.qty * s.ur);
                                                    row.stdRate = s.ur;
                                                  });
                                                  setActiveSuggestionRow(null);
                                                }}
                                                className="w-full flex items-center justify-between text-left p-2 hover:bg-muted rounded transition"
                                              >
                                                <div className="flex flex-col">
                                                  <span className="font-semibold text-foreground text-xs">{s.description}</span>
                                                  <span className="text-[10px] text-muted-foreground">
                                                    Qty: {s.qty} {s.unit} | Rate: {formatCurrency(s.ur)}
                                                  </span>
                                                </div>
                                                <span className="font-bold text-pink-700 text-xs">{formatCurrency(s.qty * s.ur)}</span>
                                              </button>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                    </PopoverContent>
                                  </Popover>
                                </td>
                                <td className="p-1.5 px-2 text-center">
                                  <input
                                    type="number"
                                    value={item.qty}
                                    onChange={(e) => handleFieldChange((c) => {
                                      c.lowSide.items[i].qty = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full text-center rounded border border-border bg-white px-1 text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-1.5 px-2 text-center">
                                  <input
                                    type="text"
                                    value={item.unit}
                                    onChange={(e) => handleFieldChange((c) => {
                                      c.lowSide.items[i].unit = e.target.value;
                                    })}
                                    className="h-9 w-full text-center rounded border border-border bg-white px-1 text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                
                                <td className="p-1.5 px-2 text-right">
                                  <input
                                    type="number"
                                    value={item.materialRate}
                                    onChange={(e) => handleFieldChange((c) => {
                                      c.lowSide.items[i].materialRate = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full rounded border border-border bg-white px-1.5 text-right text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                
                                <td className="p-1.5 px-2 text-right">
                                  <input
                                    type="number"
                                    value={item.labourRate || 0}
                                    onChange={(e) => handleFieldChange((c) => {
                                      c.lowSide.items[i].labourRate = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full rounded border border-border bg-white px-1.5 text-right text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                
                                <td className="p-1.5 px-2 text-right font-bold text-slate-800 text-xs">
                                  {formatCurrency(item.materialRate + item.labourRate)}
                                </td>
                                
                                <td className="p-1.5 px-2 text-right">
                                  <input
                                    type="number"
                                    value={item.stdRate || 0}
                                    onChange={(e) => handleFieldChange((c) => {
                                      c.lowSide.items[i].stdRate = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full rounded border border-border bg-white px-1.5 text-right text-[13px] font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                
                                <td className="p-1.5 px-2 text-right font-bold text-slate-700 text-xs">
                                  {formatCurrency(item.stdRate * item.qty)}
                                </td>
                                
                                <td className="p-1.5 px-2 text-right font-bold text-pink-700 text-xs">
                                  {formatCurrency(item.qRate || 0)}
                                </td>
 
                                <td className="p-1.5 pr-4 text-center">
                                  <button
                                    onClick={() => handleFieldChange((c) => {
                                      c.lowSide.items.splice(i, 1);
                                    })}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100/80 border-t-2 border-b-2 border-slate-300 font-extrabold text-slate-800 text-xs">
                            <td className="py-3 pl-4 text-center"></td>
                            <td className="py-3 px-2 text-left text-[13px] uppercase tracking-wider font-extrabold text-slate-700">Total</td>
                            <td className="py-3 px-2 text-center"></td>
                            <td className="py-3 px-2 text-center"></td>
                            <td className="py-3 px-2 text-right text-[13px] text-slate-900 font-black">{formatCurrency(totalMaterial)}</td>
                            <td className="py-3 px-2 text-right text-[13px] text-slate-900 font-black">{formatCurrency(totalLabour)}</td>
                            <td className="py-3 px-2 text-right text-[13px] text-slate-900 font-black">{formatCurrency(baseTotalCost)}</td>
                            <td className="py-3 px-2 text-right"></td>
                            <td className="py-3 px-2 text-right text-[13px] text-slate-900 font-black">
                              {formatCurrency(activeCosting.lowSide.items.reduce((sum, item) => sum + (item.cpfRate || 0), 0))}
                            </td>
                            <td className="py-3 px-2 text-right text-[13px] text-pink-700 font-black">
                              {formatCurrency(activeCosting.lowSide.items.reduce((sum, item) => sum + Math.round(item.qRate || 0), 0))}
                            </td>
                            <td className="py-3 pr-4 text-center"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
 
                    <div className="mt-2 flex justify-start">
                      <button
                        onClick={() => handleFieldChange((c) => {
                          const nextSr = c.lowSide.items.length > 0 ? Math.max(...c.lowSide.items.map(item => item.srNo)) + 1 : 1;
                          c.lowSide.items.push({
                            srNo: nextSr,
                            description: "",
                            qty: 1,
                            unit: "Nos",
                            materialRate: 0,
                            labourRate: 0,
                            stdRate: 0,
                            rateUnit: "Flat"
                          });
                        })}
                        className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                      >
                        <Plus className="h-4 w-4" />
                        Add Work Item
                      </button>
                    </div>
                  </>
                )}
   
                {/* LOW SIDE MARKUPS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/20 border border-border/50 rounded-xl p-5">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 border-border/50">Low Side Overhead Factors</h4>
                    <div className="space-y-3">
                      {[
                        { key: "designPercent", label: "Design/Coord" },
                        { key: "warrantyPercent", label: "Warranty" },
                        { key: "contingencyPercent", label: "Contingency" },
                        { key: "transportationPercent", label: "Transportation" },
                        { key: "unloadingPercent", label: "Unloading" },
                        { key: "bankChargesPercent", label: "Bank Charges" }
                      ].map((factor) => (
                        <PercentageAndAmountInput
                          key={factor.key}
                          label={factor.label}
                          percentValue={(activeCosting.lowSide as any)[factor.key]}
                          baseValue={baseTotalCost}
                          onPercentChange={(val) => handleFieldChange((c) => { (c.lowSide as any)[factor.key] = val; })}
                          onAmountChange={(val) => handleFieldChange((c) => { (c.lowSide as any)[factor.key] = val; })}
                        />
                      ))}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Accommodation & Food (Flat Value)</label>
                        <div className="relative mt-1">
                          <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-bold">â‚¹</span>
                          <input
                            type="number"
                            value={activeCosting.lowSide.accommodationValue}
                            onChange={(e) => handleFieldChange((c) => {
                              c.lowSide.accommodationValue = parseFloat(e.target.value) || 0;
                            })}
                            className="h-9 w-full rounded border border-border bg-white pl-6 pr-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
   
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 border-border/50">Low-Side Overhead, Profit & Tax</h4>
                    <div className="space-y-3">
                      <PercentageAndAmountInput
                        label="Overhead"
                        percentValue={activeCosting.lowSide.overheadPercent}
                        baseValue={lsSubTotal}
                        onPercentChange={(val) => handleFieldChange((c) => { c.lowSide.overheadPercent = val; })}
                        onAmountChange={(val) => handleFieldChange((c) => { c.lowSide.overheadPercent = val; })}
                      />
                      <PercentageAndAmountInput
                        label="Profit Markup"
                        percentValue={activeCosting.lowSide.profitPercent}
                        baseValue={lsGrandTotal}
                        isProfitMode={true}
                        onPercentChange={(val) => handleFieldChange((c) => { c.lowSide.profitPercent = val; })}
                        onAmountChange={(val) => handleFieldChange((c) => { c.lowSide.profitPercent = val; })}
                      />
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">GST Rate % (Works Contracting standard: 18%)</label>
                        <div className="relative mt-1">
                          <input
                            type="number"
                            step="0.01"
                            value={activeCosting.lowSide.gstPercent * 100}
                            onChange={(e) => handleFieldChange((c) => {
                              c.lowSide.gstPercent = (parseFloat(e.target.value) || 0) / 100;
                            })}
                            className="h-9 w-full rounded border border-border bg-white pl-3 pr-6 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                          />
                          <span className="absolute right-2.5 top-2 text-xs text-muted-foreground font-bold">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
   
                  <div className="space-y-4 bg-white p-4 rounded-xl border border-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5 border-border/50">Low-Side Totals</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-500">Material + Labour Sum:</span>
                        <span className="text-slate-800 font-semibold">{formatCurrency(baseTotalCost)}</span>
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-500 pl-3">
                        <span>Design ({(activeCosting.lowSide.designPercent * 100).toFixed(1)}%):</span>
                        <span>{formatCurrency(lsDesign)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 pl-3">
                        <span>Warranty ({(activeCosting.lowSide.warrantyPercent * 100).toFixed(1)}%):</span>
                        <span>{formatCurrency(lsWarranty)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 pl-3">
                        <span>Contingency ({(activeCosting.lowSide.contingencyPercent * 100).toFixed(1)}%):</span>
                        <span>{formatCurrency(lsContingency)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 pl-3">
                        <span>Transportation ({(activeCosting.lowSide.transportationPercent * 100).toFixed(1)}%):</span>
                        <span>{formatCurrency(lsTrans)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 pl-3">
                        <span>Accommodation & Food:</span>
                        <span>{formatCurrency(lsAccom)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 pl-3">
                        <span>Unloading ({(activeCosting.lowSide.unloadingPercent * 100).toFixed(1)}%):</span>
                        <span>{formatCurrency(lsUnload)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 pl-3 border-b pb-1.5 border-dashed">
                        <span>Bank Charges ({(activeCosting.lowSide.bankChargesPercent * 100).toFixed(2)}%):</span>
                        <span>{formatCurrency(lsBank)}</span>
                      </div>
                      
                      <div className="flex justify-between font-medium text-slate-700 pl-1">
                        <span>Sub Total:</span>
                        <span>{formatCurrency(lsSubTotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 pl-3 border-b pb-1.5 border-dashed">
                        <span>Over Head ({(activeCosting.lowSide.overheadPercent * 100).toFixed(1)}%):</span>
                        <span>{formatCurrency(lsOverhead)}</span>
                      </div>

                      {(() => {
                        const quoteProjectValue = activeCosting.lowSide.items.reduce((sum, item) => sum + Math.round(item.qRate || 0), 0);
                        const quoteGst = Math.round(quoteProjectValue * activeCosting.lowSide.gstPercent);
                        const quoteFinalProjectValue = quoteProjectValue + quoteGst;

                        const expenseProjectValue = Math.round(lsGrandTotal) + Math.round(activeCosting.summary.lowSideProfit);
                        const expenseGst = Math.round(expenseProjectValue * activeCosting.lowSide.gstPercent);
                        const expenseFinalProjectValue = expenseProjectValue + expenseGst;
                        return (
                          <>
                            {/* Expense-Based â€” mirrors Excel Column J */}
                            <div className="flex justify-between font-medium text-[11px] border-t pt-1.5 mt-2">
                              <span className="text-slate-400 italic">â€” Expense-Based (Col J) â€”</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span className="text-slate-500">Total Expense Excl. Tax:</span>
                              <span className="text-slate-700">{formatCurrency(lsGrandTotal)}</span>
                            </div>
                            <div className="flex justify-between font-medium border-b pb-2">
                              <span className="text-slate-500">Profit Markup Margin ({(activeCosting.lowSide.profitPercent * 100).toFixed(1)}%):</span>
                              <span className="text-slate-700">{formatCurrency(activeCosting.summary.lowSideProfit)}</span>
                            </div>

                            <div className="flex justify-between font-bold text-slate-700">
                              <span>Project Value (Excl. Tax):</span>
                              <span>{formatCurrency(expenseProjectValue)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-500 pl-3">
                              <span>GST ({(activeCosting.lowSide.gstPercent * 100).toFixed(1)}%):</span>
                              <span>{formatCurrency(expenseGst)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-800 border-b pb-2">
                              <span>Final Project Value (with Tax):</span>
                              <span>{formatCurrency(expenseFinalProjectValue)}</span>
                            </div>

                            {/* Q. Rate-Based â€” mirrors Excel Column K (Client Quote) */}
                            <div className="flex justify-between font-medium text-[11px] border-t pt-1.5 mt-2">
                              <span className="text-pink-600 italic font-semibold">â€” Q. Rate Column (Col K â€” Client Quote) â€”</span>
                            </div>
                            <div className="flex justify-between items-center bg-pink-50 border border-pink-100 rounded-lg px-3 py-1.5">
                              <span className="text-pink-700 text-xs font-medium">Q. Rate Project Value:</span>
                              <span className="text-pink-900 font-bold">{formatCurrency(quoteProjectValue)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span className="text-slate-500">GST on Q. Rate ({(activeCosting.lowSide.gstPercent * 100).toFixed(1)}%):</span>
                              <span className="text-slate-700">{formatCurrency(quoteGst)}</span>
                            </div>
                            <div className="flex justify-between text-pink-700 font-extrabold text-base border-t pt-2">
                              <span>Final Project Value (with Tax):</span>
                              <span>{formatCurrency(quoteFinalProjectValue)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 4: DETAILED ESTIMATES SHEET (THE SPREADSHEET FORMULAS INTEGRATOR) */}
          {activeTab === "estimates" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50/20 border border-blue-100 text-blue-700 rounded-xl text-xs font-medium">
                <Info className="h-4 w-4 shrink-0" />
                <span>
Adjust quantities and prices below to build your detailed material estimate.
                </span>
              </div>

              {/* ESTIMATES SECTIONS ACCORDION */}
              <div className="space-y-3">
                {[
                  {
                    id: "installation",
                    title: "1. Installation Accessories",
                    render: () => {
                      const items = activeCosting.lowSide.materialEstimate.installation?.items || [];
                      return (
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full border-collapse text-left text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Description</th>
                                <th className="p-3 w-32 text-center">Qty</th>
                                <th className="p-3 w-28 text-center">Unit</th>
                                <th className="p-3 w-32 text-right">Unit Rate</th>
                                <th className="p-3 w-36 text-right">Total Cost</th>
                                <th className="p-3 w-10 text-center">Note</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {items.map((item: IEstimateItem, idx: number) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.installation.items[idx].description = e.target.value;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.installation.items[idx].qty = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.unit}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.installation.items[idx].unit = e.target.value;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.installation.items[idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(item.qty * item.ur)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={item.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.installation.items[idx].remarks = val;
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.installation.items.splice(idx, 1);
                                      })}
                                      className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 border-t border-border/30 flex items-center justify-between">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                if (!c.lowSide.materialEstimate.installation?.items) {
                                  c.lowSide.materialEstimate.installation = { items: [] };
                                }
                                c.lowSide.materialEstimate.installation.items.push({ description: "New Item", qty: 0, unit: "Nos", ur: 0, remarks: "" });
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Row
                            </button>
                            <span className="text-sm font-bold text-slate-800">Total: {formatCurrency(items.reduce((sum: number, item: IEstimateItem) => sum + (item.qty * item.ur), 0))}</span>
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    id: "testing",
                    title: "2. Testing & Commissioning",
                    render: () => {
                      const items = activeCosting.lowSide.materialEstimate.testingCommissioning?.items || [];
                      return (
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full border-collapse text-left text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Description</th>
                                <th className="p-3 w-32 text-center">Qty</th>
                                <th className="p-3 w-28 text-center">Unit</th>
                                <th className="p-3 w-32 text-right">Unit Rate</th>
                                <th className="p-3 w-36 text-right">Total Cost</th>
                                <th className="p-3 w-10 text-center">Note</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {items.map((item: IEstimateItem, idx: number) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.testingCommissioning.items[idx].description = e.target.value;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.testingCommissioning.items[idx].qty = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.unit}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.testingCommissioning.items[idx].unit = e.target.value;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.testingCommissioning.items[idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(item.qty * item.ur)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={item.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.testingCommissioning.items[idx].remarks = val;
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.testingCommissioning.items.splice(idx, 1);
                                      })}
                                      className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 border-t border-border/30 flex items-center justify-between">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                if (!c.lowSide.materialEstimate.testingCommissioning?.items) {
                                  c.lowSide.materialEstimate.testingCommissioning = { items: [] };
                                }
                                c.lowSide.materialEstimate.testingCommissioning.items.push({ description: "New Item", qty: 0, unit: "Nos", ur: 0, remarks: "" });
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Row
                            </button>
                            <span className="text-sm font-bold text-slate-800">Total: {formatCurrency(items.reduce((sum: number, item: IEstimateItem) => sum + (item.qty * item.ur), 0))}</span>
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    id: "copper",
                    title: "3. Refrigerant Piping (Copper Pipes & Insulation)",
                    render: () => (
                      <div className="space-y-4">
                        <datalist id="copper-sizes-hard">
                          {(copperPipeRates || []).filter((r) => r.type === "hard").map((r, i) => (
                            <option key={i} value={r.size} />
                          ))}
                        </datalist>
                        <datalist id="copper-sizes-soft">
                          {(copperPipeRates || []).filter((r) => r.type === "soft").map((r, i) => (
                            <option key={i} value={r.size} />
                          ))}
                        </datalist>
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-sm text-left border-collapse bg-white table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Description</th>
                                <th className="p-3 w-32 text-right">Unit Rate (UR)</th>
                                <th className="p-3 w-28 text-center">Qty</th>
                                <th className="p-3 w-24 text-center">Unit</th>
                                <th className="p-3 w-36 text-right">Total Cost</th>
                                <th className="p-3 w-12 text-center">Note</th>
                                <th className="p-3 w-12 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {/* --- COPPER PIPES SECTION --- */}
                              <tr className="bg-slate-50 font-bold border-b border-t">
                                <td colSpan={7} className="p-2 pl-4 text-xs uppercase tracking-wider text-slate-700">
                                  Copper Pipes
                                </td>
                              </tr>
                              {activeCosting.lowSide.materialEstimate.refPiping.copperPipes.map((p, idx) => (
                                <tr key={`copper-${idx}`} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <div className="flex gap-2 items-center w-full">
                                      <span className="text-xs text-slate-500 font-semibold shrink-0">Size:</span>
                                      <input
                                        type="text"
                                        value={p.size}
                                        list={p.type === "hard" ? "copper-sizes-hard" : "copper-sizes-soft"}
                                        onChange={(e) => handleFieldChange((c) => {
                                          const newSize = e.target.value;
                                          c.lowSide.materialEstimate.refPiping.copperPipes[idx].size = newSize;
                                          if (c.lowSide.materialEstimate.refPiping.insulation[idx]) {
                                            c.lowSide.materialEstimate.refPiping.insulation[idx].size = newSize;
                                          }
                                          const match = copperPipeRates.find((cr) => 
                                            cr.type === p.type &&
                                            normalizeSize(cr.size) === normalizeSize(newSize)
                                          );
                                          if (match) {
                                            c.lowSide.materialEstimate.refPiping.copperPipes[idx].ur = match.rate;
                                            if (c.lowSide.materialEstimate.refPiping.insulation[idx]) {
                                              c.lowSide.materialEstimate.refPiping.insulation[idx].ur = match.sleeveRate;
                                            }
                                          }
                                        })}
                                        className="h-9 flex-1 min-w-[70px] rounded border border-border bg-white px-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                                      />
                                      <select
                                        value={p.type}
                                        onChange={(e) => handleFieldChange((c) => {
                                          const newType = e.target.value as any;
                                          c.lowSide.materialEstimate.refPiping.copperPipes[idx].type = newType;
                                          const match = copperPipeRates.find((cr) => 
                                            cr.type === newType &&
                                            normalizeSize(cr.size) === normalizeSize(c.lowSide.materialEstimate.refPiping.copperPipes[idx].size)
                                          );
                                          if (match) {
                                            c.lowSide.materialEstimate.refPiping.copperPipes[idx].ur = match.rate;
                                            if (c.lowSide.materialEstimate.refPiping.insulation[idx]) {
                                              c.lowSide.materialEstimate.refPiping.insulation[idx].ur = match.sleeveRate;
                                            }
                                          }
                                        })}
                                        className="h-9 flex-1 min-w-[70px] rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400 text-center"
                                      >
                                        <option value="hard">Hard</option>
                                        <option value="soft">Soft</option>
                                      </select>
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={p.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.copperPipes[idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={p.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.copperPipes[idx].qty = parseFloat(e.target.value) || 0;
                                        if (c.lowSide.materialEstimate.refPiping.insulation[idx]) {
                                          c.lowSide.materialEstimate.refPiping.insulation[idx].qty = parseFloat((c.lowSide.materialEstimate.refPiping.copperPipes[idx].qty / 1.75).toFixed(2)) || 0;
                                        }
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-2 text-center text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2 text-center text-slate-500 font-semibold">
                                    Rmt
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(p.qty * p.ur)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={p.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.copperPipes[idx].remarks = val;
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.copperPipes.splice(idx, 1);
                                        c.lowSide.materialEstimate.refPiping.insulation.splice(idx, 1);
                                      })}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              
                              {/* --- INSULATION SECTION --- */}
                              <tr className="bg-slate-50 font-bold border-b border-t">
                                <td colSpan={7} className="p-2 pl-4 text-xs uppercase tracking-wider text-slate-700">
                                  Insulation
                                </td>
                              </tr>
                              {activeCosting.lowSide.materialEstimate.refPiping.insulation.map((i, idx) => (
                                <tr key={`insulation-${idx}`} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <div className="flex gap-2 items-center w-full">
                                      <span className="text-xs text-slate-500 font-semibold shrink-0">Size:</span>
                                      <input
                                        type="text"
                                        value={i.size}
                                        onChange={(e) => handleFieldChange((c) => {
                                          c.lowSide.materialEstimate.refPiping.insulation[idx].size = e.target.value;
                                        })}
                                        className="h-9 flex-1 min-w-[140px] rounded border border-border bg-white px-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={i.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.insulation[idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={i.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.insulation[idx].qty = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-2 text-center text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2 text-center text-slate-500 font-semibold">
                                    Nos.
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(i.qty * i.ur)}
                                  </td>
                                  <td className="p-2"></td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.insulation.splice(idx, 1);
                                      })}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {/* --- ACCESSORIES SECTION --- */}
                              <tr className="bg-slate-50 font-bold border-b border-t">
                                <td colSpan={7} className="p-2 pl-4 text-xs uppercase tracking-wider text-slate-700">
                                  Accessories & Fittings
                                </td>
                              </tr>
                              {(activeCosting.lowSide.materialEstimate.refPiping.accessories || []).map((acc, idx) => (
                                <tr key={`accessory-${idx}`} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={acc.description}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.accessories[idx].description = e.target.value;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={acc.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.accessories[idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={acc.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.accessories[idx].qty = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-2 text-center text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={acc.unit}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.accessories[idx].unit = e.target.value;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-2 text-center text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(acc.qty * acc.ur)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={acc.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.accessories[idx].remarks = val;
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.refPiping.accessories.splice(idx, 1);
                                      })}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          {/* Control Buttons */}
                          <div className="flex justify-between items-center p-3 bg-slate-50 border-t border-border/30">
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleFieldChange((c) => {
                                  c.lowSide.materialEstimate.refPiping.copperPipes.push({ size: "0.625\"", type: "hard", ur: 0, qty: 0, remarks: "" });
                                  c.lowSide.materialEstimate.refPiping.insulation.push({ size: "0.625\"", ur: 0, qty: 0 });
                                })}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 h-8 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition duration-200"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Copper Pipe / Insulation
                              </button>
                              <button
                                onClick={() => handleFieldChange((c) => {
                                  if (!c.lowSide.materialEstimate.refPiping.accessories) {
                                    c.lowSide.materialEstimate.refPiping.accessories = [];
                                  }
                                  c.lowSide.materialEstimate.refPiping.accessories.push({ description: "New Item", qty: 0, unit: "Lot", ur: 0, remarks: "" });
                                })}
                                className="flex items-center gap-1.5 text-xs font-bold px-3 h-8 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition duration-200"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Accessory
                              </button>
                            </div>
                            {(() => {
                              const copperTotal = activeCosting.lowSide.materialEstimate.refPiping.copperPipes.reduce((sum: number, p: any) => sum + (p.qty * p.ur), 0);
                              const insTotal = activeCosting.lowSide.materialEstimate.refPiping.insulation.reduce((sum: number, i: any) => sum + (i.qty * i.ur), 0);
                              const accTotal = (activeCosting.lowSide.materialEstimate.refPiping.accessories || []).reduce((sum: number, a: IEstimateItem) => sum + (a.qty * a.ur), 0);
                              return (
                                <span className="text-sm font-bold text-slate-800">Total: {formatCurrency(copperTotal + insTotal + accTotal)}</span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: "controlcabling",
                    title: "4. Control Cabling Runs",
                    render: () => (
                      <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full border-collapse text-left text-sm table-fixed">
                          <thead>
                            <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                              <th className="p-3">Cable Size</th>
                              <th className="p-3 w-32 text-center">Qty</th>
                              <th className="p-3 w-28 text-center">Unit</th>
                              <th className="p-3 w-32 text-right">Unit Rate</th>
                              <th className="p-3 w-36 text-right">Total Cost</th>
                              <th className="p-3 w-10 text-center">Note</th>
                              <th className="p-3 w-10 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {activeCosting.lowSide.materialEstimate.controlCabling.cables.map((c, idx) => (
                              <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={c.size}
                                    onChange={(e) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.controlCabling.cables[idx].size = e.target.value;
                                    })}
                                    className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={c.qty}
                                    onChange={(e) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.controlCabling.cables[idx].qty = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={c.unit || "Rmt"}
                                    onChange={(e) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.controlCabling.cables[idx].unit = e.target.value;
                                    })}
                                    className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={c.ur}
                                    onChange={(e) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.controlCabling.cables[idx].ur = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                  {formatCurrency(c.qty * c.ur)}
                                </td>
                                <td className="p-2 text-center">
                                  <RemarkCell
                                    remark={c.remarks}
                                    onSave={(val) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.controlCabling.cables[idx].remarks = val;
                                    })}
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.controlCabling.cables.splice(idx, 1);
                                    })}
                                    className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-3 border-t border-border/30 flex items-center justify-between">
                          <button
                            onClick={() => handleFieldChange((draft) => {
                              draft.lowSide.materialEstimate.controlCabling.cables.push({ size: "1.0 Sq.mm", ur: 0, qty: 0, remarks: "" });
                            })}
                            className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Row
                          </button>
                          <span className="text-sm font-bold text-slate-800">Total: {formatCurrency(activeCosting.lowSide.materialEstimate.controlCabling.cables.reduce((sum: number, c: any) => sum + (c.qty * c.ur), 0))}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: "powercabling",
                    title: "5. Power Cabling Runs",
                    render: () => (
                      <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full border-collapse text-left text-sm table-fixed">
                          <thead>
                            <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                              <th className="p-3">Cable Size</th>
                              <th className="p-3 w-32 text-center">Qty</th>
                              <th className="p-3 w-28 text-center">Unit</th>
                              <th className="p-3 w-32 text-right">Unit Rate</th>
                              <th className="p-3 w-36 text-right">Total Cost</th>
                              <th className="p-3 w-10 text-center">Note</th>
                              <th className="p-3 w-10 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {activeCosting.lowSide.materialEstimate.powerCabling.cables.map((c, idx) => (
                              <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={c.size}
                                    onChange={(e) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.powerCabling.cables[idx].size = e.target.value;
                                    })}
                                    className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={c.qty}
                                    onChange={(e) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.powerCabling.cables[idx].qty = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={c.unit || "Rmt"}
                                    onChange={(e) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.powerCabling.cables[idx].unit = e.target.value;
                                    })}
                                    className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={c.ur}
                                    onChange={(e) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.powerCabling.cables[idx].ur = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                  {formatCurrency(c.qty * c.ur)}
                                </td>
                                <td className="p-2 text-center">
                                  <RemarkCell
                                    remark={c.remarks}
                                    onSave={(val) => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.powerCabling.cables[idx].remarks = val;
                                    })}
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => handleFieldChange((draft) => {
                                      draft.lowSide.materialEstimate.powerCabling.cables.splice(idx, 1);
                                    })}
                                    className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-3 border-t border-border/30 flex items-center justify-between">
                          <button
                            onClick={() => handleFieldChange((draft) => {
                              draft.lowSide.materialEstimate.powerCabling.cables.push({ size: "6.0 Sq.mm", ur: 0, qty: 0, remarks: "" });
                            })}
                            className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Row
                          </button>
                          <span className="text-sm font-bold text-slate-800">Total: {formatCurrency(activeCosting.lowSide.materialEstimate.powerCabling.cables.reduce((sum: number, c: any) => sum + (c.qty * c.ur), 0))}</span>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: "drainpiping",
                    title: "6. Drain Piping",
                    render: () => (
                      <div className="space-y-4 text-sm">
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full border-collapse text-left text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Pipe Size</th>
                                <th className="p-3 w-32 text-center">Qty</th>
                                <th className="p-3 w-28 text-center">Unit</th>
                                <th className="p-3 w-32 text-right">Unit Rate</th>
                                <th className="p-3 w-36 text-right">Total Cost</th>
                                <th className="p-3 w-10 text-center">Note</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {(activeCosting.lowSide.materialEstimate.drainPiping?.pvcPipes || []).map((p, idx) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={p.size}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.pvcPipes[idx].size = e.target.value;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={p.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.pvcPipes[idx].qty = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                   <input
                                     type="text"
                                     value={p.unit || "Rmt"}
                                     onChange={(e) => handleFieldChange((draft) => {
                                       draft.lowSide.materialEstimate.drainPiping.pvcPipes[idx].unit = e.target.value;
                                     })}
                                     className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                   />
                                 </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={p.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.pvcPipes[idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(p.qty * p.ur)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={p.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.pvcPipes[idx].remarks = val;
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.pvcPipes.splice(idx, 1);
                                      })}
                                      className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 border-t border-border/30 flex items-center justify-between">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                if (!c.lowSide.materialEstimate.drainPiping) {
                                  c.lowSide.materialEstimate.drainPiping = { pvcPipes: [], accessories: [] };
                                }
                                c.lowSide.materialEstimate.drainPiping.pvcPipes.push({ size: "25 mm", ur: 0, qty: 0, remarks: "" });
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Row
                            </button>
                            <span className="text-sm font-bold text-slate-800">Pipes Subtotal: {formatCurrency((activeCosting.lowSide.materialEstimate.drainPiping?.pvcPipes || []).reduce((sum: number, p: any) => sum + (p.qty * p.ur), 0))}</span>
                          </div>
                        </div>

                        {/* Drain Accessories â€“ dynamic array */}
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm mt-4">
                          <table className="w-full border-collapse text-left text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Accessory Description</th>
                                <th className="p-3 w-32 text-center">Qty</th>
                                <th className="p-3 w-28 text-center">Unit</th>
                                <th className="p-3 w-32 text-right">Unit Rate</th>
                                <th className="p-3 w-36 text-right">Total Cost</th>
                                <th className="p-3 w-10 text-center">Note</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {(activeCosting.lowSide.materialEstimate.drainPiping?.accessories || []).map((acc: IEstimateItem, idx: number) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={acc.description}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.accessories[idx].description = e.target.value;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={acc.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.accessories[idx].qty = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={acc.unit}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.accessories[idx].unit = e.target.value;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={acc.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.accessories[idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">{formatCurrency(acc.qty * acc.ur)}</td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={acc.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.accessories[idx].remarks = val;
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.drainPiping.accessories.splice(idx, 1);
                                      })}
                                      className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 border-t border-border/30 flex items-center justify-between border-b border-border/30">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                if (!c.lowSide.materialEstimate.drainPiping.accessories) {
                                  c.lowSide.materialEstimate.drainPiping.accessories = [];
                                }
                                c.lowSide.materialEstimate.drainPiping.accessories.push({ description: "New Item", qty: 0, unit: "Lot", ur: 0, remarks: "" });
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Accessory Row
                            </button>
                            <span className="text-sm font-bold text-slate-800">Accessories Subtotal: {formatCurrency((activeCosting.lowSide.materialEstimate.drainPiping?.accessories || []).reduce((sum: number, a: any) => sum + (a.qty * a.ur), 0))}</span>
                          </div>
                          {(() => {
                            const pvcTotal = (activeCosting.lowSide.materialEstimate.drainPiping?.pvcPipes || []).reduce((sum: number, p: any) => sum + (p.qty * p.ur), 0);
                            const accTotal = (activeCosting.lowSide.materialEstimate.drainPiping?.accessories || []).reduce((sum: number, a: any) => sum + (a.qty * a.ur), 0);
                            return (
                              <div className="flex justify-end items-center p-3 bg-slate-50">
                                <span className="text-sm font-bold text-slate-800">Drain Piping Grand Total: {formatCurrency(pvcTotal + accTotal)}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )
                  },
                  {
                    id: "ducting",
                    title: "7. GSS Ducting & Insulation",
                    render: () => {
                      const thermalInsSqMtr = activeCosting.lowSide.materialEstimate.ducting.gssDucting.find(d => d.gauge.includes("24"))?.qtySqMtr || 0;
                      const acousticInsSqMtr = activeCosting.lowSide.materialEstimate.ducting.gssDucting.find(d => d.gauge.includes("22"))?.qtySqMtr || 0;
                      return (
                        <div className="space-y-4">
                          <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left border-collapse bg-white table-fixed">
                              <thead>
                                <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                  <th className="p-3 text-center w-28">Gauge</th>
                                  <th className="p-3 text-center w-32">Qty (Sq.Mtr)</th>
                                  <th className="p-3 text-center w-36">No. Sheets (Qty/3)</th>
                                  <th className="p-3 text-center w-32">Wt / Sheet (Kg)</th>
                                  <th className="p-3 text-center w-32">Total Wt (Kg)</th>
                                  <th className="p-3 text-right w-32">Rate / Kg</th>
                                  <th className="p-3 w-36 text-right">Total Cost</th>
                                  <th className="p-3 w-10 text-center">Note</th>
                                  <th className="p-3 w-10 text-center"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeCosting.lowSide.materialEstimate.ducting.gssDucting.map((d, idx) => {
                                  const numSheets = d.qtySqMtr / 3;
                                  const totalWt = numSheets * d.wtPerSheet;
                                  const totalCost = totalWt * d.ratePerKg;
                                  return (
                                    <tr key={idx} className="border-b bg-white hover:bg-slate-50/40">
                                      <td className="p-2 text-center">
                                        <input
                                          type="text"
                                          value={d.gauge}
                                          onChange={(e) => handleFieldChange((c) => {
                                            c.lowSide.materialEstimate.ducting.gssDucting[idx].gauge = e.target.value;
                                          })}
                                          className="h-9 w-full rounded border border-border bg-white px-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <input
                                          type="number"
                                          value={d.qtySqMtr}
                                          onChange={(e) => handleFieldChange((c) => {
                                            c.lowSide.materialEstimate.ducting.gssDucting[idx].qtySqMtr = parseFloat(e.target.value) || 0;
                                          })}
                                          className="h-9 w-full rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-semibold"
                                        />
                                      </td>
                                      <td className="p-2 text-center text-slate-500 font-semibold">{numSheets.toFixed(2)}</td>
                                      <td className="p-2 text-center">
                                        <input
                                          type="number"
                                          value={d.wtPerSheet}
                                          onChange={(e) => handleFieldChange((c) => {
                                            c.lowSide.materialEstimate.ducting.gssDucting[idx].wtPerSheet = parseFloat(e.target.value) || 0;
                                          })}
                                          className="h-9 w-full rounded border border-border bg-white px-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                                        />
                                      </td>
                                      <td className="p-2 text-center text-slate-700 font-semibold">{totalWt.toFixed(1)} kg</td>
                                      <td className="p-2 text-right">
                                        <input
                                          type="number"
                                          value={d.ratePerKg}
                                          onChange={(e) => handleFieldChange((c) => {
                                            c.lowSide.materialEstimate.ducting.gssDucting[idx].ratePerKg = parseFloat(e.target.value) || 0;
                                          })}
                                          className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400 text-right"
                                        />
                                      </td>
                                      <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">{formatCurrency(totalCost)}</td>
                                      <td className="p-2 text-center">
                                        <RemarkCell
                                          remark={d.remarks}
                                          onSave={(val) => handleFieldChange((c) => {
                                            c.lowSide.materialEstimate.ducting.gssDucting[idx].remarks = val;
                                          })}
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <button
                                          onClick={() => handleFieldChange((c) => {
                                            c.lowSide.materialEstimate.ducting.gssDucting.splice(idx, 1);
                                          })}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        <div className="flex justify-between items-center mt-2">
                          <button
                            onClick={() => handleFieldChange((c) => {
                              c.lowSide.materialEstimate.ducting.gssDucting.push({ gauge: "24 SWG", numSheets: 0, wtPerSheet: 14, ratePerKg: 0, qtySqMtr: 0 });
                            })}
                            className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Ducting Gauge
                          </button>
                          {(() => {
                            const gssTotal = activeCosting.lowSide.materialEstimate.ducting.gssDucting.reduce((sum: number, d: any) => {
                              const numSheets = d.qtySqMtr / 3;
                              const totalWt = numSheets * d.wtPerSheet;
                              return sum + (totalWt * d.ratePerKg);
                            }, 0);
                            return (
                              <span className="text-sm font-bold text-slate-800">Ducting Subtotal: {formatCurrency(gssTotal)}</span>
                            );
                          })()}
                        </div>
                        {/* GSS Ducting Accessories â€“ dynamic array */}
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm mt-4">
                          <table className="w-full border-collapse text-left text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Accessory Description</th>
                                <th className="p-3 w-32 text-center">Qty</th>
                                <th className="p-3 w-28 text-center">Unit</th>
                                <th className="p-3 w-32 text-right">Unit Rate</th>
                                <th className="p-3 w-36 text-right">Total Cost</th>
                                <th className="p-3 w-10 text-center">Note</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {/* Insulation rows derived from ducting gauge qtys â€“ read-only */}
                              <tr className="bg-white hover:bg-slate-50/40">
                                <td className="p-3 font-semibold text-slate-700">Thermal Insulation (for 24 SWG)</td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={thermalInsSqMtr.toFixed(2)}
                                    disabled
                                    className="h-9 w-full text-center rounded border border-border bg-slate-50 text-slate-500 px-2 text-sm font-medium cursor-not-allowed focus:outline-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value="Sq.Mtr"
                                    disabled
                                    className="h-9 w-full text-center rounded border border-border bg-slate-50 text-slate-500 px-2 text-sm font-medium cursor-not-allowed focus:outline-none"
                                  />
                                </td>
                                <td className="p-2 text-right">
                                  <input
                                    type="number"
                                    value={activeCosting.lowSide.materialEstimate.ducting.thermalInsulationUR}
                                    onChange={(e) => handleFieldChange((c) => {
                                      c.lowSide.materialEstimate.ducting.thermalInsulationUR = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-3 text-right font-bold text-slate-900">
                                  {formatCurrency(thermalInsSqMtr * activeCosting.lowSide.materialEstimate.ducting.thermalInsulationUR)}
                                </td>
                                <td></td><td></td>
                              </tr>
                              <tr className="bg-white hover:bg-slate-50/40">
                                <td className="p-3 font-semibold text-slate-700">Acoustic Insulation (for 22 SWG)</td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={acousticInsSqMtr.toFixed(2)}
                                    disabled
                                    className="h-9 w-full text-center rounded border border-border bg-slate-50 text-slate-500 px-2 text-sm font-medium cursor-not-allowed focus:outline-none"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value="Sq.Mtr"
                                    disabled
                                    className="h-9 w-full text-center rounded border border-border bg-slate-50 text-slate-500 px-2 text-sm font-medium cursor-not-allowed focus:outline-none"
                                  />
                                </td>
                                <td className="p-2 text-right">
                                  <input
                                    type="number"
                                    value={activeCosting.lowSide.materialEstimate.ducting.acousticInsulationUR}
                                    onChange={(e) => handleFieldChange((c) => {
                                      c.lowSide.materialEstimate.ducting.acousticInsulationUR = parseFloat(e.target.value) || 0;
                                    })}
                                    className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </td>
                                <td className="p-3 text-right font-bold text-slate-900">
                                  {formatCurrency(acousticInsSqMtr * activeCosting.lowSide.materialEstimate.ducting.acousticInsulationUR)}
                                </td>
                                <td></td><td></td>
                              </tr>
                              {/* Dynamic accessories rows */}
                              {(activeCosting.lowSide.materialEstimate.ducting.accessories || []).map((acc: IEstimateItem, idx: number) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={acc.description}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.ducting.accessories[idx].description = e.target.value;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={acc.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.ducting.accessories[idx].qty = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={acc.unit}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.ducting.accessories[idx].unit = e.target.value;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={acc.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.ducting.accessories[idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">{formatCurrency(acc.qty * acc.ur)}</td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={acc.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.ducting.accessories[idx].remarks = val;
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        c.lowSide.materialEstimate.ducting.accessories.splice(idx, 1);
                                      })}
                                      className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 border-t border-border/30 flex items-center justify-between border-b border-border/30">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                if (!c.lowSide.materialEstimate.ducting.accessories) {
                                  c.lowSide.materialEstimate.ducting.accessories = [];
                                }
                                c.lowSide.materialEstimate.ducting.accessories.push({ description: "New Item", qty: 0, unit: "Lot", ur: 0, remarks: "" });
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Accessory Row
                            </button>
                            {(() => {
                              const accTotal = (activeCosting.lowSide.materialEstimate.ducting.accessories || []).reduce((sum: number, a: any) => sum + (a.qty * a.ur), 0);
                              return (
                                <span className="text-sm font-bold text-slate-800">Accessories Subtotal: {formatCurrency(accTotal)}</span>
                              );
                            })()}
                          </div>
                          {(() => {
                            const gssTotal = activeCosting.lowSide.materialEstimate.ducting.gssDucting.reduce((sum: number, d: any) => {
                              const numSheets = d.qtySqMtr / 3;
                              const totalWt = numSheets * d.wtPerSheet;
                              return sum + (totalWt * d.ratePerKg);
                            }, 0);
                            const thermalInsSqMtr = activeCosting.lowSide.materialEstimate.ducting.gssDucting.find((d: any) => d.gauge.includes("24"))?.qtySqMtr || 0;
                            const acousticInsSqMtr = activeCosting.lowSide.materialEstimate.ducting.gssDucting.find((d: any) => d.gauge.includes("22"))?.qtySqMtr || 0;
                            const thermalTotal = thermalInsSqMtr * activeCosting.lowSide.materialEstimate.ducting.thermalInsulationUR;
                            const acousticTotal = acousticInsSqMtr * activeCosting.lowSide.materialEstimate.ducting.acousticInsulationUR;
                            const accTotal = (activeCosting.lowSide.materialEstimate.ducting.accessories || []).reduce((sum: number, a: any) => sum + (a.qty * a.ur), 0);
                            const total = gssTotal + thermalTotal + acousticTotal + accTotal;
                            return (
                              <div className="flex justify-end items-center p-3 bg-slate-50">
                                <span className="text-sm font-bold text-slate-800">Ducting Grand Total: {formatCurrency(total)}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  }
                },
                   {
                    id: "airterminals",
                    title: "8. Air Terminals",
                    render: () => {
                      const rawItems = activeCosting.lowSide.materialEstimate.airTerminals?.items || [];
                      const items = rawItems.filter((item: IEstimateItem) => item.description.toLowerCase() !== "freight");
                      const subtotal = items.reduce((sum, item) => {
                        const rowTotal = (item.area && item.area > 0) ? (item.area * item.ur) : (item.qty * item.ur);
                        return sum + rowTotal;
                      }, 0);
                      const freightRate = activeCosting.lowSide.materialEstimate.airTerminals?.freightRate !== undefined ? activeCosting.lowSide.materialEstimate.airTerminals.freightRate : 0.10;
                      const freightAmount = subtotal * freightRate;
                      const grandTotal = subtotal + freightAmount;
                      return (
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full border-collapse text-left text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Grill Size / Description</th>
                                <th className="p-3 w-24 text-center">Qty</th>
                                <th className="p-3 w-32 text-right" title="Sq. ft area â€” if filled, Total = Area Ã— Rate instead of Qty Ã— Rate">Area (Sq.ft)</th>
                                <th className="p-3 w-32 text-right">Rate / Sq.ft</th>
                                <th className="p-3 w-36 text-right">Total</th>
                                <th className="p-3 w-10 text-center">Note</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {items.map((item: IEstimateItem, idx: number) => {
                                const rowTotal = (item.area && item.area > 0) ? (item.area * item.ur) : (item.qty * item.ur);
                                return (
                                  <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                    <td className="p-2">
                                      <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => handleFieldChange((c) => {
                                          if (!c.lowSide.materialEstimate.airTerminals.items) c.lowSide.materialEstimate.airTerminals.items = [];
                                          // Find correct index in rawItems since we filtered it
                                          const originalIdx = rawItems.indexOf(item);
                                          if (originalIdx !== -1) {
                                            c.lowSide.materialEstimate.airTerminals.items[originalIdx].description = e.target.value;
                                          }
                                        })}
                                        className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        value={item.qty}
                                        onChange={(e) => handleFieldChange((c) => {
                                          if (!c.lowSide.materialEstimate.airTerminals.items) c.lowSide.materialEstimate.airTerminals.items = [];
                                          const originalIdx = rawItems.indexOf(item);
                                          if (originalIdx !== -1) {
                                            c.lowSide.materialEstimate.airTerminals.items[originalIdx].qty = parseFloat(e.target.value) || 0;
                                          }
                                        })}
                                        className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                      />
                                    </td>
                                    {/* Area column â€” numeric sq.ft. When filled, Total = Area Ã— Rate */}
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        step="0.001"
                                        value={item.area || ""}
                                        onChange={(e) => handleFieldChange((c) => {
                                          if (!c.lowSide.materialEstimate.airTerminals.items) c.lowSide.materialEstimate.airTerminals.items = [];
                                          const originalIdx = rawItems.indexOf(item);
                                          if (originalIdx !== -1) {
                                            c.lowSide.materialEstimate.airTerminals.items[originalIdx].area = parseFloat(e.target.value) || 0;
                                          }
                                        })}
                                        placeholder="â€”"
                                        title="Area in Sq.ft â€” if filled, Total = Area Ã— Rate (instead of Qty Ã— Rate)"
                                        className="h-9 w-full rounded border border-sky-200 bg-sky-50 px-2 text-right text-sm font-medium text-sky-800 placeholder:text-sky-200 focus:outline-none focus:ring-1 focus:ring-sky-400"
                                      />
                                    </td>
                                    <td className="p-2">
                                      <input
                                        type="number"
                                        value={item.ur}
                                        onChange={(e) => handleFieldChange((c) => {
                                          if (!c.lowSide.materialEstimate.airTerminals.items) c.lowSide.materialEstimate.airTerminals.items = [];
                                          const originalIdx = rawItems.indexOf(item);
                                          if (originalIdx !== -1) {
                                            c.lowSide.materialEstimate.airTerminals.items[originalIdx].ur = parseFloat(e.target.value) || 0;
                                          }
                                        })}
                                        className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                      />
                                    </td>
                                    <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                      {formatCurrency(rowTotal)}
                                      {(item.area && item.area > 0) && (
                                        <div className="text-[10px] text-sky-500 font-normal">{item.area} Ã— {item.ur}</div>
                                      )}
                                    </td>
                                    <td className="p-2 text-center">
                                      <RemarkCell
                                        remark={item.remarks}
                                        onSave={(val) => handleFieldChange((c) => {
                                          if (!c.lowSide.materialEstimate.airTerminals.items) c.lowSide.materialEstimate.airTerminals.items = [];
                                          const originalIdx = rawItems.indexOf(item);
                                          if (originalIdx !== -1) {
                                            c.lowSide.materialEstimate.airTerminals.items[originalIdx].remarks = val;
                                          }
                                        })}
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <button
                                        onClick={() => handleFieldChange((c) => {
                                          if (c.lowSide.materialEstimate.airTerminals.items) {
                                            const originalIdx = rawItems.indexOf(item);
                                            if (originalIdx !== -1) {
                                              c.lowSide.materialEstimate.airTerminals.items.splice(originalIdx, 1);
                                            }
                                          }
                                        })}
                                        className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <div className="p-4 bg-slate-50/50 border-t border-border/30 flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                if (!c.lowSide.materialEstimate.airTerminals.items) c.lowSide.materialEstimate.airTerminals.items = [];
                                c.lowSide.materialEstimate.airTerminals.items.push({ description: "New Item", qty: 0, unit: "Nos", ur: 0, area: 0, remarks: "" });
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition duration-200 w-fit shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Row
                            </button>
                            <div className="space-y-1.5 text-right font-medium text-slate-600 min-w-[260px] text-sm self-end">
                              <div className="flex justify-between gap-8">
                                <span>Subtotal:</span>
                                <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center gap-8">
                                <span>Freight Percentage:</span>
                                <div className="relative w-20">
                                  <input
                                    type="number"
                                    step="1"
                                    value={Math.round(freightRate * 100)}
                                    onChange={(e) => handleFieldChange((c) => {
                                      if (!c.lowSide.materialEstimate.airTerminals) {
                                        c.lowSide.materialEstimate.airTerminals = { items: [] };
                                      }
                                      c.lowSide.materialEstimate.airTerminals.freightRate = (parseFloat(e.target.value) || 0) / 100;
                                    })}
                                    className="h-7 w-full rounded border border-border bg-white text-center text-xs font-bold text-slate-800 pr-4 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                  <span className="absolute right-1.5 top-1 text-[10px] text-muted-foreground font-bold">%</span>
                                </div>
                              </div>
                              <div className="flex justify-between gap-8">
                                <span>Freight Amount:</span>
                                <span className="font-semibold text-slate-800">{formatCurrency(freightAmount)}</span>
                              </div>
                              <div className="flex justify-between text-base font-bold text-slate-900 border-t pt-1.5 mt-1 gap-8">
                                <span>Grand Total:</span>
                                <span>{formatCurrency(grandTotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    id: "eyeball",
                    title: "9. Eyeball Diffusers",
                    render: () => {
                      const rawItems = activeCosting.lowSide.materialEstimate.eyeballDiffuser?.items || [];
                      const items = rawItems.filter((item: IEstimateItem) => item.description.toLowerCase() !== "freight");
                      const subtotal = items.reduce((sum, item) => sum + (item.qty * item.ur), 0);
                      const freightRate = activeCosting.lowSide.materialEstimate.eyeballDiffuser?.freightRate !== undefined ? activeCosting.lowSide.materialEstimate.eyeballDiffuser.freightRate : 0.10;
                      const freightAmount = subtotal * freightRate;
                      const grandTotal = subtotal + freightAmount;
                      return (
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full border-collapse text-left text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Description</th>
                                <th className="p-3 w-32 text-center">Qty</th>
                                <th className="p-3 w-28 text-center">Unit</th>
                                <th className="p-3 w-32 text-right">Unit Rate</th>
                                <th className="p-3 w-36 text-right">Total Cost</th>
                                <th className="p-3 w-10 text-center">Note</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {items.map((item: IEstimateItem, idx: number) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.eyeballDiffuser.items) c.lowSide.materialEstimate.eyeballDiffuser.items = [];
                                        const originalIdx = rawItems.indexOf(item);
                                        if (originalIdx !== -1) {
                                          c.lowSide.materialEstimate.eyeballDiffuser.items[originalIdx].description = e.target.value;
                                        }
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.eyeballDiffuser.items) c.lowSide.materialEstimate.eyeballDiffuser.items = [];
                                        const originalIdx = rawItems.indexOf(item);
                                        if (originalIdx !== -1) {
                                          c.lowSide.materialEstimate.eyeballDiffuser.items[originalIdx].qty = parseFloat(e.target.value) || 0;
                                        }
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.unit}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.eyeballDiffuser.items) c.lowSide.materialEstimate.eyeballDiffuser.items = [];
                                        const originalIdx = rawItems.indexOf(item);
                                        if (originalIdx !== -1) {
                                          c.lowSide.materialEstimate.eyeballDiffuser.items[originalIdx].unit = e.target.value;
                                        }
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.eyeballDiffuser.items) c.lowSide.materialEstimate.eyeballDiffuser.items = [];
                                        const originalIdx = rawItems.indexOf(item);
                                        if (originalIdx !== -1) {
                                          c.lowSide.materialEstimate.eyeballDiffuser.items[originalIdx].ur = parseFloat(e.target.value) || 0;
                                        }
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(item.qty * item.ur)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={item.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.eyeballDiffuser.items) c.lowSide.materialEstimate.eyeballDiffuser.items = [];
                                        const originalIdx = rawItems.indexOf(item);
                                        if (originalIdx !== -1) {
                                          c.lowSide.materialEstimate.eyeballDiffuser.items[originalIdx].remarks = val;
                                        }
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        if (c.lowSide.materialEstimate.eyeballDiffuser.items) {
                                          const originalIdx = rawItems.indexOf(item);
                                          if (originalIdx !== -1) {
                                            c.lowSide.materialEstimate.eyeballDiffuser.items.splice(originalIdx, 1);
                                          }
                                        }
                                      })}
                                      className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-4 bg-slate-50/50 border-t border-border/30 flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                if (!c.lowSide.materialEstimate.eyeballDiffuser.items) c.lowSide.materialEstimate.eyeballDiffuser.items = [];
                                c.lowSide.materialEstimate.eyeballDiffuser.items.push({ description: "New Item", qty: 0, unit: "Nos", ur: 0, remarks: "" });
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition duration-200 w-fit shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Row
                            </button>
                            <div className="space-y-1.5 text-right font-medium text-slate-600 min-w-[260px] text-sm self-end">
                              <div className="flex justify-between gap-8">
                                <span>Subtotal:</span>
                                <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center gap-8">
                                <span>Freight Percentage:</span>
                                <div className="relative w-20">
                                  <input
                                    type="number"
                                    step="1"
                                    value={Math.round(freightRate * 100)}
                                    onChange={(e) => handleFieldChange((c) => {
                                      if (!c.lowSide.materialEstimate.eyeballDiffuser) {
                                        c.lowSide.materialEstimate.eyeballDiffuser = { items: [] };
                                      }
                                      c.lowSide.materialEstimate.eyeballDiffuser.freightRate = (parseFloat(e.target.value) || 0) / 100;
                                    })}
                                    className="h-7 w-full rounded border border-border bg-white text-center text-xs font-bold text-slate-800 pr-4 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                  <span className="absolute right-1.5 top-1 text-[10px] text-muted-foreground font-bold">%</span>
                                </div>
                              </div>
                              <div className="flex justify-between gap-8">
                                <span>Freight Amount:</span>
                                <span className="font-semibold text-slate-800">{formatCurrency(freightAmount)}</span>
                              </div>
                              <div className="flex justify-between text-base font-bold text-slate-900 border-t pt-1.5 mt-1 gap-8">
                                <span>Grand Total:</span>
                                <span>{formatCurrency(grandTotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    id: "odustand",
                    title: "10. ODU Stands",
                    render: () => {
                      const items = activeCosting.lowSide.materialEstimate.oduStand?.items || [];
                      const total = items.reduce((sum, item) => sum + (item.qty * item.ur), 0);
                      return (
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full border-collapse text-left text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Description</th>
                                <th className="p-3 w-32 text-center">Qty</th>
                                <th className="p-3 w-28 text-center">Unit</th>
                                <th className="p-3 w-32 text-right">Unit Rate</th>
                                <th className="p-3 w-36 text-right">Total Cost</th>
                                <th className="p-3 w-10 text-center">Note</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {items.map((item: IEstimateItem, idx: number) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.oduStand.items) c.lowSide.materialEstimate.oduStand.items = [];
                                        c.lowSide.materialEstimate.oduStand.items![idx].description = e.target.value;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.oduStand.items) c.lowSide.materialEstimate.oduStand.items = [];
                                        c.lowSide.materialEstimate.oduStand.items![idx].qty = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.unit}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.oduStand.items) c.lowSide.materialEstimate.oduStand.items = [];
                                        c.lowSide.materialEstimate.oduStand.items![idx].unit = e.target.value;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.oduStand.items) c.lowSide.materialEstimate.oduStand.items = [];
                                        c.lowSide.materialEstimate.oduStand.items![idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(item.qty * item.ur)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={item.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.oduStand.items) c.lowSide.materialEstimate.oduStand.items = [];
                                        c.lowSide.materialEstimate.oduStand.items![idx].remarks = val;
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        if (c.lowSide.materialEstimate.oduStand.items) {
                                          c.lowSide.materialEstimate.oduStand.items.splice(idx, 1);
                                        }
                                      })}
                                      className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 border-t border-border/30 flex items-center justify-between">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                if (!c.lowSide.materialEstimate.oduStand.items) c.lowSide.materialEstimate.oduStand.items = [];
                                c.lowSide.materialEstimate.oduStand.items.push({ description: "New Item", qty: 0, unit: "Nos", ur: 0, remarks: "" });
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Row
                            </button>
                            <span className="text-sm font-bold text-slate-800">Total: {formatCurrency(total)}</span>
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    id: "pvccasing",
                    title: "11. PVC Casing Caps",
                    render: () => {
                      const items = activeCosting.lowSide.materialEstimate.pvcCasingCap?.items || [];
                      const total = items.reduce((sum, item) => sum + (item.qty * item.ur), 0);
                      return (
                        <div className="border border-border bg-white rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full border-collapse text-left text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                                <th className="p-3">Description</th>
                                <th className="p-3 w-32 text-center">Qty</th>
                                <th className="p-3 w-28 text-center">Unit</th>
                                <th className="p-3 w-32 text-right">Unit Rate</th>
                                <th className="p-3 w-36 text-right">Total Cost</th>
                                <th className="p-3 w-10 text-center">Note</th>
                                <th className="p-3 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {items.map((item: IEstimateItem, idx: number) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.pvcCasingCap.items) c.lowSide.materialEstimate.pvcCasingCap.items = [];
                                        c.lowSide.materialEstimate.pvcCasingCap.items![idx].description = e.target.value;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.qty}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.pvcCasingCap.items) c.lowSide.materialEstimate.pvcCasingCap.items = [];
                                        c.lowSide.materialEstimate.pvcCasingCap.items![idx].qty = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={item.unit}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.pvcCasingCap.items) c.lowSide.materialEstimate.pvcCasingCap.items = [];
                                        c.lowSide.materialEstimate.pvcCasingCap.items![idx].unit = e.target.value;
                                      })}
                                      className="h-9 w-full text-center rounded border border-border bg-white px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      value={item.ur}
                                      onChange={(e) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.pvcCasingCap.items) c.lowSide.materialEstimate.pvcCasingCap.items = [];
                                        c.lowSide.materialEstimate.pvcCasingCap.items![idx].ur = parseFloat(e.target.value) || 0;
                                      })}
                                      className="h-9 w-full rounded border border-border bg-white px-3 text-right text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                    {formatCurrency(item.qty * item.ur)}
                                  </td>
                                  <td className="p-2 text-center">
                                    <RemarkCell
                                      remark={item.remarks}
                                      onSave={(val) => handleFieldChange((c) => {
                                        if (!c.lowSide.materialEstimate.pvcCasingCap.items) c.lowSide.materialEstimate.pvcCasingCap.items = [];
                                        c.lowSide.materialEstimate.pvcCasingCap.items![idx].remarks = val;
                                      })}
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleFieldChange((c) => {
                                        if (c.lowSide.materialEstimate.pvcCasingCap.items) {
                                          c.lowSide.materialEstimate.pvcCasingCap.items.splice(idx, 1);
                                        }
                                      })}
                                      className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-3 border-t border-border/30 flex items-center justify-between">
                            <button
                              onClick={() => handleFieldChange((c) => {
                                if (!c.lowSide.materialEstimate.pvcCasingCap.items) c.lowSide.materialEstimate.pvcCasingCap.items = [];
                                c.lowSide.materialEstimate.pvcCasingCap.items.push({ description: "New Item", qty: 0, unit: "Rmt", ur: 0, remarks: "" });
                              })}
                              className="flex items-center gap-1.5 text-xs font-bold px-4 h-9 rounded-lg border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 transition duration-200"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Row
                            </button>
                            <span className="text-sm font-bold text-slate-800">Total: {formatCurrency(total)}</span>
                          </div>
                        </div>
                      );
                    }
                  }

                ].map((sec) => (
                  <div key={sec.id} className="border border-border/80 bg-card rounded-xl overflow-hidden shadow-sm">
                    <div className="w-full flex items-center justify-between p-4 font-semibold text-slate-800 text-sm bg-muted/20 border-b border-border/40">
                      <span>{sec.title}</span>
                    </div>
                    <div className="p-4 bg-white">{sec.render()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: COPPER PIPE RATES */}
          {activeTab === "copper_pipes" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
                <div className="bg-muted/30 border-b border-border/40 p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold uppercase text-slate-700">Hard Pipes Rates (Rmt)</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 normal-case font-medium">
                      Changes here automatically update suggestions in Refrigerant Piping calculations.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRateModalMode("add");
                      setRateForm({ size: "", type: "hard", rate: 0, sleeveRate: 0, unit: "M", remarks: "" });
                      setIsRateModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-pink-700 hover:bg-pink-850 text-white rounded-lg transition shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Hard Pipe Size
                  </button>
                </div>
                <div className="p-4 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm table-fixed min-w-[800px]">
                      <thead>
                        <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                          <th className="p-3 w-1/4">CU Size (inches/mm)</th>
                          <th className="p-3 w-32 text-right">Rate</th>
                          <th className="p-3 w-32 text-right">Sleeve Rate</th>
                          <th className="p-3 w-28 text-center">Unit</th>
                          <th className="p-3 w-32 text-right">Total</th>
                          <th className="p-3 w-36 text-right">Add 10% Access</th>
                          <th className="p-3">Remarks</th>
                          <th className="p-3 w-24 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {copperPipeRates.filter(r => r.type === "hard").length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs font-medium">
                              No hard pipe rates configured. Click the button above to add one.
                            </td>
                          </tr>
                        ) : (
                          copperPipeRates.map((cr, idx) => {
                            if (cr.type !== "hard") return null;
                            const total = cr.rate + cr.sleeveRate;
                            const add10 = total * 1.1;
                            return (
                              <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                <td className="p-3 font-semibold text-slate-800">
                                  {cr.size}
                                </td>
                                <td className="p-3 text-right font-medium text-slate-700">
                                  {formatCurrency(cr.rate)}
                                </td>
                                <td className="p-3 text-right font-medium text-slate-700">
                                  {formatCurrency(cr.sleeveRate)}
                                </td>
                                <td className="p-3 text-center text-slate-600">
                                  {cr.unit}
                                </td>
                                <td className="p-3 text-right font-semibold text-slate-700">
                                  {formatCurrency(total)}
                                </td>
                                <td className="p-3 text-right font-semibold text-slate-700">
                                  {formatCurrency(add10)}
                                </td>
                                <td className="p-3 text-slate-500 text-xs italic">
                                  {cr.remarks || "â€”"}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedRate(cr);
                                        setRateModalMode("edit");
                                        setRateForm({
                                          size: cr.size,
                                          type: cr.type,
                                          rate: cr.rate,
                                          sleeveRate: cr.sleeveRate,
                                          unit: cr.unit,
                                          remarks: cr.remarks || ""
                                        });
                                        setIsRateModalOpen(true);
                                      }}
                                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded transition duration-150"
                                      title="Edit Rate"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedRate(cr);
                                        setIsDeleteRateConfirmOpen(true);
                                      }}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                      title="Delete Rate"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SOFT PIPES CONFIG */}
              <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
                <div className="bg-muted/30 border-b border-border/40 p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-700">Soft Pipes Rates (Rmt)</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 normal-case font-medium">
                      Changes here automatically update suggestions in Refrigerant Piping calculations.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRateModalMode("add");
                      setRateForm({ size: "", type: "soft", rate: 0, sleeveRate: 0, unit: "M", remarks: "" });
                      setIsRateModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-pink-700 hover:bg-pink-850 text-white rounded-lg transition shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Soft Pipe Size
                  </button>
                </div>
                <div className="p-4 bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm table-fixed min-w-[800px]">
                      <thead>
                        <tr className="bg-muted text-muted-foreground uppercase font-bold text-xs tracking-wider border-b">
                          <th className="p-3 w-1/4">CU Size (inches/mm)</th>
                          <th className="p-3 w-32 text-right">Rate</th>
                          <th className="p-3 w-32 text-right">Sleeve Rate</th>
                          <th className="p-3 w-28 text-center">Unit</th>
                          <th className="p-3 w-32 text-right">Total</th>
                          <th className="p-3 w-36 text-right">Add 10% Access</th>
                          <th className="p-3">Remarks</th>
                          <th className="p-3 w-24 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {copperPipeRates.filter(r => r.type === "soft").length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs font-medium">
                              No soft pipe rates configured. Click the button above to add one.
                            </td>
                          </tr>
                        ) : (
                          copperPipeRates.map((cr, idx) => {
                            if (cr.type !== "soft") return null;
                            const total = cr.rate + cr.sleeveRate;
                            const add10 = total * 1.1;
                            return (
                              <tr key={idx} className="bg-white hover:bg-slate-50/40">
                                <td className="p-3 font-semibold text-slate-800">
                                  {cr.size}
                                </td>
                                <td className="p-3 text-right font-medium text-slate-700">
                                  {formatCurrency(cr.rate)}
                                </td>
                                <td className="p-3 text-right font-medium text-slate-700">
                                  {formatCurrency(cr.sleeveRate)}
                                </td>
                                <td className="p-3 text-center text-slate-600">
                                  {cr.unit}
                                </td>
                                <td className="p-3 text-right font-semibold text-slate-700">
                                  {formatCurrency(total)}
                                </td>
                                <td className="p-3 text-right font-semibold text-slate-700">
                                  {formatCurrency(add10)}
                                </td>
                                <td className="p-3 text-slate-500 text-xs italic">
                                  {cr.remarks || "â€”"}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedRate(cr);
                                        setRateModalMode("edit");
                                        setRateForm({
                                          size: cr.size,
                                          type: cr.type,
                                          rate: cr.rate,
                                          sleeveRate: cr.sleeveRate,
                                          unit: cr.unit,
                                          remarks: cr.remarks || ""
                                        });
                                        setIsRateModalOpen(true);
                                      }}
                                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded transition duration-150"
                                      title="Edit Rate"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedRate(cr);
                                        setIsDeleteRateConfirmOpen(true);
                                      }}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition duration-150"
                                      title="Delete Rate"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* APPROVAL MODAL */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Confirm Costing Sheet Approval</h3>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              Are you sure you want to approve this costing sheet? This will record the approval under your name: <strong>{user?.name || "Admin"}</strong>.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="px-4 h-9 text-xs font-bold border border-border text-foreground hover:bg-muted rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const finalApproverName = user?.name || "Admin";
                  setIsApproveModalOpen(false);
                  setIsSaving(true);
                  try {
                    // Update activeCosting state
                    handleFieldChange((c) => {
                      c.approvedBy = finalApproverName;
                    });
                    
                    // Immediately calculate and update on backend
                    const finalCalculated = calculateCosting({
                      ...activeCosting!,
                      approvedBy: finalApproverName
                    });
                    
                    const res = await updateCostingApi(activeCosting!.id!, finalCalculated);
                    if (res.success) {
                      setActiveCosting(res.data);
                      toast.success("Costing approved and saved successfully!");
                      const listRes = await getCostingsByEnquiryIdApi(enquiry.id!);
                      if (listRes.success) setCostings(listRes.data);
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Failed to approve costing sheet");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="px-4 h-9 text-xs font-bold bg-pink-700 hover:bg-pink-850 text-white rounded-lg transition"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE RATE CONFIRMATION MODAL */}
      {isDeleteRateConfirmOpen && selectedRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              Are you sure you want to delete the copper pipe rate for size <strong>{selectedRate.size}</strong> ({selectedRate.type === "hard" ? "Hard" : "Soft"} Pipe)?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsDeleteRateConfirmOpen(false);
                  setSelectedRate(null);
                }}
                className="px-4 h-9 text-xs font-bold border border-border text-foreground hover:bg-muted rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (selectedRate._id) {
                    try {
                      setIsSaving(true);
                      const res = await deleteCopperPipeRateApi(selectedRate._id);
                      if (res.success) {
                        toast.success("Copper pipe rate deleted successfully!");
                        loadCopperPipeRates();
                      } else {
                        toast.error("Failed to delete copper pipe rate");
                      }
                    } catch (error) {
                      console.error(error);
                      toast.error("Failed to delete copper pipe rate");
                    } finally {
                      setIsSaving(false);
                    }
                  }
                  setIsDeleteRateConfirmOpen(false);
                  setSelectedRate(null);
                }}
                disabled={isSaving}
                className="px-4 h-9 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-1.5"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT COPPER PIPE RATE MODAL */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-800">
              {rateModalMode === "add" ? "Add Copper Pipe Rate" : "Edit Copper Pipe Rate"}
            </h3>
            <div className="space-y-4 mt-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">CU Size (inches/mm)</label>
                <input
                  type="text"
                  value={rateForm.size}
                  onChange={(e) => setRateForm(prev => ({ ...prev, size: e.target.value }))}
                  className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="e.g. 1 1/8 (28.3)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Type</label>
                  <select
                    value={rateForm.type}
                    onChange={(e) => setRateForm(prev => ({ ...prev, type: e.target.value as "hard" | "soft" }))}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold"
                  >
                    <option value="hard">Hard Pipe</option>
                    <option value="soft">Soft Pipe</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Unit</label>
                  <input
                    type="text"
                    value={rateForm.unit}
                    onChange={(e) => setRateForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-center font-bold"
                    placeholder="M"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Rate (â‚¹)</label>
                  <input
                    type="number"
                    value={rateForm.rate}
                    onChange={(e) => setRateForm(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-right font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Sleeve Rate (â‚¹)</label>
                  <input
                    type="number"
                    value={rateForm.sleeveRate}
                    onChange={(e) => setRateForm(prev => ({ ...prev, sleeveRate: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 text-right font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Remarks</label>
                <input
                  type="text"
                  value={rateForm.remarks || ""}
                  onChange={(e) => setRateForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="mt-1 h-9 w-full rounded border border-border bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Remarks..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsRateModalOpen(false);
                  setSelectedRate(null);
                }}
                className="px-4 h-9 text-xs font-bold border border-border text-foreground hover:bg-muted rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rateForm.size) {
                    toast.error("Please enter a size");
                    return;
                  }
                  setIsSaving(true);
                  try {
                    if (rateModalMode === "add") {
                      const res = await createCopperPipeRateApi(rateForm);
                      if (res.success) {
                        toast.success("Copper pipe rate created successfully!");
                        loadCopperPipeRates();
                        setIsRateModalOpen(false);
                      } else {
                        toast.error("Failed to create copper pipe rate");
                      }
                    } else if (rateModalMode === "edit" && selectedRate?._id) {
                      const res = await updateCopperPipeRateApi(selectedRate._id, rateForm);
                      if (res.success) {
                        toast.success("Copper pipe rate updated successfully!");
                        loadCopperPipeRates();
                        setIsRateModalOpen(false);
                      } else {
                        toast.error("Failed to update copper pipe rate");
                      }
                    }
                  } catch (error) {
                    console.error(error);
                    toast.error("Failed to save copper pipe rate");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="px-4 h-9 text-xs font-bold bg-pink-700 hover:bg-pink-850 text-white rounded-lg transition flex items-center justify-center gap-1.5"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

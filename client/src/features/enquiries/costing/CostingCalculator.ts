import { ICosting, IEstimateItem, IMaterialEstimate, ILowSideItem, ICopperPipeRateConfig } from "../../../interfaces/costing.interface";

export const DEFAULT_COPPER_PIPE_RATES: ICopperPipeRateConfig[] = [
  // Hard Pipes
  { size: "1/4 (6.34)", type: "hard", rate: 172, sleeveRate: 35, unit: "M", remarks: "MEXFLOW" },
  { size: "3/8 (9.35)", type: "hard", rate: 210, sleeveRate: 42, unit: "M", remarks: "PARASMINI" },
  { size: "1/2 (12.7)", type: "hard", rate: 310, sleeveRate: 48, unit: "M", remarks: "PARASMINI" },
  { size: "5/8 (15.88)", type: "hard", rate: 395, sleeveRate: 56, unit: "M", remarks: "PARASMINI" },
  { size: "3/4 (19.05)", type: "hard", rate: 0, sleeveRate: 62, unit: "M", remarks: "PARASMINI" },
  { size: "7/8 (22.3)", type: "hard", rate: 555, sleeveRate: 72, unit: "M", remarks: "PARASMINI" },
  { size: "1 (25.4)", type: "hard", rate: 0, sleeveRate: 86, unit: "M", remarks: "PARASMINI" },
  { size: "1 1/8 (28.3)", type: "hard", rate: 825, sleeveRate: 86, unit: "M", remarks: "NIPPON" },
  { size: "31.2", type: "hard", rate: 0, sleeveRate: 0, unit: "M", remarks: "PARASMINI" },
  { size: "34.05", type: "hard", rate: 1012, sleeveRate: 106, unit: "M", remarks: "PARASMINI" },
  { size: "38.03", type: "hard", rate: 0, sleeveRate: 0, unit: "M", remarks: "PARASMINI" },
  { size: "41.2", type: "hard", rate: 1585, sleeveRate: 111, unit: "M", remarks: "PARASMINI" },

  // Soft Pipes
  { size: "1/4 (6.34)", type: "soft", rate: 142.67, sleeveRate: 35, unit: "M", remarks: "UNIFLOW" },
  { size: "3/8 (9.35)", type: "soft", rate: 211.11, sleeveRate: 42, unit: "M", remarks: "UNIFLOW" },
  { size: "1/2 (12.7)", type: "soft", rate: 349.07, sleeveRate: 48, unit: "M", remarks: "UNIFLOW" },
  { size: "5/8 (15.88)", type: "soft", rate: 447.33, sleeveRate: 56, unit: "M", remarks: "UNIFLOW" }
];

export function normalizeSize(size: string | number): number {
  if (typeof size === "number") return size;
  if (!size) return 0;
  const clean = size.toString().replace(/"/g, "").trim();
  if (clean === "1/4" || clean === "6.34" || clean === "1/4 (6.34)") return 0.25;
  if (clean === "3/8" || clean === "9.35" || clean === "3/8 (9.35)") return 0.375;
  if (clean === "1/2" || clean === "12.7" || clean === "1/2 (12.7)" || clean === "0.5") return 0.5;
  if (clean === "5/8" || clean === "15.88" || clean === "5/8 (15.88)" || clean === "0.625") return 0.625;
  if (clean === "3/4" || clean === "19.05" || clean === "3/4 (19.05)" || clean === "0.75") return 0.75;
  if (clean === "7/8" || clean === "22.3" || clean === "7/8 (22.3)" || clean === "0.875") return 0.875;
  if (clean === "1" || clean === "25.4" || clean === "1 (25.4)") return 1.0;
  if (clean === "1 1/8" || clean === "1.125" || clean === "28.3" || clean === "1.125\"" || clean === "1 1/8 (28.3)") return 1.125;
  
  const parts = clean.split(/\s+/);
  if (parts.length === 2) {
    const whole = parseFloat(parts[0]);
    const fracParts = parts[1].split("/");
    if (fracParts.length === 2) {
      return whole + parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    }
  }
  const fracParts = clean.split("/");
  if (fracParts.length === 2) {
    return parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
  }
  return parseFloat(clean) || 0;
}

// ---------------------------------------------------------------------------
// MIGRATION HELPER
// If the costing was saved in the old scalar format, convert it to the new
// array-based format so existing data is never lost.
// ---------------------------------------------------------------------------
function ensureCommonItems(items: any[], defaults: { description: string; unit: string; ur: number }[]) {
  defaults.forEach(def => {
    const exists = items.some(item => (item.description || "").toLowerCase() === def.description.toLowerCase());
    if (!exists) {
      items.push({ description: def.description, qty: 0, unit: def.unit, ur: def.ur, remarks: "" });
    }
  });
}

function ensureCommonCables(items: any[], defaults: { size: string; ur: number }[]) {
  defaults.forEach(def => {
    const exists = items.some(item => (item.size || "").toLowerCase() === def.size.toLowerCase());
    if (!exists) {
      items.push({ size: def.size, qty: 0, ur: def.ur, remarks: "" });
    }
  });
}

function ensureCommonPipes(items: any[], defaults: { size: string; ur: number }[]) {
  defaults.forEach(def => {
    const exists = items.some(item => (item.size || "").toLowerCase() === def.size.toLowerCase());
    if (!exists) {
      items.push({ size: def.size, qty: 0, ur: def.ur, remarks: "" });
    }
  });
}

function ensureCommonDucts(items: any[], defaults: any[]) {
  defaults.forEach(def => {
    const exists = items.some(item => (item.gauge || "").toLowerCase() === def.gauge.toLowerCase());
    if (!exists) {
      items.push({ ...def, numSheets: 0, qtySqMtr: 0, remarks: "" });
    }
  });
}

function ensureCommonCopperPipes(items: any[], defaults: { size: string; type: string; ur: number }[]) {
  defaults.forEach(def => {
    const exists = items.some(item => (item.size || "").toString().toLowerCase() === def.size.toLowerCase() && (item.type || "").toLowerCase() === def.type.toLowerCase());
    if (!exists) {
      items.push({ size: def.size, type: def.type, qty: 0, ur: def.ur, remarks: "" });
    }
  });
}

function ensureCommonInsulation(items: any[], defaults: { size: string; ur: number }[]) {
  defaults.forEach(def => {
    const exists = items.some(item => (item.size || "").toString().toLowerCase() === def.size.toLowerCase());
    if (!exists) {
      items.push({ size: def.size, qty: 0, ur: def.ur, remarks: "" });
    }
  });
}

function migrateEstimate(est: any): IMaterialEstimate {
  // --- Installation ---
  if (!est.installation) est.installation = { items: [] };
  if (!est.installation.items) {
    const old = est.installation || {};
    est.installation.items = [
      ...(old.threadRodQty !== undefined || old.threadRodUR !== undefined
        ? [{ description: "Thread Rod", qty: old.threadRodQty || 0, unit: "Lot", ur: old.threadRodUR || 550, remarks: "" }]
        : []),
      ...(old.rubberPadQty !== undefined || old.rubberPadUR !== undefined
        ? [{ description: "Rubber Pad", qty: old.rubberPadQty || 0, unit: "Nos", ur: old.rubberPadUR || 250, remarks: "" }]
        : []),
    ];
  }
  ensureCommonItems(est.installation.items, [
    { description: "Thread Rod", unit: "Lot", ur: 550 },
    { description: "Rubber Pad", unit: "Nos", ur: 250 }
  ]);

  // --- Testing & Commissioning ---
  if (!est.testingCommissioning) est.testingCommissioning = { items: [] };
  if (!est.testingCommissioning.items) {
    const old = est.testingCommissioning || {};
    est.testingCommissioning.items = [
      ...(old.nitrogenQty !== undefined || old.nitrogenUR !== undefined
        ? [{ description: "Nitrogen Testing", qty: old.nitrogenQty || 0, unit: "Cylinder", ur: old.nitrogenUR || 500, remarks: "" }]
        : [])
    ];
  }
  const hasNitrogen = est.testingCommissioning.items.some((it: any) => {
    const d = (it.description || "").toLowerCase();
    return d.includes("nitrogen");
  });
  if (!hasNitrogen) {
    est.testingCommissioning.items.push({ description: "Nitrogen Testing", qty: 0, unit: "Cylinder", ur: 500, remarks: "" });
  }

  // --- Ref Piping accessories ---
  if (!est.refPiping) est.refPiping = { copperPipes: [], insulation: [], accessories: [] };
  if (!est.refPiping.accessories) {
    const old = est.refPiping;
    est.refPiping.accessories = [
      { description: "White Tape", qty: old.whiteTapeQty || 0, unit: "Roll", ur: old.whiteTapeUR || 50, remarks: "" },
      { description: "Oxygen & LPG", qty: old.oxygenLpgQty || 0, unit: "Set", ur: old.oxygenLpgUR || 1000, remarks: "" },
      { description: "Brazing Rod", qty: old.brazingRodQty || 0, unit: "Kg", ur: old.brazingRodUR || 500, remarks: "" },
      { description: "Fittings", qty: old.fittingsQty || 0, unit: "Lot", ur: old.fittingsUR || 1500, remarks: "" },
    ];
  }
  ensureCommonItems(est.refPiping.accessories, [
    { description: "White Tape", unit: "Roll", ur: 50 },
    { description: "Oxygen & LPG", unit: "Set", ur: 1000 },
    { description: "Brazing Rod", unit: "Kg", ur: 500 },
    { description: "Fittings", unit: "Lot", ur: 1500 },
    { description: "Cable tie", unit: "Pkt", ur: 150 }
  ]);
  if (!est.refPiping.copperPipes) est.refPiping.copperPipes = [];
  ensureCommonCopperPipes(est.refPiping.copperPipes, [
    { size: "1.125\"", type: "hard", ur: 765 },
    { size: "0.875\"", type: "hard", ur: 590 },
    { size: "0.625\"", type: "hard", ur: 425 },
    { size: "0.5\"", type: "hard", ur: 340 }
  ]);

  if (!est.refPiping.insulation) est.refPiping.insulation = [];
  ensureCommonInsulation(est.refPiping.insulation, [
    { size: "1.125\"", ur: 100 },
    { size: "0.875\"", ur: 80 }
  ]);

  // --- Drain Piping accessories ---
  if (!est.drainPiping) est.drainPiping = { pvcPipes: [], accessories: [] };
  if (!est.drainPiping.accessories) {
    const old = est.drainPiping;
    est.drainPiping.accessories = [
      { description: "Shrouding", qty: old.shroudingQty || 0, unit: "Rmt", ur: old.shroudingUR || 700, remarks: "" },
      { description: "Fittings", qty: old.fittingsQty || 0, unit: "Lot", ur: old.fittingsUR || 500, remarks: "" },
    ];
  }
  ensureCommonItems(est.drainPiping.accessories, [
    { description: "Shrouding", unit: "Rmt", ur: 700 },
    { description: "Fittings", unit: "Lot", ur: 500 }
  ]);
  if (!est.drainPiping.pvcPipes) est.drainPiping.pvcPipes = [];
  ensureCommonPipes(est.drainPiping.pvcPipes, [
    { size: "25 mm", ur: 120 }
  ]);

  // --- Ducting accessories ---
  if (!est.ducting) est.ducting = { gssDucting: [], thermalInsulationUR: 130, acousticInsulationUR: 300, accessories: [] };
  if (!est.ducting.accessories) {
    const old = est.ducting;
    est.ducting.accessories = [
      { description: "Canvas Connection", qty: old.canvasQty || 0, unit: "Nos", ur: old.canvasUR || 1500, remarks: "" },
      { description: "Glue", qty: old.glueQty || 0, unit: "Kg", ur: old.glueUR || 1800, remarks: "" },
      { description: "Fittings", qty: old.fittingsQty || 0, unit: "Lot", ur: old.fittingsUR || 1500, remarks: "" },
    ];
  }
  ensureCommonItems(est.ducting.accessories, [
    { description: "Canvas Connection", unit: "Nos", ur: 1500 },
    { description: "Glue", unit: "Kg", ur: 1800 },
    { description: "Fittings", unit: "Lot", ur: 1500 }
  ]);
  if (!est.ducting.gssDucting) est.ducting.gssDucting = [];
  ensureCommonDucts(est.ducting.gssDucting, [
    { gauge: "24 SWG", wtPerSheet: 14, ratePerKg: 95, qtySqMtr: 0, ur: 0 },
    { gauge: "22 SWG", wtPerSheet: 18, ratePerKg: 93, qtySqMtr: 0, ur: 0 }
  ]);

  // Defaults for cabling sections
  if (!est.controlCabling) est.controlCabling = { cables: [] };
  ensureCommonCables(est.controlCabling.cables, [
    { size: "1.0 Sq.mm", ur: 210 }
  ]);
  if (!est.powerCabling) est.powerCabling = { cables: [] };
  ensureCommonCables(est.powerCabling.cables, [
    { size: "6.0 Sq.mm", ur: 140 }
  ]);

  // --- Air Terminals ---
  if (!est.airTerminals) {
    est.airTerminals = { items: [] };
  }
  if (!est.airTerminals.items || est.airTerminals.items.length === 0) {
    // Migrate from legacy scalar fields
    const at = est.airTerminals as any;
    const lgQty = at.linearGrillQty || 0;
    const lgRate = at.linearGrillRate || 0;
    const cdQty = at.collarDamperQty || 0;
    const cdRate = at.collarDamperRate || 0;
    const sadQty = at.sadQty || 0;
    const sadRate = at.sadRate || 0;
    const radQty = at.radQty || 0;
    const radRate = at.radRate || 0;
    const freightRate = at.freightRate || 0.10;
    const items: IEstimateItem[] = [];
    if (lgQty > 0 || lgRate > 0) items.push({ description: "Linear Grill", qty: lgQty, unit: "Sq.m", ur: lgRate * 10.764, remarks: at.linearGrillRemarks || "" });
    if (cdQty > 0 || cdRate > 0) items.push({ description: "Collar Damper", qty: cdQty, unit: "Sq.m", ur: cdRate * 10.764, remarks: at.collarDamperRemarks || "" });
    if (sadQty > 0 || sadRate > 0) items.push({ description: "SAD (Supply Air Diffuser)", qty: sadQty, unit: "Nos", ur: sadRate, remarks: at.sadRemarks || "" });
    if (radQty > 0 || radRate > 0) items.push({ description: "RAD (Return Air Diffuser)", qty: radQty, unit: "Nos", ur: radRate, remarks: at.radRemarks || "" });
    if (freightRate > 0) items.push({ description: "Freight", qty: 1, unit: "Lot", ur: 0, remarks: `${(freightRate * 100).toFixed(0)}% of subtotal` });
    est.airTerminals.items = items;
  }
  ensureCommonItems(est.airTerminals.items, [
    { description: "Linear Grill", unit: "Sq.m", ur: 4843.8 },
    { description: "Collar Damper", unit: "Sq.m", ur: 6458.4 },
    { description: "SAD (Supply Air Diffuser)", unit: "Nos", ur: 1600 },
    { description: "RAD (Return Air Diffuser)", unit: "Nos", ur: 1200 }
  ]);

  // --- Eyeball Diffuser ---
  if (!est.eyeballDiffuser) {
    est.eyeballDiffuser = { items: [] };
  }
  if (!est.eyeballDiffuser.items || est.eyeballDiffuser.items.length === 0) {
    const ed = est.eyeballDiffuser as any;
    est.eyeballDiffuser.items = [
      { description: "Eyeball Diffuser", qty: ed.diffuserQty || 0, unit: "Nos", ur: ed.diffuserRate || 3400, remarks: ed.remarks || "" }
    ];
  }
  ensureCommonItems(est.eyeballDiffuser.items, [
    { description: "Eyeball Diffuser", unit: "Nos", ur: 3400 }
  ]);

  // --- ODU Stand ---
  if (!est.oduStand) {
    est.oduStand = { items: [] };
  }
  if (!est.oduStand.items || est.oduStand.items.length === 0) {
    const os = est.oduStand as any;
    est.oduStand.items = [
      { description: "ODU Stand", qty: os.standQty || 0, unit: "Nos", ur: os.standRate || 450, remarks: os.remarks || "" }
    ];
  }
  ensureCommonItems(est.oduStand.items, [
    { description: "ODU Stand", unit: "Nos", ur: 450 }
  ]);

  // --- PVC Casing Cap ---
  if (!est.pvcCasingCap) {
    est.pvcCasingCap = { items: [] };
  }
  if (!est.pvcCasingCap.items || est.pvcCasingCap.items.length === 0) {
    const pvc = est.pvcCasingCap as any;
    est.pvcCasingCap.items = [
      { description: "PVC Casing Cap", qty: pvc.capQty || 0, unit: "Rmt", ur: pvc.capRate || 800, remarks: pvc.remarks || "" }
    ];
  }
  ensureCommonItems(est.pvcCasingCap.items, [
    { description: "PVC Casing Cap", unit: "Rmt", ur: 800 }
  ]);

  return est as IMaterialEstimate;
}

// ---------------------------------------------------------------------------
// CALCULATE COSTING
// ---------------------------------------------------------------------------
export function calculateCosting(costing: ICosting): ICosting {
  const result = JSON.parse(JSON.stringify(costing)) as ICosting;

  // Migrate legacy scalar fields to array format
  result.lowSide.materialEstimate = migrateEstimate(result.lowSide.materialEstimate);
  const est = result.lowSide.materialEstimate;

  // --- 1. MATERIAL ESTIMATE SUB-TOTALS ---

  // 1.1 Installation (dynamic items)
  const instTotal = (est.installation.items || []).reduce(
    (sum: number, item: IEstimateItem) => sum + (item.qty * item.ur),
    0
  );

  // 1.2 Testing & Commissioning (dynamic items)
  const testTotal = (est.testingCommissioning.items || []).reduce(
    (sum: number, item: IEstimateItem) => sum + (item.qty * item.ur),
    0
  );

  // 1.3 Ref Piping
  // Sync insulation quantities to copper pipes / 1.75
  (est.refPiping.insulation || []).forEach((ins) => {
    let cp = est.refPiping.copperPipes.find(p => p.size === ins.size);
    if (!cp) {
      cp = est.refPiping.copperPipes.find(p => normalizeSize(p.size) === normalizeSize(ins.size));
    }
    if (cp) {
      ins.qty = parseFloat((cp.qty / 1.75).toFixed(2));
    }
  });

  const pipeCost = est.refPiping.copperPipes.reduce((sum, p) => sum + (p.qty * p.ur), 0);
  const insCost = est.refPiping.insulation.reduce((sum, i) => sum + (i.qty * i.ur), 0);
  const refAccessoriesCost = (est.refPiping.accessories || []).reduce(
    (sum: number, item: IEstimateItem) => sum + (item.qty * item.ur),
    0
  );
  const refPipingTotal = pipeCost + insCost + refAccessoriesCost;

  // 1.4 Control Cabling
  const ctrlCost = est.controlCabling.cables.reduce((sum, c) => sum + (c.qty * c.ur), 0);

  // 1.5 Power Cabling
  const pwrCost = est.powerCabling.cables.reduce((sum, c) => sum + (c.qty * c.ur), 0);

  // 1.6 Drain Piping
  const drainCost = est.drainPiping.pvcPipes.reduce((sum, p) => sum + (p.qty * p.ur), 0);
  const drainAccessoriesCost = (est.drainPiping.accessories || []).reduce(
    (sum: number, item: IEstimateItem) => sum + (item.qty * item.ur),
    0
  );
  const drainPipingTotal = drainCost + drainAccessoriesCost;

  // 1.7 Ducting
  let gssDuctingTotal = 0;
  let totalDuctingSqMtr = 0;
  est.ducting.gssDucting.forEach((d) => {
    d.numSheets = d.qtySqMtr / 3;
    const totalWt = d.numSheets * d.wtPerSheet;
    const totalCost = totalWt * d.ratePerKg;
    d.ur = d.qtySqMtr > 0 ? totalCost / d.qtySqMtr : 0;
    gssDuctingTotal += totalCost;
    totalDuctingSqMtr += d.qtySqMtr;
  });

  const thermalInsSqMtr = est.ducting.gssDucting.find(d => d.gauge.includes("24"))?.qtySqMtr || 0;
  const acousticInsSqMtr = est.ducting.gssDucting.find(d => d.gauge.includes("22"))?.qtySqMtr || 0;
  const ductingAccessoriesCost = (est.ducting.accessories || []).reduce(
    (sum: number, item: IEstimateItem) => sum + (item.qty * item.ur),
    0
  );
  const ductingTotal =
    gssDuctingTotal +
    (thermalInsSqMtr * est.ducting.thermalInsulationUR) +
    (acousticInsSqMtr * est.ducting.acousticInsulationUR) +
    ductingAccessoriesCost;

  // 1.8 Air Terminals – dynamic items
  const airTerminalsItemTotal = (est.airTerminals?.items || [])
    .filter((item: IEstimateItem) => item.description.toLowerCase() !== "freight")
    .reduce(
      (sum: number, item: IEstimateItem) => {
        const rowTotal = (item.area && item.area > 0) ? (item.area * item.ur) : (item.qty * item.ur);
        return sum + rowTotal;
      },
      0
    );
  const airTerminalsFreightRate = est.airTerminals?.freightRate !== undefined ? est.airTerminals.freightRate : 0.10;
  const airTerminalsFreight = airTerminalsItemTotal * airTerminalsFreightRate;
  const airTerminalsTotal = airTerminalsItemTotal + airTerminalsFreight;

  // 1.9 Eyeball Diffuser – dynamic items
  const eyeballItemTotal = (est.eyeballDiffuser?.items || [])
    .filter((item: IEstimateItem) => item.description.toLowerCase() !== "freight")
    .reduce(
      (sum: number, item: IEstimateItem) => sum + (item.qty * item.ur),
      0
    );
  const eyeballFreightRate = est.eyeballDiffuser?.freightRate !== undefined ? est.eyeballDiffuser.freightRate : 0.10;
  const eyeballFreight = eyeballItemTotal * eyeballFreightRate;
  const eyeballTotal = eyeballItemTotal + eyeballFreight;

  // 1.10 ODU Stand – dynamic items
  const standTotal = (est.oduStand?.items || []).reduce(
    (sum: number, item: IEstimateItem) => sum + (item.qty * item.ur),
    0
  );

  // 1.11 PVC Casing Cap – dynamic items
  const capTotal = (est.pvcCasingCap?.items || []).reduce(
    (sum: number, item: IEstimateItem) => sum + (item.qty * item.ur),
    0
  );

  // --- 2. UPDATE LOW SIDE WORK ITEMS TABLE ---
  const tr = result.totalTR;
  const lowItems = result.lowSide.items || [];
  const totalUnits = result.highSide.equipment.reduce((sum, eq) => sum + (eq.qty || 0), 0) || 1;
  const pipeLen = est.refPiping.copperPipes.reduce((sum, p) => sum + p.qty, 0) / 2 || 0;

  lowItems.forEach((item) => {
    if (item.isDescriptionOnly) {
      item.materialRate = 0;
      item.labourRate = 0;
      item.stdRate = 0;
      item.cpfRate = 0;
      item.qRate = 0;
      return;
    }
    const desc = (item.description || "").toLowerCase();

    if (desc.includes("installation")) {
      item.materialRate = Math.round(instTotal);
    } else if (desc.includes("testing") || desc.includes("commissioning")) {
      item.materialRate = Math.round(testTotal);
    } else if ((desc.includes("piping") && desc.includes("ref")) || (desc.includes("piping") && desc.includes("copper"))) {
      item.materialRate = Math.round(refPipingTotal);
    } else if (desc.includes("control cabling") || (desc.includes("cabling") && desc.includes("control"))) {
      item.materialRate = Math.round(ctrlCost);
    } else if (desc.includes("power cabling") || (desc.includes("cabling") && desc.includes("power"))) {
      item.materialRate = Math.round(pwrCost);
    } else if (desc.includes("drain piping") || (desc.includes("piping") && desc.includes("drain"))) {
      item.materialRate = Math.round(drainPipingTotal);
    } else if (desc.includes("gas charging") || desc.includes("refrigerant charging")) {
      const gasQty = item.qty || Math.ceil(pipeLen / 10) || 1;
      item.materialRate = Math.round((950 / 1.18) * gasQty);
    } else if (desc.includes("ducting") || desc.includes("gss") || desc.includes("sheet metal")) {
      item.materialRate = Math.round(ductingTotal);
    } else if (desc.includes("air terminal") || desc.includes("grill") || desc.includes("damper")) {
      item.materialRate = Math.round(airTerminalsTotal);
    } else if (desc.includes("eyeball") || desc.includes("diffuser")) {
      item.materialRate = Math.round(eyeballTotal);
    } else if (desc.includes("odu stand") || desc.includes("stand")) {
      item.materialRate = Math.round(standTotal);
    } else if (desc.includes("casing") || desc.includes("cap")) {
      item.materialRate = Math.round(capTotal);
    }

    if (item.rateUnit === "per TR") {
      item.cpfRate = tr * (item.stdRate || 0);
    } else {
      item.cpfRate = (item.qty || 0) * (item.stdRate || 0);
    }
    item.qRate = item.cpfRate / 1.18;
  });


  // --- 3. RUN LOW SIDE SHEET TOTALS & OVERHEADS ---
  const ls = result.lowSide;
  const totalMaterial = (ls.items || []).reduce((sum, item) => sum + (item.materialRate || 0), 0);
  const totalLabour = (ls.items || []).reduce((sum, item) => sum + (item.labourRate || 0), 0);
  const baseTotalCost = totalMaterial + totalLabour;

  ls.totalTR = tr;

  const lsDesign = baseTotalCost * ls.designPercent;
  const lsWarranty = baseTotalCost * ls.warrantyPercent;
  const lsContingency = baseTotalCost * ls.contingencyPercent;
  const lsTrans = baseTotalCost * ls.transportationPercent;
  const lsAccom = ls.accommodationValue;
  const lsUnload = baseTotalCost * ls.unloadingPercent;
  const lsBank = baseTotalCost * ls.bankChargesPercent;

  const lsSubTotal = baseTotalCost + lsDesign + lsWarranty + lsContingency + lsTrans + lsAccom + lsUnload + lsBank;
  const lsOverhead = lsSubTotal * ls.overheadPercent;
  const lsGrandTotal = lsSubTotal + lsOverhead;

  const lsProfit = (lsGrandTotal / (1 - ls.profitPercent)) - lsGrandTotal;
  const lsProjectValueExclTax = lsGrandTotal + lsProfit;
  const lsGst = lsProjectValueExclTax * ls.gstPercent;
  const lsFinalProjectValue = lsProjectValueExclTax + lsGst;

  // --- 4. RUN HIGH SIDE SHEET CALCULATIONS ---
  const hs = result.highSide;
  // Compute CPF per item using per-item cpfMarkupPercent (falls back to highSide-level, then 16%)
  // CPF = Qty × UnitRate × (1 + cpfMarkupPercent/100)
  hs.equipment.forEach((eq) => {
    const pct = eq.cpfMarkupPercent ?? hs.cpfMarkupPercent ?? 16;
    eq.cpf = eq.qty * eq.unitRate * (1 + pct / 100);
  });

  const hsSubtotal = hs.equipment.reduce((sum, eq) => sum + (eq.qty * eq.unitRate), 0);
  const hsCpfTotal = hs.equipment.reduce((sum, eq) => sum + (eq.cpf || 0), 0);

  const hsDesign = hsSubtotal * hs.designPercent;
  const hsWarranty = hsSubtotal * hs.warrantyPercent;
  const hsTrans = hsSubtotal * hs.transportationPercent;
  const hsUnload = hsSubtotal * hs.unloadingPercent;
  const hsBank = hsSubtotal * hs.bankChargesPercent;
  const hsComm = hsSubtotal * hs.commissionPercent;

  const hsSubTotalOverhead = hsSubtotal + hsDesign + hsWarranty + hsTrans + hsUnload + hsBank + hsComm;
  const hsOverhead = hsSubTotalOverhead * hs.overheadPercent;
  const hsGrandTotal = hsSubTotalOverhead + hsOverhead;

  // Internal expense/profit chain (for tracking actual cost vs quoted)
  const hsProfit = (hsGrandTotal / (1 - hs.profitPercent)) - hsGrandTotal;

  // Excel Cost Summary Column G (CPF-based, matching Excel exactly):
  //   G12 = CPF Total = 1,109,668
  //   G24 (Project Value Excl Tax) = CPF Total itself = 1,109,668  ← CPF IS the excl-tax project value
  //   G25 (GST)                    = G24 × GST% = 1,109,668 × 28% = 310,707
  //   G26 (Final Project Value)    = G24 + G25  = 1,420,375
  const hsCpfProjectValueExclTax = hsCpfTotal > 0 ? hsCpfTotal : (hsGrandTotal + hsProfit);
  const hsCpfGst = hsCpfProjectValueExclTax * hs.gstPercent;
  const hsFinalProjectValue = hsCpfProjectValueExclTax + hsCpfGst;


  // --- 5. POPULATE COST SUMMARY ---
  const sum = result.summary;

  // Round High Side values
  const hsValExcl = Math.round(hsCpfProjectValueExclTax);
  const hsExp = Math.round(hsGrandTotal);
  const hsOh = Math.round(hsOverhead);
  const hsProf = Math.round(hsProfit);
  const hsGstAmt = Math.round(hsValExcl * hs.gstPercent);
  const hsFinal = hsValExcl + hsGstAmt;

  sum.highSideProjectValueExclTax = hsValExcl;
  sum.highSideTotalExpenseExclTax = hsExp;
  sum.highSideOverhead = hsOh;
  sum.highSideOverheadPercent = hsExp > 0 ? (hsOh / hsExp) * 100 : 0;
  sum.highSideProfit = hsProf;
  sum.highSideProfitPercent = hsValExcl > 0 ? (hsProf / hsValExcl) * 100 : 0;
  sum.highSideTotalPriceInclTax = hsFinal;
  sum.highSidePricePerTR = tr > 0 ? hsFinal / tr : 0;

  // Low Side Project Value: Q. Rate based (sum of Q. Rates)
  const clientProjectValueExclTax = ls.items.reduce((sum, item) => sum + Math.round(item.qRate || 0), 0);
  const clientGst = Math.round(clientProjectValueExclTax * ls.gstPercent);
  const clientTotalPriceInclTax = clientProjectValueExclTax + clientGst;

  const lsExp = Math.round(lsGrandTotal);
  const lsOh = Math.round(lsOverhead);
  const lsProf = Math.round(lsProfit);

  sum.lowSideProjectValueExclTax = clientProjectValueExclTax;
  sum.lowSideTotalExpenseExclTax = lsExp;
  sum.lowSideOverhead = lsOh;
  sum.lowSideOverheadPercent = lsExp > 0 ? (lsOh / lsExp) * 100 : 0;
  sum.lowSideProfit = lsProf;
  sum.lowSideProfitPercent = clientProjectValueExclTax > 0 ? (lsProf / clientProjectValueExclTax) * 100 : 0;
  sum.lowSideTotalPriceInclTax = clientTotalPriceInclTax;
  sum.lowSidePricePerTR = tr > 0 ? clientTotalPriceInclTax / tr : 0;

  sum.totalProjectValueExclTax = hsValExcl + clientProjectValueExclTax;
  sum.totalExpenseExclTax = hsExp + lsExp;
  sum.totalOverhead = hsOh + lsOh;
  sum.totalOverheadPercent = sum.totalExpenseExclTax > 0 ? (sum.totalOverhead / sum.totalExpenseExclTax) * 100 : 0;
  sum.totalProfit = hsProf + lsProf;
  sum.totalProfitPercent = sum.totalProjectValueExclTax > 0 ? (sum.totalProfit / sum.totalProjectValueExclTax) * 100 : 0;
  sum.totalPriceInclTax = hsFinal + clientTotalPriceInclTax;
  sum.totalPricePerTR = tr > 0 ? sum.totalPriceInclTax / tr : 0;

  return result;
}

// ---------------------------------------------------------------------------
// CREATE DEFAULT COSTING
// ---------------------------------------------------------------------------
export function createDefaultCosting(
  enquiryId: string,
  enquiryNo: string,
  clientId: string,
  clientName: string,
  projectName: string,
  location: string,
  totalTR: number = 0,
  preparedBy: string = "Estimator",
  approvedBy: string = ""
): ICosting {
  const baseEstimate: IMaterialEstimate = {
    installation: {
      items: [
        { description: "Thread Rod", qty: 0, unit: "Lot", ur: 550, remarks: "" },
        { description: "Rubber Pad", qty: 0, unit: "Nos", ur: 250, remarks: "" },
      ],
    },
    testingCommissioning: {
      items: [
        { description: "Nitrogen Testing", qty: 0, unit: "Cylinder", ur: 500, remarks: "" },
      ],
    },
    refPiping: {
      copperPipes: [
        { size: "1.125\"", type: "hard", ur: 765, qty: 0, remarks: "" },
        { size: "0.875\"", type: "hard", ur: 590, qty: 0, remarks: "" },
        { size: "0.625\"", type: "hard", ur: 425, qty: 0, remarks: "" },
        { size: "0.5\"", type: "hard", ur: 340, qty: 0, remarks: "" },
      ],
      insulation: [
        { size: "1.125\"", ur: 100, qty: 0, remarks: "" },
        { size: "0.875\"", ur: 80, qty: 0, remarks: "" },
      ],
      accessories: [
        { description: "White Tape", qty: 0, unit: "Roll", ur: 50, remarks: "" },
        { description: "Oxygen & LPG", qty: 0, unit: "Set", ur: 1000, remarks: "" },
        { description: "Brazing Rod", qty: 0, unit: "Kg", ur: 500, remarks: "" },
        { description: "Fittings", qty: 0, unit: "Lot", ur: 1500, remarks: "" },
        { description: "Cable tie", qty: 0, unit: "Pkt", ur: 150, remarks: "" },
      ],
    },
    controlCabling: { cables: [{ size: "1.0 Sq.mm", ur: 210, qty: 0, remarks: "" }] },
    powerCabling: { cables: [{ size: "6.0 Sq.mm", ur: 140, qty: 0, remarks: "" }] },
    drainPiping: {
      pvcPipes: [{ size: "25 mm", ur: 120, qty: 0, remarks: "" }],
      accessories: [
        { description: "Shrouding", qty: 0, unit: "Rmt", ur: 700, remarks: "" },
        { description: "Fittings", qty: 0, unit: "Lot", ur: 500, remarks: "" },
      ],
    },
    ducting: {
      gssDucting: [
        { gauge: "24 SWG", numSheets: 0, wtPerSheet: 14, ratePerKg: 95, qtySqMtr: 0, ur: 0, remarks: "" },
        { gauge: "22 SWG", numSheets: 0, wtPerSheet: 18, ratePerKg: 93, qtySqMtr: 0, ur: 0, remarks: "" },
      ],
      thermalInsulationUR: 130,
      acousticInsulationUR: 300,
      accessories: [
        { description: "Canvas Connection", qty: 0, unit: "Nos", ur: 1500, remarks: "" },
        { description: "Glue", qty: 0, unit: "Kg", ur: 1800, remarks: "" },
        { description: "Fittings", qty: 0, unit: "Lot", ur: 1500, remarks: "" },
      ],
    },
    airTerminals: {
      items: [
        { description: "Linear Grill", qty: 0, unit: "Sq.m", ur: 4843.8, remarks: "" },
        { description: "Collar Damper", qty: 0, unit: "Sq.m", ur: 6458.4, remarks: "" },
        { description: "SAD (Supply Air Diffuser)", qty: 0, unit: "Nos", ur: 1600, remarks: "" },
        { description: "RAD (Return Air Diffuser)", qty: 0, unit: "Nos", ur: 1200, remarks: "" },
      ],
    },
    eyeballDiffuser: {
      items: [
        { description: "Eyeball Diffuser", qty: 0, unit: "Nos", ur: 3400, remarks: "" },
      ],
    },
    oduStand: {
      items: [
        { description: "ODU Stand", qty: 0, unit: "Nos", ur: 450, remarks: "" },
      ],
    },
    pvcCasingCap: {
      items: [
        { description: "PVC Casing Cap", qty: 0, unit: "Rmt", ur: 800, remarks: "" },
      ],
    },
  };

  const defaultCostingObj: ICosting = {
    enquiryId,
    enquiryNo,
    clientId,
    clientName,
    date: new Date().toISOString(),
    projectName,
    location,
    unitType: "",
    make: "",
    totalTR,
    preparedBy,
    approvedBy,
    revision: 0,
    isActive: true,
    highSide: {
      equipment: [],
      designPercent: 0.01,
      warrantyPercent: 0.01,
      transportationPercent: 0.005,
      unloadingPercent: 0.025,
      bankChargesPercent: 0.001,
      commissionPercent: 0.01,
      overheadPercent: 0.015,
      profitPercent: 0.071,
      gstPercent: 0.28,
      cpfMarkupPercent: 16,
    },

    lowSide: {
      autoCalculate: false,
      laborRatePerDay: 1300,
      totalTR,
      materialEstimate: baseEstimate,
      items: [],
      designPercent: 0.015,
      warrantyPercent: 0.015,
      contingencyPercent: 0.002,
      transportationPercent: 0.025,
      accommodationValue: 0,
      unloadingPercent: 0.025,
      bankChargesPercent: 0.0025,
      overheadPercent: 0.05,
      profitPercent: 0.16,
      gstPercent: 0.18,
    },
    summary: {
      highSideProjectValueExclTax: 0, highSideTotalExpenseExclTax: 0,
      highSideOverhead: 0, highSideOverheadPercent: 0,
      highSideProfit: 0, highSideProfitPercent: 0,
      highSideTotalPriceInclTax: 0, highSidePricePerTR: 0,
      lowSideProjectValueExclTax: 0, lowSideTotalExpenseExclTax: 0,
      lowSideOverhead: 0, lowSideOverheadPercent: 0,
      lowSideProfit: 0, lowSideProfitPercent: 0,
      lowSideTotalPriceInclTax: 0, lowSidePricePerTR: 0,
      totalProjectValueExclTax: 0, totalExpenseExclTax: 0,
      totalOverhead: 0, totalOverheadPercent: 0,
      totalProfit: 0, totalProfitPercent: 0,
      totalPriceInclTax: 0, totalPricePerTR: 0,
    },
  };

  return calculateCosting(defaultCostingObj);
}

// ---------------------------------------------------------------------------
// HVAC TEMPLATE ITEMS
// ---------------------------------------------------------------------------
export function getHvacTemplateItems(): ILowSideItem[] {
  return [
    { srNo: 1, group: "Installation, Testing & Commissioning & Handing over of the following", description: "Installation of ductable AC Unit", qty: 0, unit: "No.", materialRate: 0, labourRate: 0, stdRate: 1600, rateUnit: "per TR", isDescriptionOnly: false },
    { srNo: 2, group: "Installation, Testing & Commissioning & Handing over of the following", description: "Testing & Commissioning of AC Unit", qty: 0, unit: "No.", materialRate: 0, labourRate: 0, stdRate: 0, rateUnit: "Flat", isDescriptionOnly: false },
    { srNo: 3, group: "Refrigerant Copper Piping", description: "Ref. Piping", qty: 0, unit: "Rmt", materialRate: 0, labourRate: 0, stdRate: 2100, rateUnit: "per RMT", isDescriptionOnly: false },
    { srNo: 4, group: "Communication Cabling works", description: "Control Cabling", qty: 0, unit: "Rmt", materialRate: 0, labourRate: 0, stdRate: 350, rateUnit: "per RMT", isDescriptionOnly: false },
    { srNo: 5, group: "Communication Cabling works", description: "Power Cabling", qty: 0, unit: "Rmt", materialRate: 0, labourRate: 0, stdRate: 350, rateUnit: "per RMT", isDescriptionOnly: false },
    { srNo: 6, group: "Drain Piping", description: "Drain Piping", qty: 0, unit: "Rmt", materialRate: 0, labourRate: 0, stdRate: 250, rateUnit: "per RMT", isDescriptionOnly: false },
    { srNo: 7, group: "R32 Gas charging", description: "R32 Gas charging", qty: 0, unit: "Kg", materialRate: 0, labourRate: 0, stdRate: 1300, rateUnit: "per kg", isDescriptionOnly: false },
    { srNo: 8, group: "Sheet Metal Works", description: "Supply, erection of fabricated GSS ducting as per drawing complete with all fittings", qty: 0, unit: "", materialRate: 0, labourRate: 0, stdRate: 0, rateUnit: "Flat", isDescriptionOnly: true },
    { srNo: 9, group: "Sheet Metal Works", description: "GSS Ducting (Gauge-based estimates)", qty: 0, unit: "Sq.mtr", materialRate: 0, labourRate: 0, stdRate: 1700, rateUnit: "per sq.mtr", isDescriptionOnly: false },
    { srNo: 10, group: "Duct Insulation & Lining", description: "Thermal Insulation for GSS Ducting", qty: 0, unit: "Sqm", materialRate: 0, labourRate: 0, stdRate: 130, rateUnit: "per sq.mtr", isDescriptionOnly: false },
    { srNo: 11, group: "Duct Insulation & Lining", description: "Acoustic Insulation for GSS Ducting", qty: 0, unit: "Sqm", materialRate: 0, labourRate: 0, stdRate: 300, rateUnit: "per sq.mtr", isDescriptionOnly: false },
    { srNo: 12, group: "Grilles/Diffusers", description: "Air terminals", qty: 0, unit: "Sq. mtr", materialRate: 0, labourRate: 0, stdRate: 10000, rateUnit: "per sq.mtr", isDescriptionOnly: false },
    { srNo: 13, group: "ODU Stand", description: "ODU Stand", qty: 0, unit: "Nos", materialRate: 0, labourRate: 0, stdRate: 450, rateUnit: "Flat", isDescriptionOnly: false },
    { srNo: 14, group: "PVC Casing Cap", description: "PVC Casing Cap", qty: 0, unit: "Rmt", materialRate: 0, labourRate: 0, stdRate: 800, rateUnit: "per RMT", isDescriptionOnly: false },
  ];
}

// ---------------------------------------------------------------------------
// SYNC ESTIMATES TO LOW SIDE
// ---------------------------------------------------------------------------
const isStandardItem = (desc: string) => {
  const d = (desc || "").toLowerCase();
  return d.includes("installation of ductable") ||
         (d.includes("testing") && d.includes("commissioning")) ||
         (d.includes("piping") && d.includes("ref")) ||
         d.includes("control cabling") ||
         d.includes("power cabling") ||
         (d.includes("piping") && d.includes("drain")) ||
         d.includes("gas charging") ||
         d.includes("ducting with thermal") ||
         d.includes("air terminals") ||
         d.includes("odu stand") ||
         d.includes("casing cap");
};

export function syncEstimatesToLowSide(costing: ICosting): ICosting {
  const result = JSON.parse(JSON.stringify(costing)) as ICosting;
  result.lowSide.materialEstimate = migrateEstimate(result.lowSide.materialEstimate);
  const est = result.lowSide.materialEstimate;

  // Section totals (mirrors calculateCosting logic)
  const instTotal = (est.installation.items || []).reduce((sum: number, i: IEstimateItem) => sum + (i.qty * i.ur), 0);
  const testTotal = (est.testingCommissioning.items || []).reduce((sum: number, i: IEstimateItem) => sum + (i.qty * i.ur), 0);

  const pipeCost = est.refPiping.copperPipes.reduce((sum, p) => sum + (p.qty * p.ur), 0);
  const insCost = est.refPiping.insulation.reduce((sum, i) => sum + (i.qty * i.ur), 0);
  const refAccessoriesCost = (est.refPiping.accessories || []).reduce((sum: number, i: IEstimateItem) => sum + (i.qty * i.ur), 0);
  const refPipingTotal = pipeCost + insCost + refAccessoriesCost;

  const ctrlCost = est.controlCabling.cables.reduce((sum, c) => sum + (c.qty * c.ur), 0);
  const pwrCost = est.powerCabling.cables.reduce((sum, c) => sum + (c.qty * c.ur), 0);

  const drainCost = est.drainPiping.pvcPipes.reduce((sum, p) => sum + (p.qty * p.ur), 0);
  const drainAccessoriesCost = (est.drainPiping.accessories || []).reduce((sum: number, i: IEstimateItem) => sum + (i.qty * i.ur), 0);
  const drainPipingTotal = drainCost + drainAccessoriesCost;

  let gssDuctingTotal = 0;
  let totalDuctingSqMtr = 0;
  est.ducting.gssDucting.forEach((d) => {
    const totalWt = (d.qtySqMtr / 3) * d.wtPerSheet;
    gssDuctingTotal += totalWt * d.ratePerKg;
    totalDuctingSqMtr += d.qtySqMtr;
  });

  const thermalInsSqMtr = est.ducting.gssDucting.find(d => d.gauge.includes("24"))?.qtySqMtr || 0;
  const acousticInsSqMtr = est.ducting.gssDucting.find(d => d.gauge.includes("22"))?.qtySqMtr || 0;
  const ductingAccessoriesCost = (est.ducting.accessories || []).reduce((sum: number, i: IEstimateItem) => sum + (i.qty * i.ur), 0);
  const ductingTotal =
    gssDuctingTotal +
    (thermalInsSqMtr * est.ducting.thermalInsulationUR) +
    (acousticInsSqMtr * est.ducting.acousticInsulationUR) +
    ductingAccessoriesCost;

  const airTerminalsItemTotal = (est.airTerminals?.items || [])
    .filter((i: IEstimateItem) => i.description.toLowerCase() !== "freight")
    .reduce((sum: number, i: IEstimateItem) => {
      const rowTotal = (i.area && i.area > 0) ? (i.area * i.ur) : (i.qty * i.ur);
      return sum + rowTotal;
    }, 0);
  const airTerminalsFreightRate = est.airTerminals?.freightRate !== undefined ? est.airTerminals.freightRate : 0.10;
  const airTerminalsFreight = airTerminalsItemTotal * airTerminalsFreightRate;
  const airTerminalsTotal = airTerminalsItemTotal + airTerminalsFreight;

  const eyeballItemTotal = (est.eyeballDiffuser?.items || [])
    .filter((i: IEstimateItem) => i.description.toLowerCase() !== "freight")
    .reduce((sum: number, i: IEstimateItem) => sum + (i.qty * i.ur), 0);
  const eyeballFreightRate = est.eyeballDiffuser?.freightRate !== undefined ? est.eyeballDiffuser.freightRate : 0.10;
  const eyeballFreight = eyeballItemTotal * eyeballFreightRate;
  const eyeballTotal = eyeballItemTotal + eyeballFreight;
  const standTotal = (est.oduStand?.items || []).reduce((sum: number, i: IEstimateItem) => sum + (i.qty * i.ur), 0);
  const capTotal = (est.pvcCasingCap?.items || []).reduce((sum: number, i: IEstimateItem) => sum + (i.qty * i.ur), 0);

  const tr = result.totalTR;
  const totalUnits = result.highSide.equipment.reduce((sum, eq) => sum + (eq.qty || 0), 0) || 1;

  // Keep user's custom items (whose description doesn't match standard template items)
  const existingItems = result.lowSide.items || [];
  const customItems = existingItems.filter(item => !isStandardItem(item.description));

  // Determine active standard items based on Materials Summary totals being > 0
  const pipeLen = est.refPiping.copperPipes.reduce((sum, p) => sum + p.qty, 0) / 2 || 0;
  const activeSections = {
    installation: instTotal > 0,
    testing: testTotal > 0,
    refPiping: refPipingTotal > 0,
    controlCabling: ctrlCost > 0,
    powerCabling: pwrCost > 0,
    drainPiping: drainPipingTotal > 0,
    gasCharging: (pipeLen / 10) > 0,
    ducting: totalDuctingSqMtr > 0,
    airTerminals: airTerminalsTotal > 0,
    eyeball: eyeballTotal > 0,
    oduStand: standTotal > 0,
    pvcCasing: capTotal > 0
  };

  const templateItems = getHvacTemplateItems();
  const activeTemplateItems = templateItems.filter(item => {
    const desc = item.description.toLowerCase();
    if (desc.includes("installation")) return activeSections.installation;
    if (desc.includes("testing") || desc.includes("commissioning")) return activeSections.testing;
    if ((desc.includes("piping") && desc.includes("ref")) || (desc.includes("piping") && desc.includes("copper"))) return activeSections.refPiping;
    if (desc.includes("control cabling") || (desc.includes("cabling") && desc.includes("control"))) return activeSections.controlCabling;
    if (desc.includes("power cabling") || (desc.includes("cabling") && desc.includes("power"))) return activeSections.powerCabling;
    if (desc.includes("drain piping") || (desc.includes("piping") && desc.includes("drain"))) return activeSections.drainPiping;
    if (desc.includes("gas charging") || desc.includes("refrigerant charging")) return activeSections.gasCharging;
    if (desc.includes("ducting") || desc.includes("gss") || desc.includes("sheet metal")) return activeSections.ducting;
    if (desc.includes("air terminal") || desc.includes("grill") || desc.includes("damper")) return activeSections.airTerminals;
    if (desc.includes("eyeball") || desc.includes("diffuser")) return activeSections.eyeball;
    if (desc.includes("odu stand") || desc.includes("stand")) return activeSections.oduStand;
    if (desc.includes("casing") || desc.includes("cap")) return activeSections.pvcCasing;
    return false;
  });

  const finalItems = [...activeTemplateItems, ...customItems];
  finalItems.forEach((item, index) => {
    item.srNo = index + 1;
  });

  finalItems.forEach((item) => {
    if (item.isDescriptionOnly) {
      item.qty = 0;
      item.materialRate = 0;
      item.labourRate = 0;
      item.stdRate = 0;
      item.cpfRate = 0;
      item.qRate = 0;
      return;
    }
    const desc = (item.description || "").toLowerCase();

    if (desc.includes("installation")) {
      item.qty = totalUnits;
      item.materialRate = Math.round(instTotal);
      item.labourRate = totalUnits * 1000;
      item.stdRate = 1600;
    } else if (desc.includes("testing") || desc.includes("commissioning")) {
      item.qty = totalUnits;
      item.materialRate = Math.round(testTotal);
      item.labourRate = 0;
      item.stdRate = 0;
    } else if ((desc.includes("piping") && desc.includes("ref")) || (desc.includes("piping") && desc.includes("copper"))) {
      const pipingQty = est.refPiping.copperPipes.reduce((sum, p) => sum + p.qty, 0) / 2 || 0;
      item.qty = pipingQty;
      item.materialRate = Math.round(refPipingTotal);
      item.labourRate = pipingQty * 250;
      item.stdRate = 2100;
    } else if (desc.includes("control cabling") || (desc.includes("cabling") && desc.includes("control"))) {
      const cabQty = est.controlCabling.cables.reduce((sum, c) => sum + c.qty, 0) || 0;
      item.qty = cabQty;
      item.materialRate = Math.round(ctrlCost);
      item.labourRate = cabQty * 50;
      item.stdRate = 350;
    } else if (desc.includes("power cabling") || (desc.includes("cabling") && desc.includes("power"))) {
      const cabQty = est.powerCabling.cables.reduce((sum, c) => sum + c.qty, 0) || 0;
      item.qty = cabQty;
      item.materialRate = Math.round(pwrCost);
      item.labourRate = cabQty * 100;
      item.stdRate = 350;
    } else if (desc.includes("drain piping") || (desc.includes("piping") && desc.includes("drain"))) {
      const drnQty = est.drainPiping.pvcPipes.reduce((sum, p) => sum + p.qty, 0) || 0;
      item.qty = drnQty;
      item.materialRate = Math.round(drainPipingTotal);
      item.labourRate = drnQty * 50;
      item.stdRate = 250;
    } else if (desc.includes("gas charging") || desc.includes("refrigerant charging")) {
      const gasQty = Math.ceil(pipeLen / 10) || 1;
      item.qty = gasQty;
      item.materialRate = Math.round((950 / 1.18) * item.qty);
      item.labourRate = 0;
      item.stdRate = 1300;
    } else if (desc.includes("ducting") || desc.includes("gss") || desc.includes("sheet metal")) {
      item.qty = totalDuctingSqMtr;
      item.materialRate = Math.round(ductingTotal);
      item.labourRate = totalDuctingSqMtr * 500;
      
      const qty24SWG = est.ducting.gssDucting.find(d => d.gauge.includes("24"))?.qtySqMtr || 0;
      const qty22SWG = est.ducting.gssDucting.find(d => d.gauge.includes("22"))?.qtySqMtr || 0;
      const ductingClientTotal = (qty24SWG * 1400) + (qty22SWG * 1700) + (qty24SWG * 550) + (qty22SWG * 1100) + (totalUnits * 3500);
      item.stdRate = totalDuctingSqMtr > 0 ? parseFloat((ductingClientTotal / totalDuctingSqMtr).toFixed(2)) : 1700;
    } else if (desc.includes("air terminal") || desc.includes("grill") || desc.includes("damper")) {
      const firstItem = (est.airTerminals?.items || []).find(i => i.qty > 0);
      item.qty = firstItem?.qty || item.qty || 0;
      item.materialRate = Math.round(airTerminalsTotal);
      item.labourRate = item.qty * 1500;
      item.stdRate = 10000;
    } else if (desc.includes("eyeball") || desc.includes("diffuser")) {
      const firstItem = (est.eyeballDiffuser?.items || []).find(i => i.description.toLowerCase().includes("eyeball") || i.description.toLowerCase().includes("diffuser"));
      item.qty = firstItem?.qty || item.qty || 0;
      item.materialRate = Math.round(eyeballTotal);
      item.labourRate = 0;
      item.stdRate = 3400;
    } else if (desc.includes("odu stand") || desc.includes("stand")) {
      const firstItem = (est.oduStand?.items || [])[0];
      item.qty = firstItem?.qty || item.qty || 0;
      item.materialRate = Math.round(standTotal);
      item.labourRate = 0;
      item.stdRate = 450;
    } else if (desc.includes("casing") || desc.includes("cap")) {
      const firstItem = (est.pvcCasingCap?.items || [])[0];
      item.qty = firstItem?.qty || item.qty || 0;
      item.materialRate = Math.round(capTotal);
      item.labourRate = 0;
      item.stdRate = 800;
    }
  });

  result.lowSide.items = finalItems;

  // Calculate client cost totals for Low Side items
  result.lowSide.items.forEach((item) => {
    if (item.isDescriptionOnly) {
      item.cpfRate = 0;
      item.qRate = 0;
      return;
    }
    if (item.rateUnit === "per TR") {
      item.cpfRate = tr * (item.stdRate || 0);
    } else {
      item.cpfRate = (item.qty || 0) * (item.stdRate || 0);
    }
    item.qRate = item.cpfRate / 1.18;
  });

  return calculateCosting(result);
}

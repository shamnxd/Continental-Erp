export interface IHighSideEquipment {
  description: string;
  qty: number;
  unitRate: number;
  cpf?: number;
  cpfMarkupPercent?: number; // per-item CPF markup %, e.g. 16 means ×1.16
}

export interface IHighSideCosting {
  equipment: IHighSideEquipment[];
  designPercent: number;
  warrantyPercent: number;
  transportationPercent: number;
  unloadingPercent: number;
  bankChargesPercent: number;
  commissionPercent: number;
  overheadPercent: number;
  profitPercent: number;
  gstPercent: number;
  cpfMarkupPercent: number; // CPF markup factor in %, e.g. 16 means CPF = TotalRate × 1.16
}

// Generic estimator row – used for all dynamic accessory tables
export interface IEstimateItem {
  description: string;
  qty: number;
  unit: string;
  ur: number;
  area?: number; // sq.ft — if set, Total = area × ur (instead of qty × ur)
  remarks?: string;
}

export interface ICopperPipeRun {
  size: string;
  type: "hard" | "soft";
  ur: number;
  qty: number;
  remarks?: string;
}

export interface IInsulationRun {
  size: string;
  ur: number;
  qty: number;
  remarks?: string;
}

export interface ICableRun {
  size: string;
  ur: number;
  qty: number;
  unit?: string;
  remarks?: string;
}

export interface IDuctingSheet {
  gauge: string;
  numSheets: number;
  wtPerSheet: number;
  ratePerKg: number;
  qtySqMtr: number;
  ur?: number;
  remarks?: string;
}

export interface IMaterialEstimate {
  // Section 1 – now a dynamic array
  installation: {
    items: IEstimateItem[];
  };

  // Section 2 – now a dynamic array
  testingCommissioning: {
    items: IEstimateItem[];
  };

  // Section 3 – copper pipes remain as-is; accessories replaces scalar fields
  refPiping: {
    copperPipes: ICopperPipeRun[];
    insulation: IInsulationRun[];
    // Replaces: whiteTapeQty/UR, oxygenLpgQty/UR, brazingRodQty/UR, fittingsQty/UR
    accessories: IEstimateItem[];
  };

  controlCabling: {
    cables: ICableRun[];
  };

  powerCabling: {
    cables: ICableRun[];
  };

  // Section 6 – pvcPipes remain; accessories replaces shrouding + fittings scalars
  drainPiping: {
    pvcPipes: ICableRun[];
    // Replaces: shroudingQty/UR, fittingsQty/UR
    accessories: IEstimateItem[];
  };

  // Section 7 – gssDucting remains; accessories replaces canvas/glue/fittings scalars
  ducting: {
    gssDucting: IDuctingSheet[];
    thermalInsulationUR: number;
    acousticInsulationUR: number;
    // Replaces: canvasQty/UR, glueQty/UR, fittingsQty/UR
    accessories: IEstimateItem[];
  };

  airTerminals: {
    // Legacy scalar fields
    linearGrillQty?: number;
    linearGrillRate?: number;
    linearGrillRemarks?: string;
    collarDamperQty?: number;
    collarDamperRate?: number;
    collarDamperRemarks?: string;
    sadQty?: number;
    sadRate?: number;
    sadRemarks?: string;
    radQty?: number;
    radRate?: number;
    radRemarks?: string;
    freightRate?: number;
    // New dynamic items array
    items?: IEstimateItem[];
  };

  eyeballDiffuser: {
    diffuserQty?: number;
    diffuserRate?: number;
    freightRate?: number;
    remarks?: string;
    items?: IEstimateItem[];
  };

  oduStand: {
    standQty?: number;
    standRate?: number;
    remarks?: string;
    items?: IEstimateItem[];
  };

  pvcCasingCap: {
    capQty?: number;
    capRate?: number;
    remarks?: string;
    items?: IEstimateItem[];
  };
}

export interface ILowSideItem {
  srNo: number;
  description: string;
  qty: number;
  unit: string;
  materialRate: number;
  labourRate: number;
  stdRate: number;
  rateUnit: string;
  cpfRate?: number;
  qRate?: number;
}

export interface ILowSideCosting {
  laborRatePerDay: number;
  totalTR: number;
  materialEstimate: IMaterialEstimate;
  items: ILowSideItem[];
  autoCalculate?: boolean;
  designPercent: number;
  warrantyPercent: number;
  contingencyPercent: number;
  transportationPercent: number;
  accommodationValue: number;
  unloadingPercent: number;
  bankChargesPercent: number;
  overheadPercent: number;
  profitPercent: number;
  gstPercent: number;
}

export interface ICostSummary {
  highSideProjectValueExclTax: number;
  highSideTotalExpenseExclTax: number;
  highSideOverhead: number;
  highSideOverheadPercent: number;
  highSideProfit: number;
  highSideProfitPercent: number;
  highSideTotalPriceInclTax: number;
  highSidePricePerTR: number;

  lowSideProjectValueExclTax: number;
  lowSideTotalExpenseExclTax: number;
  lowSideOverhead: number;
  lowSideOverheadPercent: number;
  lowSideProfit: number;
  lowSideProfitPercent: number;
  lowSideTotalPriceInclTax: number;
  lowSidePricePerTR: number;

  totalProjectValueExclTax: number;
  totalExpenseExclTax: number;
  totalOverhead: number;
  totalOverheadPercent: number;
  totalProfit: number;
  totalProfitPercent: number;
  totalPriceInclTax: number;
  totalPricePerTR: number;
}

export interface ICopperPipeRateConfig {
  size: string;
  type: "hard" | "soft";
  rate: number;
  sleeveRate: number;
  unit: string;
  remarks?: string;
}

export interface ICosting {
  id?: string;
  enquiryId: string;
  enquiryNo: string;
  clientId: string;
  clientName: string;
  date: string;
  projectName: string;
  location: string;
  unitType: string;
  make: string;
  totalTR: number;
  preparedBy: string;
  approvedBy: string;
  revision: number;
  isActive: boolean;
  highSide: IHighSideCosting;
  lowSide: ILowSideCosting;
  summary: ICostSummary;
  copperPipeRates?: ICopperPipeRateConfig[];
  createdAt?: string;
  updatedAt?: string;
}

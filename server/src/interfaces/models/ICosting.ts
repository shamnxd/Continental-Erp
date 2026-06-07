export interface IHighSideEquipment {
  description: string;
  qty: number;
  unitRate: number;
  cpf?: number;
  cpfMarkupPercent?: number;
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
  cpfMarkupPercent: number;
}

export interface IEstimateItem {
  description: string;
  qty: number;
  unit: string;
  ur: number;
  area?: number;
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
}

export interface IMaterialEstimate {
  installation: {
    items: IEstimateItem[];
  };
  testingCommissioning: {
    items: IEstimateItem[];
  };
  refPiping: {
    copperPipes: ICopperPipeRun[];
    insulation: IInsulationRun[];
    accessories: IEstimateItem[];
  };
  controlCabling: {
    cables: ICableRun[];
  };
  powerCabling: {
    cables: ICableRun[];
  };
  drainPiping: {
    pvcPipes: ICableRun[];
    accessories: IEstimateItem[];
  };
  ducting: {
    gssDucting: IDuctingSheet[];
    thermalInsulationUR: number;
    acousticInsulationUR: number;
    accessories: IEstimateItem[];
  };
  airTerminals: {
    // Legacy scalar fields (kept for backward compat)
    linearGrillQty?: number;
    linearGrillRate?: number;
    collarDamperQty?: number;
    collarDamperRate?: number;
    sadQty?: number;
    sadRate?: number;
    radQty?: number;
    radRate?: number;
    freightRate?: number;
    linearGrillRemarks?: string;
    collarDamperRemarks?: string;
    sadRemarks?: string;
    radRemarks?: string;
    // New dynamic items array
    items?: IEstimateItem[];
  };
  eyeballDiffuser: {
    // Legacy scalar fields
    diffuserQty?: number;
    diffuserRate?: number;
    freightRate?: number;
    remarks?: string;
    // New dynamic items array
    items?: IEstimateItem[];
  };
  oduStand: {
    // Legacy scalar fields
    standQty?: number;
    standRate?: number;
    remarks?: string;
    // New dynamic items array
    items?: IEstimateItem[];
  };
  pvcCasingCap: {
    // Legacy scalar fields
    capQty?: number;
    capRate?: number;
    remarks?: string;
    // New dynamic items array
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
  date: Date;
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
  createdAt?: Date;
  updatedAt?: Date;
}

import { z } from "zod";

const highSideEquipmentSchema = z.object({
  description: z.string().min(1),
  qty: z.number().min(0),
  unitRate: z.number().min(0),
  cpf: z.number().optional().default(0),
  cpfMarkupPercent: z.number().optional().default(16),
});


const copperPipeRunSchema = z.object({
  size: z.string(),
  type: z.enum(["hard", "soft"]),
  ur: z.number().min(0),
  qty: z.number(),
  remarks: z.string().optional().default(""),
});

const insulationRunSchema = z.object({
  size: z.string(),
  ur: z.number().min(0),
  qty: z.number(),
});

const estimateItemSchema = z.object({
  description: z.string().optional().default(""),
  qty: z.number().optional().default(0),
  unit: z.string().optional().default("Nos"),
  ur: z.number().optional().default(0),
  area: z.number().optional().default(0),
  remarks: z.string().optional().default(""),
});


const cableRunSchema = z.object({
  size: z.string(),
  ur: z.number().min(0),
  qty: z.number(),
  unit: z.string().optional().default("Rmt"),
  remarks: z.string().optional().default(""),
});

const ductingSheetSchema = z.object({
  gauge: z.string(),
  numSheets: z.number().min(0),
  wtPerSheet: z.number().min(0),
  ratePerKg: z.number().min(0),
  qtySqMtr: z.number().min(0),
});

const lowSideItemSchema = z.object({
  srNo: z.number(),
  description: z.string().min(1),
  qty: z.number(),
  unit: z.string(),
  materialRate: z.number().min(0),
  labourRate: z.number().min(0),
  stdRate: z.number().min(0),
  rateUnit: z.string(),
  cpfRate: z.number().optional().default(0),
  qRate: z.number().optional().default(0),
});

const materialEstimateSchema = z.object({
  installation: z.object({
    items: z.array(estimateItemSchema).optional().default([]),
  }).optional(),
  testingCommissioning: z.object({
    items: z.array(estimateItemSchema).optional().default([]),
  }).optional(),
  refPiping: z.object({
    copperPipes: z.array(copperPipeRunSchema).optional().default([]),
    insulation: z.array(insulationRunSchema).optional().default([]),
    accessories: z.array(estimateItemSchema).optional().default([]),
  }).optional(),
  controlCabling: z.object({
    cables: z.array(cableRunSchema).optional().default([]),
  }).optional(),
  powerCabling: z.object({
    cables: z.array(cableRunSchema).optional().default([]),
  }).optional(),
  drainPiping: z.object({
    pvcPipes: z.array(cableRunSchema).optional().default([]),
    accessories: z.array(estimateItemSchema).optional().default([]),
  }).optional(),
  ducting: z.object({
    gssDucting: z.array(ductingSheetSchema).optional().default([]),
    thermalInsulationUR: z.number().optional().default(0),
    acousticInsulationUR: z.number().optional().default(0),
    accessories: z.array(estimateItemSchema).optional().default([]),
  }).optional(),
  airTerminals: z.object({
    linearGrillQty: z.number().optional().default(0),
    linearGrillRate: z.number().optional().default(0),
    collarDamperQty: z.number().optional().default(0),
    collarDamperRate: z.number().optional().default(0),
    sadQty: z.number().optional().default(0),
    sadRate: z.number().optional().default(0),
    radQty: z.number().optional().default(0),
    radRate: z.number().optional().default(0),
    freightRate: z.number().optional().default(0),
    linearGrillRemarks: z.string().optional().default(""),
    collarDamperRemarks: z.string().optional().default(""),
    sadRemarks: z.string().optional().default(""),
    radRemarks: z.string().optional().default(""),
    items: z.array(estimateItemSchema).optional().default([]),
  }).optional(),
  eyeballDiffuser: z.object({
    diffuserQty: z.number().optional().default(0),
    diffuserRate: z.number().optional().default(0),
    freightRate: z.number().optional().default(0),
    remarks: z.string().optional().default(""),
    items: z.array(estimateItemSchema).optional().default([]),
  }).optional(),
  oduStand: z.object({
    standQty: z.number().optional().default(0),
    standRate: z.number().optional().default(0),
    remarks: z.string().optional().default(""),
    items: z.array(estimateItemSchema).optional().default([]),
  }).optional(),
  pvcCasingCap: z.object({
    capQty: z.number().optional().default(0),
    capRate: z.number().optional().default(0),
    remarks: z.string().optional().default(""),
    items: z.array(estimateItemSchema).optional().default([]),
  }).optional(),
}).optional();

export const CreateCostingSchema = z.object({
  enquiryId: z.string().min(1, "Enquiry ID is required"),
  enquiryNo: z.string().min(1, "Enquiry No is required"),
  clientId: z.string().min(1, "Client ID is required"),
  clientName: z.string().min(1, "Client name is required"),
  date: z.string().transform((val) => new Date(val)).or(z.date()).optional().default(() => new Date()),
  projectName: z.string().min(1, "Project name is required"),
  location: z.string().min(1, "Location is required"),
  unitType: z.string().optional().default(""),
  make: z.string().optional().default(""),
  totalTR: z.number().min(0).optional().default(0),
  preparedBy: z.string().min(1, "Prepared by is required"),
  approvedBy: z.string().default("").optional(),
  revision: z.number().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
  highSide: z.object({
    equipment: z.array(highSideEquipmentSchema).optional().default([]),
    designPercent: z.number().default(0.01),
    warrantyPercent: z.number().default(0.01),
    transportationPercent: z.number().default(0.005),
    unloadingPercent: z.number().default(0.025),
    bankChargesPercent: z.number().default(0.001),
    commissionPercent: z.number().default(0.01),
    overheadPercent: z.number().default(0.015),
    profitPercent: z.number().default(0.071),
    gstPercent: z.number().default(0.28),
    cpfMarkupPercent: z.number().default(16),
  }).optional(),

  lowSide: z.object({
    autoCalculate: z.boolean().optional().default(true),
    laborRatePerDay: z.number().default(1300),
    totalTR: z.number().default(0),
    materialEstimate: materialEstimateSchema,
    items: z.array(lowSideItemSchema).optional().default([]),
    designPercent: z.number().default(0.015),
    warrantyPercent: z.number().default(0.015),
    contingencyPercent: z.number().default(0.002),
    transportationPercent: z.number().default(0.025),
    accommodationValue: z.number().default(0),
    unloadingPercent: z.number().default(0.025),
    bankChargesPercent: z.number().default(0.0025),
    overheadPercent: z.number().default(0.05),
    profitPercent: z.number().default(0.16),
    gstPercent: z.number().default(0.18),
  }).optional(),
  summary: z.object({
    highSideProjectValueExclTax: z.number().default(0),
    highSideTotalExpenseExclTax: z.number().default(0),
    highSideOverhead: z.number().default(0),
    highSideOverheadPercent: z.number().default(0),
    highSideProfit: z.number().default(0),
    highSideProfitPercent: z.number().default(0),
    highSideTotalPriceInclTax: z.number().default(0),
    highSidePricePerTR: z.number().default(0),
    lowSideProjectValueExclTax: z.number().default(0),
    lowSideTotalExpenseExclTax: z.number().default(0),
    lowSideOverhead: z.number().default(0),
    lowSideOverheadPercent: z.number().default(0),
    lowSideProfit: z.number().default(0),
    lowSideProfitPercent: z.number().default(0),
    lowSideTotalPriceInclTax: z.number().default(0),
    lowSidePricePerTR: z.number().default(0),
    totalProjectValueExclTax: z.number().default(0),
    totalExpenseExclTax: z.number().default(0),
    totalOverhead: z.number().default(0),
    totalOverheadPercent: z.number().default(0),
    totalProfit: z.number().default(0),
    totalProfitPercent: z.number().default(0),
    totalPriceInclTax: z.number().default(0),
    totalPricePerTR: z.number().default(0),
  }).optional(),
});

export type CreateCostingDto = z.infer<typeof CreateCostingSchema>;

export const UpdateCostingSchema = CreateCostingSchema.partial();

export type UpdateCostingDto = z.infer<typeof UpdateCostingSchema>;

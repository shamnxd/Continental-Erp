import { Schema, model, Document } from "mongoose";
import { ICosting } from "../interfaces/models/ICosting";

export interface ICostingDocument extends Document, Omit<ICosting, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const highSideEquipmentSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    unitRate: { type: Number, required: true, min: 0 },
    cpf: { type: Number, default: 0 },
    cpfMarkupPercent: { type: Number, default: 16 },
  },
  { _id: false }
);

const copperPipeRunSchema = new Schema(
  {
    size: { type: String, required: true },
    type: { type: String, enum: ["hard", "soft"], required: true },
    ur: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true },
    remarks: { type: String, default: "" },
  },
  { _id: false }
);

const copperPipeRateConfigSchema = new Schema(
  {
    size: { type: String, required: true },
    type: { type: String, enum: ["hard", "soft"], required: true },
    rate: { type: Number, required: true, min: 0 },
    sleeveRate: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "M" },
    remarks: { type: String, default: "" },
  },
  { _id: false }
);

const insulationRunSchema = new Schema(
  {
    size: { type: String, required: true },
    ur: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true },
  },
  { _id: false }
);

const estimateItemSchema = new Schema(
  {
    description: { type: String, default: "" },
    qty: { type: Number, default: 0 },
    unit: { type: String, default: "Nos" },
    ur: { type: Number, default: 0 },
    area: { type: Number, default: 0 },
    remarks: { type: String, default: "" },
  },
  { _id: false }
);


const cableRunSchema = new Schema(
  {
    size: { type: String, required: true },
    ur: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true },
    unit: { type: String, default: "Rmt" },
    remarks: { type: String, default: "" },
  },
  { _id: false }
);

const ductingSheetSchema = new Schema(
  {
    gauge: { type: String, required: true },
    numSheets: { type: Number, required: true, min: 0 },
    wtPerSheet: { type: Number, required: true, min: 0 },
    ratePerKg: { type: Number, required: true, min: 0 },
    qtySqMtr: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const lowSideItemSchema = new Schema(
  {
    srNo: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    materialRate: { type: Number, required: true, min: 0 },
    labourRate: { type: Number, required: true, min: 0 },
    stdRate: { type: Number, required: true, min: 0 },
    rateUnit: { type: String, required: true },
    cpfRate: { type: Number, default: 0 },
    qRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const materialEstimateSchema = new Schema(
  {
    installation: {
      items: { type: [estimateItemSchema], default: [] },
    },
    testingCommissioning: {
      items: { type: [estimateItemSchema], default: [] },
    },
    refPiping: {
      copperPipes: { type: [copperPipeRunSchema], default: [] },
      insulation: { type: [insulationRunSchema], default: [] },
      accessories: { type: [estimateItemSchema], default: [] },
    },
    controlCabling: {
      cables: { type: [cableRunSchema], default: [] },
    },
    powerCabling: {
      cables: { type: [cableRunSchema], default: [] },
    },
    drainPiping: {
      pvcPipes: { type: [cableRunSchema], default: [] },
      accessories: { type: [estimateItemSchema], default: [] },
    },
    ducting: {
      gssDucting: { type: [ductingSheetSchema], default: [] },
      thermalInsulationUR: { type: Number, default: 0 },
      acousticInsulationUR: { type: Number, default: 0 },
      accessories: { type: [estimateItemSchema], default: [] },
    },
    airTerminals: {
      linearGrillQty: { type: Number, default: 0 },
      linearGrillRate: { type: Number, default: 0 },
      collarDamperQty: { type: Number, default: 0 },
      collarDamperRate: { type: Number, default: 0 },
      sadQty: { type: Number, default: 0 },
      sadRate: { type: Number, default: 0 },
      radQty: { type: Number, default: 0 },
      radRate: { type: Number, default: 0 },
      freightRate: { type: Number, default: 0 },
      linearGrillRemarks: { type: String, default: "" },
      collarDamperRemarks: { type: String, default: "" },
      sadRemarks: { type: String, default: "" },
      radRemarks: { type: String, default: "" },
      items: { type: [estimateItemSchema], default: [] },
    },
    eyeballDiffuser: {
      diffuserQty: { type: Number, default: 0 },
      diffuserRate: { type: Number, default: 0 },
      freightRate: { type: Number, default: 0 },
      remarks: { type: String, default: "" },
      items: { type: [estimateItemSchema], default: [] },
    },
    oduStand: {
      standQty: { type: Number, default: 0 },
      standRate: { type: Number, default: 0 },
      remarks: { type: String, default: "" },
      items: { type: [estimateItemSchema], default: [] },
    },
    pvcCasingCap: {
      capQty: { type: Number, default: 0 },
      capRate: { type: Number, default: 0 },
      remarks: { type: String, default: "" },
      items: { type: [estimateItemSchema], default: [] },
    },
  },
  { _id: false }
);

const costingSchema = new Schema<ICostingDocument>(
  {
    enquiryId: { type: String, required: true, index: true },
    enquiryNo: { type: String, required: true, trim: true },
    clientId: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    projectName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    unitType: { type: String, default: "", trim: true },
    make: { type: String, default: "", trim: true },
    totalTR: { type: Number, default: 0, min: 0 },
    preparedBy: { type: String, required: true, trim: true },
    approvedBy: { type: String, default: "", trim: true },
    revision: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
    highSide: {
      equipment: { type: [highSideEquipmentSchema], default: [] },
      designPercent: { type: Number, default: 0.01 },
      warrantyPercent: { type: Number, default: 0.01 },
      transportationPercent: { type: Number, default: 0.005 },
      unloadingPercent: { type: Number, default: 0.025 },
      bankChargesPercent: { type: Number, default: 0.001 },
      commissionPercent: { type: Number, default: 0.01 },
      overheadPercent: { type: Number, default: 0.015 },
      profitPercent: { type: Number, default: 0.071 },
      gstPercent: { type: Number, default: 0.28 },
      cpfMarkupPercent: { type: Number, default: 16 },
    },
    lowSide: {
      autoCalculate: { type: Boolean, default: true },
      laborRatePerDay: { type: Number, default: 1300 },
      totalTR: { type: Number, default: 0 },
      materialEstimate: { type: materialEstimateSchema, default: () => ({}) },
      items: { type: [lowSideItemSchema], default: [] },
      designPercent: { type: Number, default: 0.015 },
      warrantyPercent: { type: Number, default: 0.015 },
      contingencyPercent: { type: Number, default: 0.002 },
      transportationPercent: { type: Number, default: 0.025 },
      accommodationValue: { type: Number, default: 0 },
      unloadingPercent: { type: Number, default: 0.025 },
      bankChargesPercent: { type: Number, default: 0.0025 },
      overheadPercent: { type: Number, default: 0.05 },
      profitPercent: { type: Number, default: 0.16 },
      gstPercent: { type: Number, default: 0.18 },
    },

    summary: {
      highSideProjectValueExclTax: { type: Number, default: 0 },
      highSideTotalExpenseExclTax: { type: Number, default: 0 },
      highSideOverhead: { type: Number, default: 0 },
      highSideOverheadPercent: { type: Number, default: 0 },
      highSideProfit: { type: Number, default: 0 },
      highSideProfitPercent: { type: Number, default: 0 },
      highSideTotalPriceInclTax: { type: Number, default: 0 },
      highSidePricePerTR: { type: Number, default: 0 },

      lowSideProjectValueExclTax: { type: Number, default: 0 },
      lowSideTotalExpenseExclTax: { type: Number, default: 0 },
      lowSideOverhead: { type: Number, default: 0 },
      lowSideOverheadPercent: { type: Number, default: 0 },
      lowSideProfit: { type: Number, default: 0 },
      lowSideProfitPercent: { type: Number, default: 0 },
      lowSideTotalPriceInclTax: { type: Number, default: 0 },
      lowSidePricePerTR: { type: Number, default: 0 },

      totalProjectValueExclTax: { type: Number, default: 0 },
      totalExpenseExclTax: { type: Number, default: 0 },
      totalOverhead: { type: Number, default: 0 },
      totalOverheadPercent: { type: Number, default: 0 },
      totalProfit: { type: Number, default: 0 },
      totalProfitPercent: { type: Number, default: 0 },
      totalPriceInclTax: { type: Number, default: 0 },
      totalPricePerTR: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Set compound unique constraint to ensure unique revision numbers per enquiry
costingSchema.index({ enquiryId: 1, revision: 1 }, { unique: true });

export const CostingModel = model<ICostingDocument>("Costing", costingSchema);

import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { ICostingRepository } from "../../interfaces/repositories/ICostingRepository";
import { ICosting } from "../../interfaces/models/ICosting";
import { CostingModel, ICostingDocument } from "../../models/Costing";

@injectable()
export class CostingRepository extends BaseRepository<ICostingDocument, ICosting> implements ICostingRepository {
  constructor() {
    super(CostingModel);
  }

  protected toDomain(doc: ICostingDocument): ICosting {
    return {
      id: doc._id.toString(),
      enquiryId: doc.enquiryId,
      enquiryNo: doc.enquiryNo,
      clientId: doc.clientId,
      clientName: doc.clientName,
      date: doc.date,
      projectName: doc.projectName,
      location: doc.location,
      unitType: doc.unitType,
      make: doc.make,
      totalTR: doc.totalTR,
      preparedBy: doc.preparedBy,
      approvedBy: doc.approvedBy,
      revision: doc.revision,
      isActive: doc.isActive,
      highSide: {
        equipment: doc.highSide.equipment.map((e) => ({
          description: e.description,
          qty: e.qty,
          unitRate: e.unitRate,
          cpf: e.cpf,
          cpfMarkupPercent: e.cpfMarkupPercent,
        })),
        designPercent: doc.highSide.designPercent,
        warrantyPercent: doc.highSide.warrantyPercent,
        transportationPercent: doc.highSide.transportationPercent,
        unloadingPercent: doc.highSide.unloadingPercent,
        bankChargesPercent: doc.highSide.bankChargesPercent,
        commissionPercent: doc.highSide.commissionPercent,
        overheadPercent: doc.highSide.overheadPercent,
        profitPercent: doc.highSide.profitPercent,
        gstPercent: doc.highSide.gstPercent,
        cpfMarkupPercent: doc.highSide.cpfMarkupPercent || 16,
      },
      lowSide: {
        laborRatePerDay: doc.lowSide.laborRatePerDay,
        totalTR: doc.lowSide.totalTR,
        materialEstimate: {
          installation: {
            items: (doc.lowSide.materialEstimate.installation?.items || []).map((item: any) => ({
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              ur: item.ur,
              area: item.area,
              remarks: item.remarks,
            })),
          },
          testingCommissioning: {
            items: (doc.lowSide.materialEstimate.testingCommissioning?.items || []).map((item: any) => ({
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              ur: item.ur,
              area: item.area,
              remarks: item.remarks,
            })),
          },
          refPiping: {
            copperPipes: doc.lowSide.materialEstimate.refPiping.copperPipes.map((p) => ({
              size: p.size,
              type: p.type,
              ur: p.ur,
              qty: p.qty,
              remarks: p.remarks,
            })),
            insulation: doc.lowSide.materialEstimate.refPiping.insulation.map((i) => ({
              size: i.size,
              ur: i.ur,
              qty: i.qty,
            })),
            accessories: (doc.lowSide.materialEstimate.refPiping.accessories || []).map((item: any) => ({
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              ur: item.ur,
              area: item.area,
              remarks: item.remarks,
            })),
          },
          controlCabling: {
            cables: doc.lowSide.materialEstimate.controlCabling.cables.map((c) => ({
              size: c.size,
              ur: c.ur,
              qty: c.qty,
              unit: c.unit,
              remarks: c.remarks,
            })),
          },
          powerCabling: {
            cables: doc.lowSide.materialEstimate.powerCabling.cables.map((c) => ({
              size: c.size,
              ur: c.ur,
              qty: c.qty,
              unit: c.unit,
              remarks: c.remarks,
            })),
          },
          drainPiping: {
            pvcPipes: doc.lowSide.materialEstimate.drainPiping.pvcPipes.map((p) => ({
              size: p.size,
              ur: p.ur,
              qty: p.qty,
              unit: p.unit,
              remarks: p.remarks,
            })),
            accessories: (doc.lowSide.materialEstimate.drainPiping.accessories || []).map((item: any) => ({
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              ur: item.ur,
              area: item.area,
              remarks: item.remarks,
            })),
          },
          ducting: {
            gssDucting: doc.lowSide.materialEstimate.ducting.gssDucting.map((d) => ({
              gauge: d.gauge,
              numSheets: d.numSheets,
              wtPerSheet: d.wtPerSheet,
              ratePerKg: d.ratePerKg,
              qtySqMtr: d.qtySqMtr,
            })),
            thermalInsulationUR: doc.lowSide.materialEstimate.ducting.thermalInsulationUR,
            acousticInsulationUR: doc.lowSide.materialEstimate.ducting.acousticInsulationUR,
            accessories: (doc.lowSide.materialEstimate.ducting.accessories || []).map((item: any) => ({
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              ur: item.ur,
              area: item.area,
              remarks: item.remarks,
            })),
          },
          airTerminals: {
            linearGrillQty: doc.lowSide.materialEstimate.airTerminals.linearGrillQty,
            linearGrillRate: doc.lowSide.materialEstimate.airTerminals.linearGrillRate,
            collarDamperQty: doc.lowSide.materialEstimate.airTerminals.collarDamperQty,
            collarDamperRate: doc.lowSide.materialEstimate.airTerminals.collarDamperRate,
            sadQty: doc.lowSide.materialEstimate.airTerminals.sadQty,
            sadRate: doc.lowSide.materialEstimate.airTerminals.sadRate,
            radQty: doc.lowSide.materialEstimate.airTerminals.radQty,
            radRate: doc.lowSide.materialEstimate.airTerminals.radRate,
            freightRate: doc.lowSide.materialEstimate.airTerminals.freightRate,
            linearGrillRemarks: doc.lowSide.materialEstimate.airTerminals.linearGrillRemarks,
            collarDamperRemarks: doc.lowSide.materialEstimate.airTerminals.collarDamperRemarks,
            sadRemarks: doc.lowSide.materialEstimate.airTerminals.sadRemarks,
            radRemarks: doc.lowSide.materialEstimate.airTerminals.radRemarks,
            items: (doc.lowSide.materialEstimate.airTerminals.items || []).map((item: any) => ({
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              ur: item.ur,
              area: item.area,
              remarks: item.remarks,
            })),
          },
          eyeballDiffuser: {
            diffuserQty: doc.lowSide.materialEstimate.eyeballDiffuser.diffuserQty,
            diffuserRate: doc.lowSide.materialEstimate.eyeballDiffuser.diffuserRate,
            freightRate: doc.lowSide.materialEstimate.eyeballDiffuser.freightRate,
            remarks: doc.lowSide.materialEstimate.eyeballDiffuser.remarks,
            items: (doc.lowSide.materialEstimate.eyeballDiffuser.items || []).map((item: any) => ({
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              ur: item.ur,
              area: item.area,
              remarks: item.remarks,
            })),
          },
          oduStand: {
            standQty: doc.lowSide.materialEstimate.oduStand.standQty,
            standRate: doc.lowSide.materialEstimate.oduStand.standRate,
            remarks: doc.lowSide.materialEstimate.oduStand.remarks,
            items: (doc.lowSide.materialEstimate.oduStand.items || []).map((item: any) => ({
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              ur: item.ur,
              area: item.area,
              remarks: item.remarks,
            })),
          },
          pvcCasingCap: {
            capQty: doc.lowSide.materialEstimate.pvcCasingCap.capQty,
            capRate: doc.lowSide.materialEstimate.pvcCasingCap.capRate,
            remarks: doc.lowSide.materialEstimate.pvcCasingCap.remarks,
            items: (doc.lowSide.materialEstimate.pvcCasingCap.items || []).map((item: any) => ({
              description: item.description,
              qty: item.qty,
              unit: item.unit,
              ur: item.ur,
              area: item.area,
              remarks: item.remarks,
            })),
          },
        },
        items: doc.lowSide.items.map((i) => ({
          srNo: i.srNo,
          description: i.description,
          qty: i.qty,
          unit: i.unit,
          materialRate: i.materialRate,
          labourRate: i.labourRate,
          stdRate: i.stdRate,
          rateUnit: i.rateUnit,
          cpfRate: i.cpfRate,
          qRate: i.qRate,
        })),
        designPercent: doc.lowSide.designPercent,
        warrantyPercent: doc.lowSide.warrantyPercent,
        contingencyPercent: doc.lowSide.contingencyPercent,
        transportationPercent: doc.lowSide.transportationPercent,
        accommodationValue: doc.lowSide.accommodationValue,
        unloadingPercent: doc.lowSide.unloadingPercent,
        bankChargesPercent: doc.lowSide.bankChargesPercent,
        overheadPercent: doc.lowSide.overheadPercent,
        profitPercent: doc.lowSide.profitPercent,
        gstPercent: doc.lowSide.gstPercent,
      },
      summary: {
        highSideProjectValueExclTax: doc.summary.highSideProjectValueExclTax,
        highSideTotalExpenseExclTax: doc.summary.highSideTotalExpenseExclTax,
        highSideOverhead: doc.summary.highSideOverhead,
        highSideOverheadPercent: doc.summary.highSideOverheadPercent,
        highSideProfit: doc.summary.highSideProfit,
        highSideProfitPercent: doc.summary.highSideProfitPercent,
        highSideTotalPriceInclTax: doc.summary.highSideTotalPriceInclTax,
        highSidePricePerTR: doc.summary.highSidePricePerTR,

        lowSideProjectValueExclTax: doc.summary.lowSideProjectValueExclTax,
        lowSideTotalExpenseExclTax: doc.summary.lowSideTotalExpenseExclTax,
        lowSideOverhead: doc.summary.lowSideOverhead,
        lowSideOverheadPercent: doc.summary.lowSideOverheadPercent,
        lowSideProfit: doc.summary.lowSideProfit,
        lowSideProfitPercent: doc.summary.lowSideProfitPercent,
        lowSideTotalPriceInclTax: doc.summary.lowSideTotalPriceInclTax,
        lowSidePricePerTR: doc.summary.lowSidePricePerTR,

        totalProjectValueExclTax: doc.summary.totalProjectValueExclTax,
        totalExpenseExclTax: doc.summary.totalExpenseExclTax,
        totalOverhead: doc.summary.totalOverhead,
        totalOverheadPercent: doc.summary.totalOverheadPercent,
        totalProfit: doc.summary.totalProfit,
        totalProfitPercent: doc.summary.totalProfitPercent,
        totalPriceInclTax: doc.summary.totalPriceInclTax,
        totalPricePerTR: doc.summary.totalPricePerTR,
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  public async findByEnquiryId(enquiryId: string): Promise<ICosting[]> {
    const docs = await this.model.find({ enquiryId }).sort({ revision: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  public async findActiveByEnquiryId(enquiryId: string): Promise<ICosting | null> {
    const doc = await this.model.findOne({ enquiryId, isActive: true }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  public async getNextRevisionNumber(enquiryId: string): Promise<number> {
    const latest = await this.model.findOne({ enquiryId }).sort({ revision: -1 }).exec();
    return latest ? latest.revision + 1 : 0;
  }

  public async deactivateAllForEnquiry(enquiryId: string): Promise<void> {
    await this.model.updateMany({ enquiryId }, { isActive: false }).exec();
  }
}

import { Request, Response, NextFunction } from "express";
import { CopperPipeRateModel, ICopperPipeRate } from "../models/CopperPipeRate";
import { StatusCode } from "../constants/statusCodes";

export class CopperPipeRateController {
  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rates = await CopperPipeRateModel.find().sort({ type: 1, size: 1 }).exec();
      res.status(StatusCode.OK).json({ success: true, data: rates });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { size, type, rate, sleeveRate, unit, remarks } = req.body;
      const newRate = new CopperPipeRateModel({
        size,
        type,
        rate,
        sleeveRate,
        unit: unit || "M",
        remarks: remarks || ""
      });
      const saved = await newRate.save();
      res.status(StatusCode.CREATED).json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { size, type, rate, sleeveRate, unit, remarks } = req.body;
      const updated = await CopperPipeRateModel.findByIdAndUpdate(
        id,
        { size, type, rate, sleeveRate, unit, remarks },
        { new: true }
      ).exec();
      if (!updated) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Copper pipe rate not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await CopperPipeRateModel.findByIdAndDelete(id).exec();
      if (!deleted) {
        res.status(StatusCode.NOT_FOUND).json({ success: false, message: "Copper pipe rate not found" });
        return;
      }
      res.status(StatusCode.OK).json({ success: true, data: deleted });
    } catch (error) {
      next(error);
    }
  };

  public sync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rates = req.body as ICopperPipeRate[];
      
      // Clean and sync the database collection
      await CopperPipeRateModel.deleteMany({});
      
      let result: any[] = [];
      if (rates && rates.length > 0) {
        // Remove mongoose fields if present in the payload (like _id, __v, createdAt, updatedAt)
        const sanitized = rates.map(({ size, type, rate, sleeveRate, unit, remarks }) => ({
          size,
          type,
          rate,
          sleeveRate,
          unit,
          remarks
        }));
        result = await CopperPipeRateModel.insertMany(sanitized);
      }
      
      res.status(StatusCode.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}


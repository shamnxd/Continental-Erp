import mongoose from "mongoose";
import { Logger } from "../utils/logger";
import { env } from "./env";
import { CopperPipeRateModel } from "../models/CopperPipeRate";

const seedCopperPipeRates = async () => {
  try {
    const count = await CopperPipeRateModel.countDocuments();
    if (count === 0) {
      const defaultRates = [
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
      await CopperPipeRateModel.insertMany(defaultRates);
      Logger.info("[Seed] Default copper pipe rates seeded successfully.");
    }
  } catch (err) {
    Logger.error("[Seed] Failed to seed default copper pipe rates", err);
  }
};

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.connection.on("connected", () => {
      Logger.info("MongoDB connected successfully. Database connection pooled.");
    });

    mongoose.connection.on("error", (err) => {
      Logger.error("MongoDB connection error occurred", err);
    });

    mongoose.connection.on("disconnected", () => {
      Logger.warn("MongoDB connection disconnected.");
    });

    await mongoose.connect(env.MONGO_URI);
    await seedCopperPipeRates();
  } catch (error) {
    Logger.error("Critical: Failed to connect to MongoDB", error);
    process.exit(1);
  }
};

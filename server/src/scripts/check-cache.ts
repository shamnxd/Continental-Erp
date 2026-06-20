import mongoose from "mongoose";
import { TallyCacheModel } from "../models/TallyCache";
import { env } from "../config/env";

async function run() {
  await mongoose.connect(env.MONGO_URI || "mongodb://127.0.0.1:27017/continental_service");
  const caches = await TallyCacheModel.find({}, { key: 1, lastSyncedAt: 1 });
  console.log("=== MongoDB Tally Caches ===");
  console.log(JSON.stringify(caches, null, 2));
  await mongoose.disconnect();
}
run().catch(console.error);

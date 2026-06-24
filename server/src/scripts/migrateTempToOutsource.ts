import "reflect-metadata";
import mongoose from "mongoose";
import { env } from "../config/env";
import { StaffModel } from "../models/Staff";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(env.MONGO_URI);

  try {
    console.log("Querying for staff members with employmentType: 'Temporary'...");
    
    // Perform bulk update
    const result = await StaffModel.updateMany(
      { employmentType: "Temporary" },
      { $set: { employmentType: "Outsource" } }
    );

    console.log(`Migration completed successfully!`);
    console.log(`Matched documents: ${result.matchedCount}`);
    console.log(`Modified documents: ${result.modifiedCount}`);
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

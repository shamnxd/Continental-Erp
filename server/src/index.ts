import app from "./app";
import { connectDatabase } from "./config/db";
import { Logger } from "./utils/logger";
import { env } from "./config/env";
import { migrateSchedules } from "./utils/migrateSchedules";

const PORT = parseInt(env.PORT, 10) || 5000;

const startServer = async (): Promise<void> => {
  // 1. Initialize Logger & clean files older than 3 days
  Logger.initialize();
  Logger.info("Logger system initialized and operational.");

  // 2. Connect to MongoDB
  await connectDatabase();
  await migrateSchedules();

  // 3. Bind and listen to network port
  app.listen(PORT, () => {
    Logger.info(`[Server] Continental Service Suite active on port ${PORT}`);
  });
};

startServer().catch(err => {
  Logger.error("Fatal error during server startup", err);
});

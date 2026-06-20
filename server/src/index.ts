import http from "http";
import app from "./app";
import { connectDatabase } from "./config/db";
import { Logger } from "./utils/logger";
import { env } from "./config/env";
import { initTallySocket } from "./config/tallySocket";

const PORT = parseInt(env.PORT, 10) || 5000;

const startServer = async (): Promise<void> => {
  // 1. Initialize Logger & clean files older than 3 days
  Logger.initialize();
  Logger.info("Logger system initialized and operational.");

  // 2. Connect to MongoDB
  await connectDatabase();

  // 3. Create HTTP Server & initialize WebSockets
  const httpServer = http.createServer(app);
  initTallySocket(httpServer);

  // 4. Bind and listen to network port
  httpServer.listen(PORT, () => {
    Logger.info(`[Server] Continental Service Suite active on port ${PORT}`);
  });
};

startServer().catch(err => {
  Logger.error("Fatal error during server startup", err);
});

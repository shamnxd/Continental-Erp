import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { TallySyncQueueModel } from "../models/TallySyncQueue";
import { TallyFinancialSnapshotModel } from "../models/TallyFinancialSnapshot";
import { ClientModel } from "../models/Client";
import { PurchaseOrderModel } from "../models/PurchaseOrder";
import { QuotationModel } from "../models/Quotation";
import { Logger } from "../utils/logger";

let activeAgentSocket: WebSocket | null = null;
const TALLY_SYNC_TOKEN = process.env.TALLY_SYNC_TOKEN || "tally_secret_token_123";

interface PendingRequest {
  resolve: (data: any) => void;
  reject: (err: any) => void;
  timer: NodeJS.Timeout;
}

const pendingRequests = new Map<string, PendingRequest>();

export function sendQueryToAgent(type: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isAgentOnline()) {
      return reject(new Error("Local Tally Sync Agent is currently offline"));
    }

    const requestId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`Timeout waiting for response from Tally Agent for query: ${type}`));
    }, 15000); // 15s timeout

    pendingRequests.set(requestId, { resolve, reject, timer });

    const success = sendToAgent(type, { requestId, ...payload });
    if (!success) {
      clearTimeout(timer);
      pendingRequests.delete(requestId);
      reject(new Error("Failed to transmit request to Tally Agent"));
    }
  });
}

export function initTallySocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    
    if (url.pathname === "/tally-sync") {
      const token = url.searchParams.get("token");
      if (token !== TALLY_SYNC_TOKEN) {
        Logger.warn("[TallySocket] Unauthorized connection attempt rejected.");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    Logger.info("[TallySocket] Local Tally Sync Agent connected successfully.");
    
    if (activeAgentSocket) {
      Logger.info("[TallySocket] Closing previous agent connection.");
      activeAgentSocket.close();
    }
    
    activeAgentSocket = ws;

    // Send any pending sync items immediately upon connection
    processPendingQueue();

    ws.on("message", async (message: string) => {
      try {
        const parsed = JSON.parse(message);
        const { type, data } = parsed;

        Logger.info(`[TallySocket] Received event from agent: ${type}`);

        if (type === "sync:callback") {
          await handleSyncCallback(data);
        } else if (type === "pull:financials:result") {
          await handleFinancialsResult(data);
        } else if (type.endsWith(":result")) {
          const { requestId, success, data: resultData, error } = data;
          const pending = pendingRequests.get(requestId);
          if (pending) {
            clearTimeout(pending.timer);
            pendingRequests.delete(requestId);
            if (success) {
              pending.resolve(resultData);
            } else {
              pending.reject(new Error(error || `Agent query failed: ${type}`));
            }
          }
        } else if (type === "heartbeat") {
          // Keepalive
          ws.send(JSON.stringify({ type: "heartbeat:ack" }));
        }
      } catch (err) {
        Logger.error("[TallySocket] Error parsing agent message", err);
      }
    });

    ws.on("close", () => {
      Logger.warn("[TallySocket] Local Tally Sync Agent disconnected.");
      if (activeAgentSocket === ws) {
        activeAgentSocket = null;
      }
    });

    ws.on("error", (err) => {
      Logger.error("[TallySocket] WebSocket error", err);
    });
  });
}

export function isAgentOnline(): boolean {
  return activeAgentSocket !== null && activeAgentSocket.readyState === WebSocket.OPEN;
}

export function sendToAgent(type: string, payload: any): boolean {
  if (!isAgentOnline()) {
    Logger.warn(`[TallySocket] Cannot send message '${type}'; Agent is offline.`);
    return false;
  }
  try {
    activeAgentSocket!.send(JSON.stringify({ type, data: payload }));
    Logger.info(`[TallySocket] Sent message '${type}' to Agent.`);
    return true;
  } catch (error) {
    Logger.error(`[TallySocket] Error sending message to Agent`, error);
    return false;
  }
}

/**
 * Fetch all pending queue entries and push them to the agent
 */
export async function processPendingQueue(): Promise<void> {
  if (!isAgentOnline()) return;

  try {
    const pendingItems = await TallySyncQueueModel.find({ status: "Pending" }).sort({ createdAt: 1 });
    if (pendingItems.length === 0) return;

    Logger.info(`[TallySocket] Found ${pendingItems.length} pending sync items. Pushing to agent...`);
    
    for (const item of pendingItems) {
      item.status = "Processing";
      item.attempts += 1;
      await item.save();

      const success = sendToAgent("sync:entity", {
        queueId: item._id,
        entityType: item.entityType,
        entityId: item.entityId,
        payload: item.payload
      });

      if (!success) {
        item.status = "Pending";
        await item.save();
        break; // Stop pushing if send fails (e.g. connection lost)
      }
    }
  } catch (error) {
    Logger.error("[TallySocket] Error processing pending queue", error);
  }
}

/**
 * Handle callbacks from agent indicating whether Tally import succeeded or failed
 */
async function handleSyncCallback(data: any): Promise<void> {
  const { queueId, status, error, tallyVoucherNo, tallyLedgerName } = data;
  
  try {
    const queueItem = await TallySyncQueueModel.findById(queueId);
    if (!queueItem) {
      Logger.warn(`[TallySocket] Callback received for unknown queue ID: ${queueId}`);
      return;
    }

    queueItem.status = status;
    if (status === "Synced") {
      queueItem.syncedAt = new Date();
      queueItem.lastError = "";
    } else {
      queueItem.lastError = error || "Unknown sync error";
    }
    await queueItem.save();

    // Now update the original entity record with sync status
    const updateFields: any = {
      tallySyncStatus: status,
      tallySyncError: status === "Failed" ? (error || "Sync failed") : "",
      tallyLastSyncedAt: status === "Synced" ? new Date() : undefined
    };

    if (status === "Synced") {
      if (tallyVoucherNo) updateFields.tallyVoucherNo = tallyVoucherNo;
      if (tallyLedgerName) updateFields.tallyLedgerName = tallyLedgerName;
    }

    if (queueItem.entityType === "Client") {
      await ClientModel.findByIdAndUpdate(queueItem.entityId, updateFields);
    } else if (queueItem.entityType === "PurchaseOrder") {
      await PurchaseOrderModel.findByIdAndUpdate(queueItem.entityId, updateFields);
    } else if (queueItem.entityType === "Quotation") {
      await QuotationModel.findByIdAndUpdate(queueItem.entityId, updateFields);
    }

    Logger.info(`[TallySocket] Queue ID ${queueId} successfully updated to ${status}`);
    
    // Process next item in queue
    processPendingQueue();
  } catch (err) {
    Logger.error("[TallySocket] Error in handleSyncCallback", err);
  }
}

/**
 * Handle incoming Profit & Loss statement reports from Tally
 */
async function handleFinancialsResult(data: any): Promise<void> {
  const { success, error, periodStart, periodEnd, revenue, expenses, netProfit, grossProfit, topExpenseLedgers } = data;

  if (!success) {
    Logger.error(`[TallySocket] Failed to fetch financials from agent: ${error}`);
    return;
  }

  try {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    await TallyFinancialSnapshotModel.findOneAndUpdate(
      { periodStart: start, periodEnd: end },
      {
        revenue,
        expenses,
        netProfit,
        grossProfit,
        topExpenseLedgers,
        tallySyncedAt: new Date()
      },
      { upsert: true, new: true }
    );

    Logger.info(`[TallySocket] Saved financial snapshot for period ${periodStart} to ${periodEnd}`);
  } catch (err) {
    Logger.error("[TallySocket] Error saving financial snapshot", err);
  }
}

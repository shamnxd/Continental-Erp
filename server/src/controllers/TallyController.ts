import { Request, Response, NextFunction } from "express";
import { TallySyncQueueModel } from "../models/TallySyncQueue";
import { TallyFinancialSnapshotModel } from "../models/TallyFinancialSnapshot";
import { TallyCacheModel } from "../models/TallyCache";
import { StatusCode } from "../constants/statusCodes";
import { isAgentOnline, processPendingQueue, sendToAgent, sendQueryToAgent } from "../config/tallySocket";
import { Logger } from "../utils/logger";

export class TallyController {
  
  public getConnectionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const online = isAgentOnline();
      res.status(StatusCode.OK).json({
        success: true,
        data: {
          online,
          status: online ? "Online" : "Offline"
        }
      });
    } catch (error) {
      next(error);
    }
  };

  public getSyncLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const logs = await TallySyncQueueModel.find().sort({ createdAt: -1 }).limit(100);
      res.status(StatusCode.OK).json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  };

  public retrySync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const queueItem = await TallySyncQueueModel.findById(id);

      if (!queueItem) {
        res.status(StatusCode.NOT_FOUND).json({
          success: false,
          message: "Sync queue item not found"
        });
        return;
      }

      queueItem.status = "Pending";
      queueItem.lastError = "";
      await queueItem.save();

      // Trigger socket send immediately if agent is online
      processPendingQueue();

      res.status(StatusCode.OK).json({
        success: true,
        message: "Sync task queued for retry"
      });
    } catch (error) {
      next(error);
    }
  };

  public pullLiveFinancials = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { periodStart, periodEnd } = req.body;

      if (!periodStart || !periodEnd) {
        res.status(StatusCode.BAD_REQUEST).json({
          success: false,
          message: "periodStart and periodEnd are required fields"
        });
        return;
      }

      if (!isAgentOnline()) {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Local Tally Sync Agent is currently offline"
        });
        return;
      }

      // Trigger pull request to agent over websocket
      const sent = sendToAgent("pull:financials", { periodStart, periodEnd });

      if (sent) {
        res.status(StatusCode.OK).json({
          success: true,
          message: "Requested live Profit & Loss data from Tally Agent"
        });
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Failed to transmit pull request to Tally Agent"
        });
      }
    } catch (error) {
      next(error);
    }
  };

  public getFinancialAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { periodStart, periodEnd } = req.query;

      const query: any = {};
      if (periodStart && periodEnd) {
        const startDate = new Date(periodStart as string);
        const endDate = new Date(periodEnd as string);
        endDate.setUTCHours(23, 59, 59, 999);
        
        query.periodStart = { $gte: startDate };
        query.periodEnd = { $lte: endDate };
      }

      const snapshots = await TallyFinancialSnapshotModel.find(query).sort({ periodStart: 1 });
      
      res.status(StatusCode.OK).json({
        success: true,
        data: snapshots
      });
    } catch (error) {
      next(error);
    }
  };

  private executeCachedQuery = async (
    cacheKey: string,
    queryType: string,
    payload: any,
    defaultValue: any,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const online = isAgentOnline();
      if (online) {
        try {
          const result = await sendQueryToAgent(queryType, payload);
          await TallyCacheModel.findOneAndUpdate(
            { key: cacheKey },
            { data: result, lastSyncedAt: new Date() },
            { upsert: true, new: true }
          );
          res.status(StatusCode.OK).json({
            success: true,
            data: result,
            isCached: false,
            lastSyncedAt: new Date()
          });
          return;
        } catch (agentError: any) {
          Logger.warn(`[TallyController] Agent query '${queryType}' failed, falling back to cache: ${agentError.message}`);
        }
      }

      // Fallback to cache (runs if offline OR if agent query failed)
      const cached = await TallyCacheModel.findOne({ key: cacheKey });
      if (cached) {
        res.status(StatusCode.OK).json({
          success: true,
          data: cached.data,
          isCached: true,
          lastSyncedAt: cached.lastSyncedAt,
          message: "Tally Agent/database is offline. Serving cached data."
        });
      } else {
        res.status(StatusCode.OK).json({
          success: true,
          data: defaultValue,
          isCached: true,
          lastSyncedAt: null,
          message: "Tally Agent is offline. No cached data is available for this period."
        });
      }
    } catch (error) {
      next(error);
    }
  };

  public getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { periodStart, periodEnd } = req.query;
      const key = `invoices:${periodStart || ""}:${periodEnd || ""}`;
      await this.executeCachedQuery(
        key,
        "pull:invoices",
        { periodStart, periodEnd },
        [],
        res,
        next
      );
    } catch (error) {
      next(error);
    }
  };

  public createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await sendQueryToAgent("sync:invoice:direct", { payload: req.body });
      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getReceipts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { periodStart, periodEnd } = req.query;
      const key = `receipts:${periodStart || ""}:${periodEnd || ""}`;
      await this.executeCachedQuery(
        key,
        "pull:receipts",
        { periodStart, periodEnd },
        [],
        res,
        next
      );
    } catch (error) {
      next(error);
    }
  };

  public createReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await sendQueryToAgent("sync:receipt:direct", { payload: req.body });
      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { periodStart, periodEnd } = req.query;
      const key = `expenses:${periodStart || ""}:${periodEnd || ""}`;
      await this.executeCachedQuery(
        key,
        "pull:expenses",
        { periodStart, periodEnd },
        [],
        res,
        next
      );
    } catch (error) {
      next(error);
    }
  };

  public createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await sendQueryToAgent("sync:expense:direct", { payload: req.body });
      res.status(StatusCode.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getBalances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.executeCachedQuery(
        "balances",
        "pull:balances",
        {},
        [],
        res,
        next
      );
    } catch (error) {
      next(error);
    }
  };

  public getTaxSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { periodStart, periodEnd } = req.query;
      const key = `tax-summary:${periodStart || ""}:${periodEnd || ""}`;
      await this.executeCachedQuery(
        key,
        "pull:tax-summary",
        { periodStart, periodEnd },
        null,
        res,
        next
      );
    } catch (error) {
      next(error);
    }
  };

  public getAgingReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.executeCachedQuery(
        "aging",
        "pull:aging",
        {},
        [],
        res,
        next
      );
    } catch (error) {
      next(error);
    }
  };
}

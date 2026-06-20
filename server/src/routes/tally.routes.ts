import { Router } from "express";
import { TallyController } from "../controllers/TallyController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const controller = new TallyController();

// Require authentication for all Tally management endpoints
router.use(requireAuth);

router.get("/status", controller.getConnectionStatus);
router.get("/sync-queue", controller.getSyncLogs);
router.post("/sync-queue/:id/retry", controller.retrySync);
router.post("/pull-live", controller.pullLiveFinancials);
router.get("/financial-analytics", controller.getFinancialAnalytics);

router.get("/invoices", controller.getInvoices);
router.post("/invoices", controller.createInvoice);
router.get("/receipts", controller.getReceipts);
router.post("/receipts", controller.createReceipt);
router.get("/expenses", controller.getExpenses);
router.post("/expenses", controller.createExpense);
router.get("/balances", controller.getBalances);
router.get("/tax-summary", controller.getTaxSummary);
router.get("/aging", controller.getAgingReports);

export const tallyRouter = router;

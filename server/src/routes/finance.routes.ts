import { Router } from "express";
import { FinanceController } from "../controllers/FinanceController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import {
  CreateClientInvoiceSchema,
  CreateVendorBillSchema,
  CreateLedgerEntrySchema,
  CreateIncomeEntrySchema,
  CreateExpenseEntrySchema,
  RecordInvoicePaymentSchema,
  RecordVendorBillPaymentSchema,
} from "../dtos/finance.dto";

const router = Router();
const controller = new FinanceController();

router.use(requireAuth);

// Client Invoices
router.post("/invoices", validateDto(CreateClientInvoiceSchema), controller.createInvoice);
router.get("/invoices", controller.getInvoices);
router.get("/invoices/:id", controller.getInvoiceById);
router.post("/invoices/:id/payments", validateDto(RecordInvoicePaymentSchema), controller.recordInvoicePayment);
router.post("/invoices/:id/send-email", controller.sendInvoiceEmail);

// Vendor Bills
router.post("/bills", validateDto(CreateVendorBillSchema), controller.createBill);
router.get("/bills", controller.getBills);
router.post("/bills/:id/payments", validateDto(RecordVendorBillPaymentSchema), controller.recordBillPayment);

// Central Ledger
router.post("/ledger", validateDto(CreateLedgerEntrySchema), controller.createLedger);
router.get("/ledger", controller.getLedger);

// Income Sheet
router.post("/income", validateDto(CreateIncomeEntrySchema), controller.createIncome);
router.get("/income", controller.getIncome);

// Expense Sheet
router.post("/expenses", validateDto(CreateExpenseEntrySchema), controller.createExpense);
router.get("/expenses", controller.getExpenses);

export const financeRouter = router;

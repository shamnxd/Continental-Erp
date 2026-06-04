import { z } from "zod";

const financeLineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  itemCode: z.string().trim().optional(),
  unit: z.string().trim().optional().default("Nos"),
  qty: z.number().min(0),
  rate: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  total: z.number().min(0).optional(),
  hsnSac: z.string().trim().optional(),
});

const invoiceTypeEnum = z.enum([
  "Tax Invoice",
  "Proforma",
  "AMC Invoice",
  "Credit Note",
  "AMC Upfront",
  "Complaint Postpaid",
  "Supplementary",
]);

export const CreateClientInvoiceSchema = z.object({
  invoiceNo: z.string().trim().optional(),
  invoiceType: invoiceTypeEnum,
  documentStatus: z.enum(["Draft", "Approved", "Cancelled"]).optional().default("Draft"),
  companyName: z.string().trim().optional().default("Continental"),
  currency: z.string().trim().optional().default("INR"),
  clientId: z.string().trim().optional(),
  clientName: z.string().min(1, "Client name is required"),
  contactPerson: z.string().trim().optional(),
  clientEmail: z.string().trim().optional(),
  clientPhone: z.string().trim().optional(),
  clientGstin: z.string().trim().optional(),
  billingAddress: z.string().trim().optional(),
  siteAddress: z.string().trim().optional(),
  placeOfSupply: z.string().trim().optional(),
  enquiryId: z.string().trim().optional(),
  enquiryNo: z.string().trim().optional(),
  quotationId: z.string().trim().optional(),
  quotationNo: z.string().trim().optional(),
  complaintId: z.string().trim().optional(),
  complaintNo: z.string().trim().optional(),
  amcId: z.string().trim().optional(),
  amcNo: z.string().trim().optional(),
  smrId: z.string().trim().optional(),
  smrNo: z.string().trim().optional(),
  jobCardNo: z.string().trim().optional(),
  workOrderNo: z.string().trim().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  paymentTerms: z.string().trim().optional(),
  items: z.array(financeLineItemSchema).min(1, "At least one line item is required"),
  gstPercent: z.number().min(0).max(100).optional().default(18),
  supplyType: z.enum(["intra", "inter"]).optional().default("intra"),
  cgstPercent: z.number().min(0).max(100).optional(),
  sgstPercent: z.number().min(0).max(100).optional(),
  igstPercent: z.number().min(0).max(100).optional(),
  vatPercent: z.number().min(0).max(100).optional(),
  headerDiscount: z.number().min(0).optional().default(0),
  roundOff: z.number().optional(),
  amountPaid: z.number().min(0).optional().default(0),
  notes: z.string().trim().optional(),
  terms: z.string().trim().optional(),
});

export type CreateClientInvoiceDto = z.infer<typeof CreateClientInvoiceSchema>;

export const RecordInvoicePaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than zero"),
  paymentDate: z.string().min(1).optional(),
  note: z.string().trim().optional(),
});

export type RecordInvoicePaymentDto = z.infer<typeof RecordInvoicePaymentSchema>;

export const CreateVendorBillSchema = z.object({
  billNo: z.string().trim().optional(),
  vendor: z.string().min(1, "Vendor name is required"),
  vendorGstin: z.string().trim().optional(),
  vendorInvoiceNo: z.string().trim().optional(),
  category: z.enum(["Spare Parts", "Subcontractor", "Salary", "Rent", "GST", "Utility"]),
  billDate: z.string().min(1, "Bill date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  paymentTerms: z.string().trim().optional(),
  referenceNo: z.string().trim().optional(),
  items: z.array(financeLineItemSchema).min(1, "At least one line item is required"),
  gstPercent: z.number().min(0).max(100).optional().default(18),
  amountPaid: z.number().min(0).optional().default(0),
  notes: z.string().trim().optional(),
});

export type CreateVendorBillDto = z.infer<typeof CreateVendorBillSchema>;

export const RecordVendorBillPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be greater than zero"),
  paymentDate: z.string().min(1).optional(),
  note: z.string().trim().optional(),
});

export type RecordVendorBillPaymentDto = z.infer<typeof RecordVendorBillPaymentSchema>;

export const CreateLedgerEntrySchema = z.object({
  date: z.string().min(1, "Date is required"),
  refType: z.enum(["INVOICE", "VENDOR_BILL", "PAYMENT_IN", "PAYMENT_OUT", "ADVANCE_IN", "ADJUSTMENT"]),
  refNo: z.string().min(1, "Reference number is required"),
  narration: z.string().min(1, "Narration is required"),
  debit: z.number().min(0),
  credit: z.number().min(0),
});

export type CreateLedgerEntryDto = z.infer<typeof CreateLedgerEntrySchema>;

export const CreateIncomeEntrySchema = z.object({
  source: z.string().min(1, "Source label is required"),
  sourceType: z.enum(["Client Payment", "AMC Renewal", "Advance", "Refund", "Other"]).optional().default("Client Payment"),
  clientId: z.string().trim().optional(),
  clientName: z.string().trim().optional(),
  incomeDate: z.string().min(1, "Income date is required"),
  expectedDate: z.string().trim().optional(),
  expectedAmount: z.number().min(0),
  actualReceived: z.number().min(0).optional().default(0),
  paymentMethod: z.string().trim().optional(),
  referenceNo: z.string().trim().optional(),
  enquiryId: z.string().trim().optional(),
  enquiryNo: z.string().trim().optional(),
  quotationId: z.string().trim().optional(),
  quotationNo: z.string().trim().optional(),
  complaintId: z.string().trim().optional(),
  complaintNo: z.string().trim().optional(),
  amcId: z.string().trim().optional(),
  amcNo: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type CreateIncomeEntryDto = z.infer<typeof CreateIncomeEntrySchema>;

export const CreateExpenseEntrySchema = z.object({
  category: z.enum(["Salary", "Rent", "GST", "Utilities", "Materials", "Travel", "Fuel", "Other"]),
  name: z.string().min(1, "Expense title is required"),
  description: z.string().trim().optional(),
  payee: z.string().trim().optional(),
  expenseDate: z.string().min(1, "Expense date is required"),
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM"),
  paymentMethod: z.string().trim().optional(),
  referenceNo: z.string().trim().optional(),
  budget: z.number().min(0).optional().default(0),
  actual: z.number().min(0),
  status: z.enum(["Planned", "Recorded", "Paid"]).optional().default("Recorded"),
  notes: z.string().trim().optional(),
});

export type CreateExpenseEntryDto = z.infer<typeof CreateExpenseEntrySchema>;

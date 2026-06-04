export type PaymentState =
  | "Fully Paid"
  | "Partially Paid"
  | "Advance Received"
  | "Overdue"
  | "Open";

export type InvoiceType =
  | "Tax Invoice"
  | "Proforma"
  | "AMC Invoice"
  | "Credit Note"
  | "AMC Upfront"
  | "Complaint Postpaid"
  | "Supplementary";

export type InvoiceDocumentStatus = "Draft" | "Approved" | "Cancelled";
export type GstSupplyType = "intra" | "inter";
export type BillCategory = "Spare Parts" | "Subcontractor" | "Salary" | "Rent" | "GST" | "Utility";
export type VendorBillStatus = "Paid" | "Partially Paid" | "Overdue" | "Open";
export type ExpenseStatus = "Planned" | "Recorded" | "Paid";
export type IncomeSourceType = "Client Payment" | "AMC Renewal" | "Advance" | "Refund" | "Other";

export interface FinanceLineItem {
  description: string;
  itemCode?: string;
  unit: string;
  qty: number;
  rate: number;
  discountPercent: number;
  total: number;
  hsnSac?: string;
}

export interface ClientInvoice {
  id: string;
  invoiceNo: string;
  invoiceType: InvoiceType;
  documentStatus: InvoiceDocumentStatus;
  companyName: string;
  currency: string;
  clientId?: string;
  clientName: string;
  contactPerson?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientGstin?: string;
  billingAddress?: string;
  siteAddress?: string;
  placeOfSupply?: string;
  enquiryId?: string;
  enquiryNo?: string;
  quotationId?: string;
  quotationNo?: string;
  complaintId?: string;
  complaintNo?: string;
  amcId?: string;
  amcNo?: string;
  smrId?: string;
  smrNo?: string;
  jobCardNo?: string;
  workOrderNo?: string;
  issueDate: string;
  dueDate: string;
  paymentTerms?: string;
  items: FinanceLineItem[];
  subtotal: number;
  headerDiscount: number;
  taxableAmount: number;
  gstPercent: number;
  supplyType: GstSupplyType;
  cgstPercent?: number;
  sgstPercent?: number;
  igstPercent?: number;
  vatPercent?: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  vatAmount?: number;
  gstAmount: number;
  roundOff: number;
  grandTotal: number;
  amountInWords?: string;
  amountPaid: number;
  outstanding: number;
  paymentState: PaymentState;
  notes?: string;
  terms?: string;
}

export interface VendorBill {
  id: string;
  billNo: string;
  vendor: string;
  vendorGstin?: string;
  vendorInvoiceNo?: string;
  category: BillCategory;
  billDate: string;
  dueDate: string;
  paymentTerms?: string;
  referenceNo?: string;
  items: FinanceLineItem[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
  amountPaid: number;
  outstanding: number;
  status: VendorBillStatus;
  notes?: string;
}

export type LedgerRefType =
  | "INVOICE"
  | "VENDOR_BILL"
  | "PAYMENT_IN"
  | "PAYMENT_OUT"
  | "ADVANCE_IN"
  | "ADJUSTMENT";

export interface LedgerEntry {
  id: string;
  date: string;
  refType: LedgerRefType;
  refNo: string;
  narration: string;
  debit: number;
  credit: number;
}

export interface IncomeEntry {
  id: string;
  source: string;
  sourceType: IncomeSourceType;
  clientId?: string;
  clientName?: string;
  incomeDate: string;
  expectedDate?: string;
  expectedAmount: number;
  actualReceived: number;
  paymentMethod?: string;
  referenceNo?: string;
  enquiryId?: string;
  enquiryNo?: string;
  quotationId?: string;
  quotationNo?: string;
  complaintId?: string;
  complaintNo?: string;
  amcId?: string;
  amcNo?: string;
  appliedToInvoiceId?: string;
  notes?: string;
}

export interface ExpenseEntry {
  id: string;
  category: "Salary" | "Rent" | "GST" | "Utilities" | "Materials" | "Travel" | "Fuel" | "Other";
  name: string;
  description?: string;
  payee?: string;
  expenseDate: string;
  periodMonth: string;
  paymentMethod?: string;
  referenceNo?: string;
  budget: number;
  actual: number;
  status: ExpenseStatus;
  notes?: string;
}

export interface CreateClientInvoicePayload {
  invoiceNo?: string;
  invoiceType: InvoiceType;
  documentStatus?: InvoiceDocumentStatus;
  companyName?: string;
  currency?: string;
  clientId?: string;
  clientName: string;
  contactPerson?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientGstin?: string;
  billingAddress?: string;
  siteAddress?: string;
  placeOfSupply?: string;
  enquiryId?: string;
  enquiryNo?: string;
  quotationId?: string;
  quotationNo?: string;
  complaintId?: string;
  complaintNo?: string;
  amcId?: string;
  amcNo?: string;
  smrId?: string;
  smrNo?: string;
  jobCardNo?: string;
  workOrderNo?: string;
  issueDate: string;
  dueDate: string;
  paymentTerms?: string;
  items: FinanceLineItem[];
  gstPercent: number;
  supplyType?: GstSupplyType;
  cgstPercent?: number;
  sgstPercent?: number;
  igstPercent?: number;
  vatPercent?: number;
  headerDiscount?: number;
  roundOff?: number;
  amountPaid?: number;
  notes?: string;
  terms?: string;
}

export interface CreateVendorBillPayload {
  billNo?: string;
  vendor: string;
  vendorGstin?: string;
  vendorInvoiceNo?: string;
  category: BillCategory;
  billDate: string;
  dueDate: string;
  paymentTerms?: string;
  referenceNo?: string;
  items: FinanceLineItem[];
  gstPercent: number;
  amountPaid?: number;
  notes?: string;
}

export interface CreateIncomeEntryPayload {
  source: string;
  sourceType: IncomeSourceType;
  clientId?: string;
  clientName?: string;
  incomeDate: string;
  expectedDate?: string;
  expectedAmount: number;
  actualReceived?: number;
  paymentMethod?: string;
  referenceNo?: string;
  enquiryId?: string;
  enquiryNo?: string;
  quotationId?: string;
  quotationNo?: string;
  complaintId?: string;
  complaintNo?: string;
  amcId?: string;
  amcNo?: string;
  notes?: string;
}

export interface CreateExpenseEntryPayload {
  category: ExpenseEntry["category"];
  name: string;
  description?: string;
  payee?: string;
  expenseDate: string;
  periodMonth: string;
  paymentMethod?: string;
  referenceNo?: string;
  budget?: number;
  actual: number;
  status?: ExpenseStatus;
  notes?: string;
}

export interface RecordPaymentPayload {
  amount: number;
  paymentDate?: string;
  note?: string;
}

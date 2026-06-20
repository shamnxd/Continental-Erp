import "reflect-metadata";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDatabase } from "../config/db";
import { ClientModel } from "../models/Client";
import { TallyFinancialSnapshotModel } from "../models/TallyFinancialSnapshot";
import { TallySyncQueueModel } from "../models/TallySyncQueue";
import { TallyCacheModel } from "../models/TallyCache";
import { Logger } from "../utils/logger";

dotenv.config();
Logger.initialize();

async function run() {
  console.log("🌱 Starting Tally Mock Seeder...");
  
  // Connect database
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/continental_service";
  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB.");

  // 1. Seed Financial Snapshots
  console.log("🧹 Clearing old financial snapshots...");
  await TallyFinancialSnapshotModel.deleteMany({});

  const now = new Date();
  const mockSnapshots = [];

  // Generate 6 months of data
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Create random but realistic profit figures (increasing month-on-month)
    const factor = 1 + (5 - i) * 0.1; // e.g. 1.0, 1.1, 1.2...
    const baseRevenue = 300000 * factor;
    const baseExpenses = 180000 * (1 + (5 - i) * 0.08); // Expenses grow slower than revenue
    
    const revenue = Math.round(baseRevenue);
    const expenses = Math.round(baseExpenses);
    const netProfit = revenue - expenses;
    const grossProfit = Math.round(revenue * 0.55);

    mockSnapshots.push({
      periodStart: start,
      periodEnd: end,
      revenue,
      expenses,
      netProfit,
      grossProfit,
      topExpenseLedgers: [
        { ledgerName: "Technician Salaries", amount: Math.round(expenses * 0.45) },
        { ledgerName: "Travel & Fuel Reimbursement", amount: Math.round(expenses * 0.18) },
        { ledgerName: "Direct Subcontract Work", amount: Math.round(expenses * 0.22) },
        { ledgerName: "Office Overhead & Utilities", amount: Math.round(expenses * 0.15) }
      ],
      tallySyncedAt: new Date()
    });
  }

  await TallyFinancialSnapshotModel.insertMany(mockSnapshots);
  console.log(`✓ Seeded ${mockSnapshots.length} monthly Profit & Loss snapshots in database.`);

  // 2. Queue All Clients for Tally Sync
  console.log("🧹 Clearing pending client sync queues...");
  await TallySyncQueueModel.deleteMany({ entityType: "Client" });

  const clients = await ClientModel.find({});
  console.log(`👤 Found ${clients.length} clients in database to migrate.`);

  let enqueuedCount = 0;
  for (const client of clients) {
    // Check if client is already synced (we want to test sync, so reset their status to Pending)
    client.tallySyncStatus = "Pending";
    client.tallySyncError = "";
    client.tallyLastSyncedAt = undefined;
    await client.save();

    await TallySyncQueueModel.create({
      entityType: "Client",
      entityId: client._id,
      payload: {
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        phone: client.phone,
        email: client.email,
        gst: client.gst || "",
        city: client.city,
        address: client.address || "",
        parentCompany: client.parentCompany || ""
      },
      status: "Pending",
      attempts: 0
    });
    enqueuedCount++;
  }

  console.log(`✓ Enqueued ${enqueuedCount} clients into TallySyncQueue.`);

  // 3. Seed Tally Cache
  console.log("🧹 Clearing old Tally Cache...");
  await TallyCacheModel.deleteMany({});

  const currentStart = new Date();
  currentStart.setDate(1);
  const defaultStartStr = `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultEndStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-30`;

  const mockInvoices = [
    { invoiceNo: "INV-2026-001", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-05`, clientName: "Continental Projects & Facilities", subTotal: 120000, tax: 21600, total: 141600 },
    { invoiceNo: "INV-2026-002", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-12`, clientName: "Reliance Industries Ltd", subTotal: 85000, tax: 15300, total: 100300 },
    { invoiceNo: "INV-2026-003", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-18`, clientName: "Tata Consultancy Services", subTotal: 245000, tax: 44100, total: 289100 },
    { invoiceNo: "INV-2026-004", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-22`, clientName: "Godrej Properties", subTotal: 55000, tax: 9900, total: 64900 }
  ];

  const mockReceipts = [
    { receiptNo: "RCT-2026-001", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-08`, clientName: "Continental Projects & Facilities", amount: 141600, paymentMode: "Bank Transfer", depositLedger: "HDFC Current Account" },
    { receiptNo: "RCT-2026-002", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-15`, clientName: "Reliance Industries Ltd", amount: 100300, paymentMode: "Cheque", depositLedger: "SBI Current Account" },
    { receiptNo: "RCT-2026-003", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-25`, clientName: "Tata Consultancy Services", amount: 289100, paymentMode: "Bank Transfer", depositLedger: "HDFC Current Account" }
  ];

  const mockExpenses = [
    { voucherNo: "EXP-2026-001", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-02`, category: "Office Rent", amount: 45000, description: "Office Rent for current month", payee: "Landlord Properties", bankOrCashLedger: "HDFC Current Account" },
    { voucherNo: "EXP-2026-002", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-10`, category: "Technician Salaries", amount: 125000, description: "Field Technician Monthly Salary", payee: "Salaries Payable", bankOrCashLedger: "HDFC Current Account" },
    { voucherNo: "EXP-2026-003", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-14`, category: "Travel & Fuel Reimbursement", amount: 18500, description: "Technician Travel Reimbursement", payee: "Various Technicians", bankOrCashLedger: "Cash Ledger" },
    { voucherNo: "EXP-2026-004", date: `${currentStart.getFullYear()}-${String(currentStart.getMonth() + 1).padStart(2, "0")}-20`, category: "Office Overhead & Utilities", amount: 12400, description: "Electricity and Water Bill", payee: "MSEB Utilities", bankOrCashLedger: "SBI Current Account" }
  ];

  const mockBalances = [
    { ledgerName: "HDFC Current Account", balance: 1245000.50 },
    { ledgerName: "SBI Current Account", balance: 485000.75 },
    { ledgerName: "Cash Ledger", balance: 35600.00 },
    { ledgerName: "Petty Cash Account", balance: 12500.00 }
  ];

  const mockTaxSummary = {
    cgst: 37450.00,
    sgst: 37450.00,
    igst: 15200.00,
    total: 90100.00
  };

  const mockAging = {
    receivables: [
      { name: "Continental Projects & Facilities", amount: 150000, days30: 90000, days60: 60000, days90: 0, days90plus: 0 },
      { name: "Reliance Industries Ltd", amount: 80000, days30: 0, days60: 80000, days90: 0, days90plus: 0 },
      { name: "Godrej Properties", amount: 45000, days30: 45000, days60: 0, days90: 0, days90plus: 0 },
      { name: "Acme Corp", amount: 12000, days30: 0, days60: 0, days90: 0, days90plus: 12000 }
    ],
    payables: [
      { name: "Vendor Direct Supplies", amount: 65000, days30: 45000, days60: 20000, days90: 0, days90plus: 0 },
      { name: "Global Spares Ltd", amount: 28000, days30: 0, days60: 28000, days90: 0, days90plus: 0 }
    ]
  };

  const cachesToInsert = [
    { key: `invoices:${defaultStartStr}:${defaultEndStr}`, data: mockInvoices, lastSyncedAt: new Date() },
    { key: `invoices::`, data: mockInvoices, lastSyncedAt: new Date() },
    { key: `receipts:${defaultStartStr}:${defaultEndStr}`, data: mockReceipts, lastSyncedAt: new Date() },
    { key: `receipts::`, data: mockReceipts, lastSyncedAt: new Date() },
    { key: `expenses:${defaultStartStr}:${defaultEndStr}`, data: mockExpenses, lastSyncedAt: new Date() },
    { key: `expenses::`, data: mockExpenses, lastSyncedAt: new Date() },
    { key: `balances`, data: mockBalances, lastSyncedAt: new Date() },
    { key: `tax-summary:${defaultStartStr}:${defaultEndStr}`, data: mockTaxSummary, lastSyncedAt: new Date() },
    { key: `tax-summary::`, data: mockTaxSummary, lastSyncedAt: new Date() },
    { key: `aging`, data: mockAging, lastSyncedAt: new Date() }
  ];

  await TallyCacheModel.insertMany(cachesToInsert);
  console.log(`✓ Seeded ${cachesToInsert.length} cache items in database.`);
  console.log("🌱 Tally Mock Seeder completed successfully!");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { Dashboard } from "./features/dashboard/Dashboard";
import { Clients } from "./features/clients/Clients";
import { ClientDetail } from "./features/clients/ClientDetail";
import { Enquiries } from "./features/enquiries/Enquiries";
import { EnquiryDetail } from "./features/enquiries/EnquiryDetail";
import { Quotations } from "./features/quotations/Quotations";
import { QuotationDetail } from "./features/quotations/QuotationDetail";
import { QuotationFormPage } from "./features/quotations/QuotationFormPage";
import { Complaints } from "./features/complaints/Complaints";
import { ComplaintDetail } from "./features/complaints/ComplaintDetail";
import { SMRCreatePage } from "./features/complaints/SMRCreatePage";
import { ClientComplaints } from "./features/complaints/ClientComplaints";
import { AMC } from "./features/amc/AMC";
import { AMCDetail } from "./features/amc/AMCDetail";
import { AmcSMRCreatePage } from "./features/amc/AmcSMRCreatePage";
import { AmcVisitDetailPage } from "./features/amc/AmcVisitDetailPage";
import { Staff } from "./features/staff/Staff";
import { StaffDetail } from "./features/staff/StaffDetail";
import { FinanceLayout } from "./features/finance/FinanceLayout";
import { FinanceOverview } from "./features/finance/FinanceOverview";
import { FinanceCustomerInvoices } from "./features/finance/FinanceCustomerInvoices";
import { FinanceCustomerPayments } from "./features/finance/FinanceCustomerPayments";
import { FinanceOutstandingReceivables } from "./features/finance/FinanceOutstandingReceivables";
import { FinanceVendorBills } from "./features/finance/FinanceVendorBills";
import { FinanceVendorPayments } from "./features/finance/FinanceVendorPayments";
import { FinanceOutstandingPayables } from "./features/finance/FinanceOutstandingPayables";
import { FinanceExpensesList } from "./features/finance/FinanceExpensesList";
import { FinanceLedger } from "./features/finance/FinanceLedger";
import { FinanceReports } from "./features/finance/FinanceReports";
import { InvoiceFormPage } from "./features/finance/InvoiceFormPage";
import { InvoiceDetailsPage } from "./features/finance/InvoiceDetailsPage";
import { VendorBillFormPage } from "./features/finance/VendorBillFormPage";
import { Reports } from "./features/reports/Reports";
import { Schedules } from "./features/schedules/Schedules";
import { MinorJobs } from "./features/minor-jobs/MinorJobs";
import { Projects } from "./features/projects/Projects";
import { CustomerComplaints } from "./features/customer-complaints/CustomerComplaints";
import { LeaveManagement } from "./features/leave-management/LeaveManagement";
import { AuditLogs } from "./features/audit-logs/AuditLogs";
import { WarrantyManagement } from "./features/warranty/WarrantyManagement";
import { Kanban } from "./features/kanban/Kanban";
import { Login } from "./features/auth/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppRoute } from "./constants/routes.enum";
import { AdminManagement } from "./features/admin/AdminManagement";
import { NotFound } from "./components/NotFound";
import { StaffLogin } from "./features/staff-portal/StaffLogin";
import { StaffLayout } from "./features/staff-portal/StaffLayout";
import { StaffDashboard } from "./features/staff-portal/StaffDashboard";
import { StaffTasks } from "./features/staff-portal/StaffTasks";
import { StaffLeaves } from "./features/staff-portal/StaffLeaves";

export const router = createBrowserRouter([
  {
    path: AppRoute.LOGIN,
    element: <Login />,
  },
  {
    path: AppRoute.DASHBOARD,
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: AppRoute.KANBAN, element: <Kanban /> },
      { path: AppRoute.CLIENTS, element: <Clients /> },
      { path: AppRoute.CLIENT_DETAIL, element: <ClientDetail /> },
      { path: AppRoute.CLIENT_COMPLAINTS, element: <ClientComplaints /> },
      { path: AppRoute.ENQUIRIES, element: <Enquiries /> },
      { path: AppRoute.ENQUIRY_DETAIL, element: <EnquiryDetail /> },
      { path: AppRoute.QUOTATIONS, element: <Quotations /> },
      { path: AppRoute.QUOTATION_CREATE, element: <QuotationFormPage /> },
      { path: AppRoute.QUOTATION_EDIT, element: <QuotationFormPage /> },
      { path: AppRoute.QUOTATION_DETAIL, element: <QuotationDetail /> },
      { path: AppRoute.COMPLAINTS, element: <Complaints /> },
      { path: AppRoute.COMPLAINT_DETAIL, element: <ComplaintDetail /> },
      { path: AppRoute.COMPLAINT_SMR_CREATE, element: <SMRCreatePage mode="create" /> },
      { path: AppRoute.COMPLAINT_SMR_EDIT, element: <SMRCreatePage mode="edit" /> },
      { path: AppRoute.AMC, element: <AMC /> },
      { path: AppRoute.AMC_DETAIL, element: <AMCDetail /> },
      { path: AppRoute.AMC_VISIT_DETAIL, element: <AmcVisitDetailPage /> },
      { path: AppRoute.AMC_VISIT_SMR_CREATE, element: <AmcSMRCreatePage /> },
      { path: AppRoute.STAFF, element: <Staff /> },
      { path: AppRoute.STAFF_DETAIL, element: <StaffDetail /> },
      { path: AppRoute.INVOICES, element: <Navigate to={AppRoute.FINANCE} replace /> },
      {
        path: AppRoute.FINANCE,
        element: <FinanceLayout />,
        children: [
          { index: true, element: <FinanceOverview /> },
          { path: "receivables", element: <Navigate to={AppRoute.FINANCE_RECEIVABLES_INVOICES} replace /> },
          { path: "receivables/invoices", element: <FinanceCustomerInvoices /> },
          { path: "receivables/invoices/new", element: <InvoiceFormPage /> },
          { path: "receivables/invoices/:invoiceId", element: <InvoiceDetailsPage /> },
          { path: "receivables/payments", element: <FinanceCustomerPayments /> },
          { path: "receivables/outstanding", element: <FinanceOutstandingReceivables /> },
          { path: "receivables/new", element: <Navigate to={AppRoute.FINANCE_INVOICE_CREATE} replace /> },
          { path: "payables", element: <Navigate to={AppRoute.FINANCE_PAYABLES_BILLS} replace /> },
          { path: "payables/bills", element: <FinanceVendorBills /> },
          { path: "payables/bills/new", element: <VendorBillFormPage /> },
          { path: "payables/payments", element: <FinanceVendorPayments /> },
          { path: "payables/outstanding", element: <FinanceOutstandingPayables /> },
          { path: "payables/new", element: <Navigate to={AppRoute.FINANCE_VENDOR_BILL_CREATE} replace /> },
          { path: "expenses", element: <Navigate to={AppRoute.FINANCE_EXPENSES_DIRECT} replace /> },
          { path: "expenses/direct", element: <FinanceExpensesList filter="direct" /> },
          { path: "expenses/travel", element: <FinanceExpensesList filter="travel" /> },
          { path: "expenses/fuel", element: <FinanceExpensesList filter="fuel" /> },
          { path: "expenses/misc", element: <FinanceExpensesList filter="misc" /> },
          { path: "ledger", element: <FinanceLedger /> },
          { path: "reports", element: <FinanceReports /> },
        ],
      },
      { path: AppRoute.REPORTS, element: <Reports /> },
      { path: AppRoute.SCHEDULES, element: <Schedules /> },
      { path: AppRoute.MINOR_JOBS, element: <MinorJobs /> },
      { path: AppRoute.PROJECTS, element: <Projects /> },
      { path: AppRoute.CUSTOMER_COMPLAINTS, element: <CustomerComplaints /> },
      { path: AppRoute.LEAVE_MANAGEMENT, element: <LeaveManagement /> },
      { path: AppRoute.AUDIT_LOGS, element: <AuditLogs /> },
      { path: AppRoute.WARRANTY_MANAGEMENT, element: <WarrantyManagement /> },
      { path: AppRoute.ADMIN_MANAGEMENT, element: <AdminManagement /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
  {
    path: AppRoute.STAFF_LOGIN,
    element: <StaffLogin />,
  },
  {
    path: "/staff",
    element: <StaffLayout />,
    children: [
      { path: "dashboard", element: <StaffDashboard /> },
      { path: "tasks", element: <StaffTasks /> },
      { path: "leaves", element: <StaffLeaves /> },
      { path: "schedules", element: <Schedules /> },
    ],
  },
]);

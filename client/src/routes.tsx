import { createBrowserRouter } from "react-router";
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
import { Reports } from "./features/reports/Reports";
import { Schedules } from "./features/schedules/Schedules";
import { ScheduleDetail } from "./features/schedules/ScheduleDetail";
import { MinorJobs } from "./features/minor-jobs/MinorJobs";
import { MinorJobDetail } from "./features/minor-jobs/MinorJobDetail";
import { Projects } from "./features/projects/Projects";
import { ProjectDetail } from "./features/projects/ProjectDetail";
import { SubcontractDetail } from "./features/projects/SubcontractDetail";
import { PurchaseOrderDetail } from "./features/projects/PurchaseOrderDetail";
import { SubcontractsList } from "./features/projects/SubcontractsList";
import { PurchaseOrdersList } from "./features/projects/PurchaseOrdersList";
import { LeaveManagement } from "./features/leave-management/LeaveManagement";
import { AuditLogs } from "./features/audit-logs/AuditLogs";
import { WarrantyManagement } from "./features/warranty/WarrantyManagement";
import { WarrantyDetail } from "./features/warranty/WarrantyDetail";
import { Kanban } from "./features/kanban/Kanban";
import { CriticalAlertsPage } from "./features/dashboard/CriticalAlertsPage";
import { UpcomingTasksPage } from "./features/dashboard/UpcomingTasksPage";
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
import { StaffSchedules } from "./features/staff-portal/StaffSchedules";
import { PublicComplaintRegister } from "./features/public-complaints/PublicComplaintRegister";
import { ComplaintRequests } from "./features/complaints/ComplaintRequests";
import { ComplaintRequestDetail } from "./features/complaints/ComplaintRequestDetail";

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
      { path: AppRoute.REPORTS, element: <Reports /> },
      { path: AppRoute.SCHEDULES, element: <Schedules /> },
      { path: AppRoute.SCHEDULE_DETAIL, element: <ScheduleDetail /> },
      { path: AppRoute.MINOR_JOBS, element: <MinorJobs /> },
      { path: AppRoute.MINOR_JOB_DETAIL, element: <MinorJobDetail /> },
      { path: AppRoute.PROJECTS, element: <Projects /> },
      { path: AppRoute.PROJECT_DETAIL, element: <ProjectDetail /> },
      { path: AppRoute.SUBCONTRACT_DETAIL, element: <SubcontractDetail /> },
      { path: AppRoute.PO_DETAIL, element: <PurchaseOrderDetail /> },
      { path: AppRoute.SUBCONTRACTS, element: <SubcontractsList /> },
      { path: AppRoute.PURCHASE_ORDERS, element: <PurchaseOrdersList /> },
      { path: AppRoute.CUSTOMER_COMPLAINTS, element: <ComplaintRequests /> },
      { path: `${AppRoute.CUSTOMER_COMPLAINTS}/:id`, element: <ComplaintRequestDetail /> },
      { path: AppRoute.LEAVE_MANAGEMENT, element: <LeaveManagement /> },
      { path: AppRoute.AUDIT_LOGS, element: <AuditLogs /> },
      { path: AppRoute.WARRANTY_MANAGEMENT, element: <WarrantyManagement /> },
      { path: AppRoute.WARRANTY_DETAIL, element: <WarrantyDetail /> },
      { path: AppRoute.ADMIN_MANAGEMENT, element: <AdminManagement /> },
      { path: AppRoute.CRITICAL_ALERTS, element: <CriticalAlertsPage /> },
      { path: AppRoute.UPCOMING_TASKS, element: <UpcomingTasksPage /> },
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
    path: AppRoute.PUBLIC_COMPLAINT_REGISTER,
    element: <PublicComplaintRegister />,
  },
  {
    path: "/staff",
    element: <StaffLayout />,
    children: [
      { path: "dashboard", element: <StaffDashboard /> },
      { path: "tasks", element: <StaffTasks /> },
      { path: "leaves", element: <StaffLeaves /> },
      { path: "schedules", element: <StaffSchedules /> },
    ],
  },
]);

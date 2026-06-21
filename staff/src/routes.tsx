import { createHashRouter, Navigate } from "react-router";
import { StaffLogin } from "./features/staff-portal/StaffLogin";
import { StaffLayout } from "./features/staff-portal/StaffLayout";
import { StaffDashboard } from "./features/staff-portal/StaffDashboard";
import { StaffTasks } from "./features/staff-portal/StaffTasks";
import { StaffLeaves } from "./features/staff-portal/StaffLeaves";
import { StaffSchedules } from "./features/staff-portal/StaffSchedules";
import { NotFound } from "./components/NotFound";
import { AppRoute } from "./constants/routes.enum";

export const router = createHashRouter([
  {
    path: AppRoute.LOGIN,
    element: <StaffLogin />,
  },
  {
    path: "/",
    element: <StaffLayout />,
    children: [
      { index: true, element: <Navigate to={AppRoute.DASHBOARD} replace /> },
      { path: AppRoute.DASHBOARD, element: <StaffDashboard /> },
      { path: AppRoute.TASKS, element: <StaffTasks /> },
      { path: AppRoute.LEAVES, element: <StaffLeaves /> },
      { path: AppRoute.SCHEDULES, element: <StaffSchedules /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

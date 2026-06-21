import { createBrowserRouter, Navigate } from "react-router";
import { StaffLogin } from "./features/staff-portal/StaffLogin";
import { StaffLayout } from "./features/staff-portal/StaffLayout";
import { StaffDashboard } from "./features/staff-portal/StaffDashboard";
import { StaffTasks } from "./features/staff-portal/StaffTasks";
import { StaffLeaves } from "./features/staff-portal/StaffLeaves";
import { StaffSchedules } from "./features/staff-portal/StaffSchedules";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <StaffLogin />,
  },
  {
    path: "/",
    element: <StaffLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <StaffDashboard /> },
      { path: "tasks", element: <StaffTasks /> },
      { path: "leaves", element: <StaffLeaves /> },
      { path: "schedules", element: <StaffSchedules /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

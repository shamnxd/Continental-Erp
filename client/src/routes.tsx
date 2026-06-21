import { createBrowserRouter } from "react-router";
import { PublicComplaintRegister } from "./features/public-complaints/PublicComplaintRegister";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicComplaintRegister />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

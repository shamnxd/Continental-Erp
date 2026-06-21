import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Provider } from "react-redux";
import { store } from "./store";
import { useAppDispatch } from "./store/hooks";
import { restoreStaffSession } from "./store/slices/staffAuthSlice";
import { Toaster } from "./components/ui/sonner";

function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreStaffSession());
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
      <Toaster />
    </Provider>
  );
}
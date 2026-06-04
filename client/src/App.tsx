import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Provider } from "react-redux";
import { store } from "./store";
import { useAppDispatch } from "./store/hooks";
import { restoreSession } from "./store/slices/authSlice";
import { restoreStaffSession } from "./store/slices/staffAuthSlice";

function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (window.location.pathname.startsWith("/staff")) {
      dispatch(restoreStaffSession());
    } else {
      dispatch(restoreSession());
    }
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
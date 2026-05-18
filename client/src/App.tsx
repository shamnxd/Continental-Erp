import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Provider } from "react-redux";
import { store } from "./store";
import { useAppDispatch } from "./store/hooks";
import { restoreSession } from "./store/slices/authSlice";

function AppContent() {
  const dispatch = useAppDispatch();

  // Perform a silent, secure auto-login restore check immediately on portal boot
  useEffect(() => {
    dispatch(restoreSession());
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
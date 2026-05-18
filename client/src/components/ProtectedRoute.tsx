import { Navigate } from "react-router";
import { useAppSelector } from "../store/hooks";
import { AppRoute } from "../constants/routes.enum";
import { LoadingScreen } from "./LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to={AppRoute.LOGIN} replace />;
  }

  return <>{children}</>;
}

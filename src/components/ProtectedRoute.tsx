import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthProvider";

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg-base">
        <p className="text-sm text-text-muted">Checking sign-in…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

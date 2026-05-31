import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "./ui/spinner";

export default function ProtectedRoute() {
  // ===== AUTH STATE =====
  const { isLoading, isAuthenticated } = useAuth();

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  // ===== UNAUTHENTICATED REDIRECT =====
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ===== AUTHENTICATED OUTLET =====
  return <Outlet />;
}

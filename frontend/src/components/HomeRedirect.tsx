import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "./ui/spinner";

export default function HomeRedirect() {
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

  // ===== REDIRECT =====
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "./ui/spinner";

export default function HomeRedirect() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

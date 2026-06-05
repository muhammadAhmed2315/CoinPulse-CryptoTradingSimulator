import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "./ui/spinner";

export default function ProtectedRoute() {
  // ===== AUTH STATE =====
  const { isLoading, isAuthenticated, user } = useAuth();

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

  // ===== INCOMPLETE SIGNUP REDIRECT =====
  // OAuth users are authenticated before they pick a username. They already have
  // a wallet (created at signup), but the app pages expect a username, so send
  // them to finish signup first. PickUsername bounces them back once it's set.
  if (!user?.username) {
    return <Navigate to="/pick_username" replace />;
  }

  // ===== AUTHENTICATED OUTLET =====
  return <Outlet />;
}

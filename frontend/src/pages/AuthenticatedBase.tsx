import NavBar from "@/components/NavBar";
import { Outlet } from "react-router-dom";

export default function AuthenticatedBase() {
  return (
    <div>
      <NavBar />
      <div className="pl-12 pr-12 pt-6 pb-6">
        <Outlet />
      </div>
    </div>
  );
}

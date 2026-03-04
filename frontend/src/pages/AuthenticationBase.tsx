import Ripple from "@/components/authentication/Ripple";
import { Outlet } from "react-router-dom";

export default function AuthenticationBase() {
  return (
    <Ripple>
      <Outlet />
    </Ripple>
  );
}

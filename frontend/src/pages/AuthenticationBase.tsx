import Ripple from "@/components/Ripple";

import Login from "@/components/Login";
import Register from "@/components/Register";
import RequestPasswordReset from "@/components/RequestPasswordReset";
import ResetPassword from "@/components/ResetPassword";

export default function AuthenticationBase() {
  return (
    <Ripple>
      <Login />
    </Ripple>
  );
}

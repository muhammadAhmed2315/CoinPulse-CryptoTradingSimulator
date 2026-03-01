import Ripple from "@/components/Ripple";

import Login from "@/components/Login";
import Register from "@/components/Register";
import ForgotPassword from "@/components/ForgotPassword";

export default function AuthenticationBase() {
  return (
    <Ripple>
      <ForgotPassword />
    </Ripple>
  );
}

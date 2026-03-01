import Ripple from "@/components/authentication/Ripple";

import Login from "@/components/authentication/Login";
import Register from "@/components/authentication/Register";
import RequestPasswordReset from "@/components/authentication/RequestPasswordReset";
import ResetPassword from "@/components/authentication/ResetPassword";
import InvalidResetLinkPage from "@/components/authentication/InvalidResetLinkPage";
import NavBar from "@/components/NavBar";

export default function AuthenticationBase() {
  return (
    // <Ripple>
    <>
      <NavBar />
      <h1>Remaining page component</h1>
    </>
    // </Ripple>
  );
}

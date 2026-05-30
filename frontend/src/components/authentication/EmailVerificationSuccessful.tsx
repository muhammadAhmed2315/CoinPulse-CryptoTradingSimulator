import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import TickIcon from "@/assets/icons/tick.svg";
import { Separator } from "../ui/separator";
import DotGreen from "@/assets/dot-green.svg";
import { useLocation, useNavigate } from "react-router-dom";

export default function EmailVerificationSuccessful() {
  const navigate = useNavigate();
  const email = useLocation().state?.email;

  // Redirect if page was accessed directly without the required state (e.g. bookmark, refresh)
  if (!email) {
    navigate("/login", { replace: true });
    return null;
  }

  // ===== EVENT HANDLERS =====
  function handleLogin() {
    // TODO: This should go straight to the dashboard, you'll have to update the
    //      "/verify_email" endpoint so that it returns an authentication token and you
    //      can instantly log the user in
    navigate("/login", { state: { prefillEmail: email } });
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* ===== ICON ===== */}
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={TickIcon} className="size-7 invert" />
        </div>

        {/* ===== HEADER ===== */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">ALL DONE</p>
        <p className="text-xl font-bold tracking-tight">
          Email Verification Successful
        </p>
        <Separator />

        {/* ===== STATUS BADGE ===== */}
        <div className="flex items-center gap-2">
          <img src={DotGreen} className="size-2" />
          <p className="font-bold text-green-600">Verified</p>
        </div>

        {/* ===== MESSAGE ===== */}
        <p className="text-center text-sm text-muted-foreground">
          Your email adress <b>{email}</b> has been successfully verified.
        </p>

        <p className="text-sm text-muted-foreground">You can now access your account.</p>

        {/* ===== LOGIN BUTTON ===== */}
        <RippleButton className="w-full cursor-pointer" onClick={handleLogin}>
          Log in
          <RippleButtonRipples />
        </RippleButton>
      </div>
    </Card>
  );
}

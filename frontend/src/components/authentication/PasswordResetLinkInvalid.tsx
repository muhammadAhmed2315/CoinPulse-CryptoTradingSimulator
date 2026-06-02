import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import WarningIcon from "@/assets/icons/warning.svg";
import { Separator } from "../ui/separator";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function PasswordResetLinkInvalid() {
  useDocumentTitle("Invalid Reset Link | CoinPulse");

  const navigate = useNavigate();

  // ===== EVENT HANDLERS =====
  function handleBackToLogin() {
    navigate("/login");
  }

  function handleResendEmail() {
    navigate("/request_password_reset");
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* ===== ICON ===== */}
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={WarningIcon} className="size-7 invert" />
        </div>

        {/* ===== HEADER ===== */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">PASSWORD RESET LINK INVALID</p>
        <p className="text-xl font-bold tracking-tight">This link can't be used</p>
        <Separator />

        {/* ===== MESSAGE ===== */}
        <p className="text-center text-sm text-muted-foreground">
          This password reset link is{" "}
          <b>invalid, has expired, or has already been used</b>. Reset links are
          only valid for 24 hours and can only be used once.
        </p>

        {/* ===== BUTTONS ===== */}
        <div className="flex flex-col gap-2.5 w-full">
          <RippleButton
            className="w-full cursor-pointer"
            onClick={handleResendEmail}
          >
            Request a new reset link
            <RippleButtonRipples />
          </RippleButton>
          <RippleButton
            className="w-full cursor-pointer"
            variant="outline"
            onClick={handleBackToLogin}
          >
            ← Back to login
            <RippleButtonRipples />
          </RippleButton>
        </div>
      </div>
    </Card>
  );
}

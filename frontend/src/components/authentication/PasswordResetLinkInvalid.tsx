import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import WarningIcon from "@/assets/icons/warning.svg";
import { Separator } from "../ui/separator";
import { useNavigate } from "react-router-dom";

export default function PasswordResetLinkInvalid() {
  const navigate = useNavigate();

  function handleBackToLogin() {
    navigate("/login");
  }

  function handleResendEmail() {
    navigate("/request_password_reset");
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={WarningIcon} className="size-7 invert" />
        </div>

        <p>PASSWORD RESET LINK INVALID</p>
        <p className="text-[22px] font-extrabold">This link can't be used</p>
        <Separator />

        <p className="text-center text-sm">
          This password reset link is{" "}
          <b>invalid, has expired, or has already been used</b>. Reset links are
          only valid for 24 hours and can only be used once.
        </p>

        <RippleButton
          className="w-full cursor-pointer"
          onClick={handleResendEmail}
        >
          Request a New Reset Link
          <RippleButtonRipples />
        </RippleButton>
        <div className="flex">
          <a
            className="inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
            onClick={handleBackToLogin}
          >
            ← Back to login
          </a>
        </div>
      </div>
    </Card>
  );
}

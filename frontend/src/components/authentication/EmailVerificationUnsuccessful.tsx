import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import WarningIcon from "@/assets/icons/warning.svg";
import { Separator } from "../ui/separator";
import DotRed from "@/assets/dot-red.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

async function resendEmail(token: string) {
  const response = await fetch(
    "http://127.0.0.1:5000/retry_verification_from_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(token),
      credentials: "include",
    },
  );

  const foo = await response.json();
  console.log(foo);

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function EmailVerificationUnsuccessful() {
  const navigate = useNavigate();
  const token = useLocation().state?.token;

  const mutation = useMutation({
    mutationFn: () => {
      return resendEmail(token);
    },

    onSuccess: () => {},

    onError: () => {
      navigate("/email_verification_form");
    },
  });

  function handleBackToLogin() {
    navigate("/login");
  }

  function handleResendEmail() {
    mutation.mutate();
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={WarningIcon} className="size-7 invert" />
        </div>

        <p>VERIFICATION FAILED</p>
        <p className="text-[22px] font-extrabold">
          Email could not be verified
        </p>
        <Separator />

        <div className="flex items-center gap-2 mt-2">
          <img src={DotRed} className="size-2" />
          <p className="font-bold text-[#ef4444]">Not verified</p>
        </div>

        <p className="text-center text-sm">
          This verification link is <b>invalid or has expired.</b> Verification
          links are only valid for 1 hour after they are sent.
        </p>

        <RippleButton
          className="w-full cursor-pointer"
          onClick={handleResendEmail}
        >
          Resend verification email
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

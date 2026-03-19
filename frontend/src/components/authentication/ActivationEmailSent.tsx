import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import MailIcon from "@/assets/icons/mail.svg";
import { Separator } from "../ui/separator";
import DotGreen from "@/assets/dot-green.svg";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";

async function resendActivationEmail(data: { email: string }) {
  const response = await fetch(
    "http://127.0.0.1:5000/retry_verification_from_email",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function ActivationEmailSent() {
  const navigate = useNavigate();
  const email = useLocation().state?.email;
  const canResend = useLocation().state?.canResend ?? true;

  const resendActivationEmailMutation = useMutation({
    mutationFn: () => {
      return resendActivationEmail(email);
    },

    // TODO: Keep this?
    // onSuccess: () => {
    // navigate("/login");
    // },
  });

  function handleResendEmail() {
    resendActivationEmailMutation.mutate(email);
  }

  function handleBackToLogin() {
    navigate("/login");
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={MailIcon} className="size-7 invert" />
        </div>

        <p>ONE MORE STEP</p>
        <p className="text-[22px] font-extrabold">Verify your email address</p>
        <Separator />

        <p>We've sent a verification link to</p>

        <div className="flex items-center gap-2">
          <img src={DotGreen} className="size-2" />
          <p className="font-bold">{email}</p>
        </div>

        <p>
          Click the link in your inbox to complete sign-up. Check your{" "}
          <b>spam folder</b> if you don't see it.
        </p>

        {canResend && (
          <RippleButton
            className="w-full cursor-pointer"
            onClick={handleResendEmail}
          >
            {resendActivationEmailMutation.isPending ? (
              <Spinner />
            ) : (
              <>Resend verification email</>
            )}
            <RippleButtonRipples />
          </RippleButton>
        )}

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

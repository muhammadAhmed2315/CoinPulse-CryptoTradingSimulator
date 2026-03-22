import { Card } from "@/components/ui/card";
import TickIcon from "@/assets/icons/tick.svg";
import { Separator } from "../ui/separator";
import { useLocation, useNavigate } from "react-router-dom";
import {
  RippleButton,
  RippleButtonRipples,
} from "../animate-ui/components/buttons/ripple";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";
import { formatTime } from "@/utils";

// TODO:
// - Clicking contact support should open an email client

async function sendPasswordResetEmail(
  email: string,
): Promise<{ error: string } | { success: string }> {
  const response = await fetch("http://localhost:5000/request_password_reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export default function PasswordResetLinkSent() {
  const navigate = useNavigate();
  const email = useLocation().state?.email;
  const [timer, setTimer] = useState(0);

  // Redirect if page was accessed directly without the required state (e.g. bookmark, refresh)
  if (!email) {
    navigate("/request_password_reset", { replace: true });
    return null;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (timer === 0) return;

    const id = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mutation = useMutation({
    mutationFn: () => {
      return sendPasswordResetEmail(email);
    },

    onSuccess: () => {
      setTimer(33);
    },

    onError: () => {
      setTimer(33);
    },
  });

  function handleResendEmail() {
    mutation.mutate();
  }

  function handleBackToLogin() {
    navigate("/login");
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={TickIcon} className="size-7 invert" />
        </div>

        <p className="text-[22px] font-extrabold">Check your inbox</p>

        <p>
          If there's an account associated with <b>{email}</b>, you'll receive a
          link to reset your password shortly. Be sure to check your spam folder
          too.
        </p>

        <p>This link will expire in 1 hour.</p>

        <Separator />

        <div className="flex flex-col items-center">
          <RippleButton
            className="w-full cursor-pointer"
            variant="outline"
            onClick={handleResendEmail}
            disabled={timer > 0}
          >
            {mutation.isPending ? (
              <Spinner />
            ) : mutation.isError && timer > 30 ? (
              <>Failed to send</>
            ) : timer > 30 ? (
              <>Email sent!</>
            ) : timer !== 0 ? (
              <>Resend in {formatTime(timer)}</>
            ) : (
              <>Resend email</>
            )}
            <RippleButtonRipples />
          </RippleButton>

          <a
            className="inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
            onClick={handleBackToLogin}
          >
            ← Back to login
          </a>
          <div className="text-sm">
            <span>Need help? </span>
            <span className="hover:underline cursor-pointer">
              Contact support
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

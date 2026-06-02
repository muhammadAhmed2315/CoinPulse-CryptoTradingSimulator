import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import MailIcon from "@/assets/icons/mail.svg";
import { Separator } from "../ui/separator";
import DotGreen from "@/assets/dot-green.svg";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";
import { useEffect, useState } from "react";
import { formatTime } from "@/utils";
import { API_BASE } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/use-document-title";

// ===== API FUNCTIONS =====
async function resendActivationEmail(email: string) {
  const response = await fetch(
    `${API_BASE}/retry_verification_from_email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function ActivationEmailSent() {
  useDocumentTitle("Check Your Email | CoinPulse");

  // ===== STATE VARIABLES =====
  const navigate = useNavigate();
  const email = useLocation().state?.email;
  const canResend = useLocation().state?.canResend ?? true;
  const [timer, setTimer] = useState(0);

  // ===== EFFECTS =====
  useEffect(() => {
    if (timer === 0) return;
    const id = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  // ===== REACT QUERY HOOKS =====
  const resendActivationEmailMutation = useMutation({
    mutationFn: () => {
      return resendActivationEmail(email);
    },

    onSuccess: () => {
      setTimer(33);
    },

    onError: () => {
      setTimer(33);
    },
  });

  // Redirect if page was accessed directly without the required state (e.g. bookmark, refresh)
  if (!email) {
    return <Navigate to="/login" replace />;
  }

  // ===== EVENT HANDLERS =====
  function handleResendEmail() {
    resendActivationEmailMutation.mutate();
  }

  function handleBackToLogin() {
    navigate("/login");
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* ===== ICON ===== */}
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={MailIcon} className="size-7 invert" />
        </div>

        {/* ===== HEADER ===== */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">ONE MORE STEP</p>
        <p className="text-xl font-bold tracking-tight">Verify your email address</p>
        <Separator />

        {/* ===== EMAIL CALLOUT ===== */}
        <p className="text-sm text-muted-foreground">We've sent a verification link to</p>

        <div className="flex items-center gap-2">
          <img src={DotGreen} className="size-2" />
          <p className="font-bold">{email}</p>
        </div>

        {/* ===== INSTRUCTIONS ===== */}
        <p className="text-sm text-muted-foreground">
          Click the link in your inbox to complete sign-up. Check your{" "}
          <b>spam folder</b> if you don't see it.
        </p>

        {/* ===== BUTTONS ===== */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* ===== RESEND BUTTON ===== */}
          {canResend && (
            <RippleButton
              className="w-full cursor-pointer"
              onClick={handleResendEmail}
              disabled={timer > 0}
            >
              {resendActivationEmailMutation.isPending ? (
                <Spinner />
              ) : resendActivationEmailMutation.isError && timer > 30 ? (
                <>Failed to send</>
              ) : timer > 30 ? (
                <>Email sent!</>
              ) : timer !== 0 ? (
                <>Resend in {formatTime(timer)}</>
              ) : (
                <>Resend verification email</>
              )}
              <RippleButtonRipples />
            </RippleButton>
          )}

          {/* ===== BACK BUTTON ===== */}
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

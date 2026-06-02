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
import { useEffect, useState } from "react";
import { Spinner } from "../ui/spinner";
import { formatTime } from "@/utils";
import { API_BASE } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/use-document-title";

// ===== API FUNCTIONS =====
async function resendEmail(token: string) {
  const response = await fetch(
    `${API_BASE}/retry_verification_from_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token }),
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function EmailVerificationUnsuccessful() {
  useDocumentTitle("Verification Failed | CoinPulse");

  // ===== STATE VARIABLES =====
  const navigate = useNavigate();
  const token = useLocation().state?.token;
  const [timer, setTimer] = useState(0);

  // ===== EFFECTS =====
  useEffect(() => {
    if (timer === 0) return;
    const id = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  // ===== REACT QUERY HOOKS =====
  const mutation = useMutation({
    mutationFn: () => {
      return resendEmail(token);
    },

    onSuccess: () => {
      setTimer(33);
    },

    onError: () => {
      navigate("/email_verification_form");
    },
  });

  // Redirect if page was accessed directly without the required state (e.g. bookmark, refresh)
  if (!token) {
    navigate("/email_verification_form", { replace: true });
    return null;
  }

  // ===== EVENT HANDLERS =====
  function handleBackToLogin() {
    navigate("/login");
  }

  function handleResendEmail() {
    mutation.mutate();
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* ===== ICON ===== */}
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={WarningIcon} className="size-7 invert" />
        </div>

        {/* ===== HEADER ===== */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">VERIFICATION FAILED</p>
        <p className="text-xl font-bold tracking-tight">
          Email could not be verified
        </p>
        <Separator />

        {/* ===== STATUS BADGE ===== */}
        <div className="flex items-center gap-2">
          <img src={DotRed} className="size-2" />
          <p className="font-bold text-red-600">Not verified</p>
        </div>

        {/* ===== MESSAGE ===== */}
        <p className="text-center text-sm text-muted-foreground">
          This verification link is <b>invalid or has expired.</b> Verification
          links are only valid for 1 hour after they are sent.
        </p>

        <div className="flex flex-col gap-2.5 w-full">
          {/* ===== RESEND BUTTON ===== */}
          <RippleButton
            className="w-full cursor-pointer"
            onClick={handleResendEmail}
            disabled={timer > 0}
          >
            {mutation.isPending ? (
              <Spinner />
            ) : timer > 30 ? (
              <>Email sent!</>
            ) : timer !== 0 ? (
              <>Resend in {formatTime(timer)}</>
            ) : (
              <>Resend verification email</>
            )}
            <RippleButtonRipples />
          </RippleButton>
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

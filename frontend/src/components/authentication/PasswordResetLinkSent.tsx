import { Card } from "@/components/ui/card";
import TickIcon from "@/assets/icons/tick.svg";
import { Separator } from "../ui/separator";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  RippleButton,
  RippleButtonRipples,
} from "../animate-ui/components/buttons/ripple";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";
import { formatTime } from "@/utils";
import { API_BASE } from "@/lib/api";

// TODO:
// - Clicking contact support should open an email client

// ===== API FUNCTIONS =====
async function sendPasswordResetEmail(
  email: string,
): Promise<{ error: string } | { success: string }> {
  const response = await fetch(`${API_BASE}/request_password_reset`, {
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
  // ===== STATE VARIABLES =====
  const navigate = useNavigate();
  const email = useLocation().state?.email;
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
      return sendPasswordResetEmail(email);
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
    return <Navigate to="/request_password_reset" replace />;
  }

  // ===== EVENT HANDLERS =====
  function handleResendEmail() {
    mutation.mutate();
  }

  function handleBackToLogin() {
    navigate("/login");
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* ===== ICON ===== */}
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={TickIcon} className="size-7 invert" />
        </div>

        {/* ===== HEADER ===== */}
        <p className="text-xl font-bold tracking-tight">Check your inbox</p>

        {/* ===== MESSAGE ===== */}
        <p className="text-sm text-muted-foreground">
          If there's an account associated with <b>{email}</b>, you'll receive a
          link to reset your password shortly. Be sure to check your spam folder
          too.
        </p>

        <p className="text-sm text-muted-foreground">This link will expire in 1 hour.</p>

        <Separator className="my-1" />

        {/* ===== FOOTER ===== */}
        <div className="flex flex-col items-center w-[75%] gap-2.5">
          {/* ===== RESEND BUTTON ===== */}
          <RippleButton
            className="w-full cursor-pointer"
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
          {/* ===== BACK BUTTON ===== */}
          <RippleButton
            className="w-full cursor-pointer"
            variant="outline"
            onClick={handleBackToLogin}
          >
            ← Back to login
            <RippleButtonRipples />
          </RippleButton>
          {/* ===== SUPPORT LINK ===== */}
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

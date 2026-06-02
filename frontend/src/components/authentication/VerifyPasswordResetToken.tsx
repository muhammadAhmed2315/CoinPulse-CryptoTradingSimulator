import { useParams } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import LoadingSpinner from "../LoadingSpinner";
import { useEffect, useRef } from "react";
import { API_BASE } from "@/lib/api";

// ===== API FUNCTIONS =====
async function sendVerificationRequest(token: string) {
  const response = await fetch(
    `${API_BASE}/verify_password_reset_token/${token}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function VerifyPasswordResetToken() {
  // ===== STATE VARIABLES =====
  const { token = "" } = useParams();
  const navigate = useNavigate();

  // ===== REACT QUERY HOOKS =====
  const mutation = useMutation({
    mutationFn: () => {
      return sendVerificationRequest(token);
    },

    onSuccess: (data) => {
      navigate("/reset_password", {
        state: { email: data.email, token: token },
      });
    },

    onError: () => {
      navigate("/password_reset_link_invalid");
    },
  });

  // ===== EFFECTS =====
  const hasFired = useRef(false);
  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-100 p-9">
      {/* ===== LOADING STATE ===== */}
      <div className="flex flex-col items-center">
        <LoadingSpinner />
        <p className="text-xs mt-4 font-semibold uppercase tracking-widest text-muted-foreground">PLEASE WAIT</p>
        <b className="text-xl font-bold tracking-tight text-foreground">Verifying your email</b>
        <p className="text-sm text-muted-foreground/80">
          You'll be redirected automatically
        </p>
      </div>
    </Card>
  );
}

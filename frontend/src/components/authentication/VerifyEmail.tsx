import { useParams } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import LoadingSpinner from "../LoadingSpinner";
import { useEffect, useRef } from "react";

async function sendVerificationRequest(token: string) {
  const response = await fetch(`http://127.0.0.1:5000/verify_email/${token}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function VerifyEmail() {
  const { token = "" } = useParams();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => {
      return sendVerificationRequest(token);
    },

    onSuccess: (data) => {
      navigate("/email_verification_successful", {
        state: { email: data.email },
      });
      // navigate("/login");
    },

    onError: () => {
      navigate("/email_verification_unsuccessful", { state: { token: token } });
    },
  });

  const hasFired = useRef(false);
  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <LoadingSpinner />
        <p className="text-xs mt-4 text-[#bbb]">PLEASE WAIT</p>
        <b className="text-xl text-[#0a0a0a]">Verifying your email</b>
        <p className="text-sm text-[#aaa]">
          You'll be redirected automatically
        </p>
      </div>
    </Card>
  );
}

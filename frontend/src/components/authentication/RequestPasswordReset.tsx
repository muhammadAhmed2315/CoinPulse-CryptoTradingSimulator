import { useState, type ChangeEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AlertCircleIcon } from "lucide-react";
import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { validateEmail } from "@/utils";
import { API_BASE } from "@/lib/api";

// TODO:
// - Add comments

// ===== API FUNCTIONS =====
async function sendPasswordResetEmail(
  email: string,
): Promise<{ error: string } | { success: string }> {
  const response = await fetch(`${API_BASE}/request_password_reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email }),
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function RequestPasswordReset() {
  // ===== STATE VARIABLES =====
  const [email, setEmail] = useState(useLocation().state?.email);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const navigate = useNavigate();

  // ===== REACT QUERY HOOKS =====
  const sendResetEmailMutation = useMutation({
    mutationFn: () => sendPasswordResetEmail(email),
  });

  // ===== EVENT HANDLERS =====
  function handleEmailInput(e: ChangeEvent<HTMLInputElement>): void {
    setEmail(e.target.value);
  }

  function handleBackToLogin() {
    navigate("/login");
  }

  function handleSendEmailClick(e?: React.FormEvent) {
    e?.preventDefault();
    if (validateEmail(email)) {
      sendResetEmailMutation.mutate(undefined, {
        onSuccess: () => {
          navigate("/password_reset_link_sent", { state: { email: email } });
        },
      });
    } else {
      setInvalidEmail(true);
    }
  }

  return (
    <Card className="w-96">
      {/* ===== HEADER ===== */}
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold tracking-tight">Reset your password</CardTitle>
        <CardDescription>
          Enter the email address associated your account and we'll send a link
          to reset your password.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSendEmailClick} className="flex flex-col gap-6">
      <CardContent className="flex flex-col gap-4">
        {/* ===== EMAIL FIELD ===== */}
        <Field>
          <FieldLabel htmlFor="input-email">Email</FieldLabel>
          <Input
            id="input-email"
            type="email"
            placeholder="john.doe@gmail.com"
            value={email}
            onChange={handleEmailInput}
          />
        </Field>
        {/* ===== ERROR ALERTS ===== */}
        {invalidEmail && (
          <Alert className="max-w-md border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
            <AlertCircleIcon className="text-red-600 dark:text-red-400" />
            <AlertTitle>Invalid email address</AlertTitle>
            <AlertDescription>
              Please enter a valid email address (e.g., john.doe@gmail.com)
            </AlertDescription>
          </Alert>
        )}
        {sendResetEmailMutation.isError && (
          <Alert className="max-w-md border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
            <AlertCircleIcon className="text-red-600 dark:text-red-400" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>Please try again later.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2.5">
        {/* ===== SEND BUTTON ===== */}
        <RippleButton
          className="w-full cursor-pointer"
          type="submit"
        >
          {sendResetEmailMutation.isPending ? (
            <Spinner />
          ) : (
            <>Send reset email</>
          )}
          <RippleButtonRipples />
        </RippleButton>
        {/* ===== BACK BUTTON ===== */}
        <RippleButton
          className="w-full cursor-pointer"
          variant="outline"
          type="button"
          onClick={handleBackToLogin}
        >
          ← Back to login
          <RippleButtonRipples />
        </RippleButton>
      </CardFooter>
      </form>
    </Card>
  );
}

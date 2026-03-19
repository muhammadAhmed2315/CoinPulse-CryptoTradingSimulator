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

// TODO:
// - Add comments

async function sendPasswordResetEmail(
  email: string,
): Promise<{ error: string } | { success: string }> {
  const response = await fetch("http://127.0.0.1:5000/request_password_reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export default function RequestPasswordReset() {
  const [email, setEmail] = useState(
    useLocation().state?.email || "muhahmed3758@gmail.com",
  );
  const [invalidEmail, setInvalidEmail] = useState(false);
  const navigate = useNavigate();

  const sendResetEmailMutation = useMutation({
    mutationFn: () => sendPasswordResetEmail(email),
  });

  function handleEmailInput(e: ChangeEvent<HTMLInputElement>): void {
    setEmail(e.target.value);
  }

  function handleBackToLogin() {
    navigate("/login");
  }

  function handleSendEmailClick() {
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
      <CardHeader className="text-center">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter the email address associated your account and we'll send a link
          to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
        {invalidEmail && (
          <>
            <br />
            <Alert variant="destructive" className="max-w-md">
              <AlertCircleIcon />
              <AlertTitle>Invalid email address</AlertTitle>
              <AlertDescription>
                Please enter a valid email address (e.g., john.doe@gmail.com)
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2.5">
        <RippleButton
          className="w-full cursor-pointer"
          variant="outline"
          onClick={handleSendEmailClick}
        >
          {sendResetEmailMutation.isPending ? (
            <Spinner />
          ) : (
            <>Send reset email</>
          )}
          <RippleButtonRipples />
        </RippleButton>
        <div className="flex items-center">
          <p
            className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
            onClick={handleBackToLogin}
          >
            ← Back to login
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

import { useEffect, useState, type ChangeEvent } from "react";

import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
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
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { validatePassword } from "@/utils";
import NewPassword from "./NewPassword";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { Spinner } from "../ui/spinner";

// TODO: - Have a quick "✓ Password updated, go sign in" for 2-3 seconds and then
//         re-direct to the sign in page
//       - Update the "You won't be able to reuse your previous password." copy since
//         that's not true.

async function resetPassword(data: {
  email: string;
  password: string;
  confirmPassword: string;
  token: string;
}) {
  const response = await fetch("http://localhost:5000/reset_password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<[string, string]>(["", ""]);
  const [successTimer, setSuccessTimer] = useState(0);
  const email = useLocation().state?.email;
  const token = useLocation().state?.token;
  const navigate = useNavigate();

  // Redirect if page was accessed directly without the required state (e.g. bookmark, refresh)
  useEffect(() => {
    if (!email || !token)
      navigate("/request_password_reset", { replace: true });
  }, [email, navigate, token]);

  useEffect(() => {
    if (successTimer === 0) return;

    if (successTimer === 1) {
      const id = setTimeout(() => {
        setSuccessTimer(0);
        navigate("/login", { state: { prefillEmail: email } });
      }, 1000);
      return () => clearTimeout(id);
    }

    const id = setTimeout(() => setSuccessTimer((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [email, navigate, successTimer]);

  const resetPasswordMutation = useMutation({
    mutationFn: () => {
      return resetPassword({
        email: email,
        password: password,
        confirmPassword: confirmPassword,
        token: token,
      });
    },

    onSuccess: () => {
      setSuccessTimer(4);
    },

    onError: (err: { error: string; description: string }) => {
      if (err.error === "Invalid token")
        navigate("/password_reset_link_invalid");
      setError([err.error, err.description]);
    },
  });

  function handleSubmit() {
    const errors = validatePassword(password);
    if (errors.length !== 0) {
      setError([
        "Invalid password format",
        "Please check the password requirements and try again",
      ]);
    } else if (password !== confirmPassword) {
      setError([
        "Passwords do not match",
        "Please make sure both passwords are identical",
      ]);
    } else {
      resetPasswordMutation.mutate();
    }
  }

  return (
    <Card className="w-96">
      <CardHeader className="text-center">
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>
          Choose something strong. You won't be able to reuse your previous
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NewPassword password={password} setPassword={setPassword} />
        <br />
        <Field>
          <FieldLabel htmlFor="input-confirm-password">
            Confirm password
          </FieldLabel>
          <Input
            id="input-confirm-password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        {error.at(0) !== "" && error.at(1) !== "" && (
          <>
            <br />
            <Alert className="max-w-md border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
              <AlertCircle className="text-red-600 dark:text-red-400" />
              <AlertTitle>{error.at(0)}</AlertTitle>
              <AlertDescription>{error.at(1)}</AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2.5">
        <RippleButton
          className="w-full cursor-pointer"
          variant="outline"
          onClick={handleSubmit}
          disabled={successTimer > 0}
        >
          {resetPasswordMutation.isPending ? (
            <Spinner />
          ) : successTimer > 2 ? (
            "✓ Password successfully updated"
          ) : successTimer > 0 ? (
            "Taking you back to log in..."
          ) : (
            "Set new password"
          )}
          <RippleButtonRipples />
        </RippleButton>
        <div
          className="flex items-center"
          onClick={() => navigate("/login", { state: { prefillEmail: email } })}
        >
          <p className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer">
            ← Back to login
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

import { useState, type ChangeEvent } from "react";

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
import { useLocation } from "react-router-dom";

// TODO: - Have a quick "✓ Password updated, go sign in" for 2-3 seconds and then
//         re-direct to the sign in page
//       - Update the "You won't be able to reuse your previous password." copy since
//         that's not true.

async function resetPassword(data: {
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const response = await fetch("http://127.0.0.1:5000/reset_password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  console.log(response);

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function ResetPassword() {
  const [password, setPassword] = useState("Password12/");
  const [confirmPassword, setConfirmPassword] = useState("Password12/");
  const email = useLocation().state?.email;

  const resetPasswordMutation = useMutation({
    mutationFn: () => {
      return resetPassword({
        email: email,
        password: password,
        confirmPassword: confirmPassword,
      });
    },

    onSuccess: () => {
      console.log("PASSWORD SUCCESSFULLY UPDATED");
    },

    onError: (err) => {
      console.log(err);
      console.log("PASSWORD NOT SUCCESSFULLY UPDATED");
    },
  });

  function handleSubmit() {
    resetPasswordMutation.mutate();
  }

  function handlePasswordInput(e: ChangeEvent<HTMLInputElement>): void {
    setPassword(e.target.value);
  }

  function handleConfirmPasswordInput(e: ChangeEvent<HTMLInputElement>): void {
    setConfirmPassword(e.target.value);
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
        <Field>
          <FieldLabel htmlFor="input-password">New password</FieldLabel>
          <Input
            id="input-password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={handlePasswordInput}
          />
        </Field>
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
            onChange={handleConfirmPasswordInput}
          />
        </Field>
      </CardContent>
      <CardFooter className="flex flex-col gap-2.5">
        <RippleButton
          className="w-full cursor-pointer"
          variant="outline"
          onClick={handleSubmit}
        >
          Set new password
          <RippleButtonRipples />
        </RippleButton>
        <div className="flex items-center">
          <p className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer">
            ← Back to login
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

import { useState, type ChangeEvent } from "react";
import discordLogo from "@/assets/logos/discord.svg";
import googleLogo from "@/assets/logos/google.svg";

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
import { Label } from "../ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { validateEmail, validatePassword } from "@/utils";
import { Spinner } from "../ui/spinner";
import NewPassword from "./NewPassword";
import NewUsername from "./NewUsername";

async function createAccountFunction(data: {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}) {
  const response = await fetch("http://localhost:5000/create_account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function CreateAccount() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");
  const [error, setError] = useState<[string, string]>(
    oauthError === "oauth_denied"
      ? ["Authentication denied", "Google sign-in was cancelled or denied."]
      : ["", ""],
  );
  const navigate = useNavigate();

  const createAccountMutation = useMutation({
    mutationFn: (data: {
      email: string;
      username: string;
      password: string;
      confirmPassword: string;
    }) => createAccountFunction(data),

    onSuccess: () => {
      navigate("/activation_email_sent", { state: { email: email } });
    },

    onError: (error) => {
      const err = error as unknown as { error: string; description: string };
      setError([err.error ?? "Registration failed", err.description ?? ""]);
    },
  });

  function handleCreateAccount() {
    if (!validateEmail(email)) {
      setError([
        "Invalid email address",
        "Please enter a valid email address (e.g., john.doe@gmail.com)",
      ]);
    } else if (username.length < 3 || username.length > 20) {
      setError([
        "Invalid username length",
        "Username must be between 3 and 20 characters",
      ]);
    } else if (!username.charAt(0).match(/[a-z]/i)) {
      setError(["Invalid username", "Username must begin with a letter."]);
    } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError([
        "Invalid username",
        "Username can only contain alphanumeric characters.",
      ]);
    } else if (validatePassword(password).length !== 0) {
      setError([
        "Invalid password format",
        "Please check the password requirements and try again",
      ]);
    } else if (password !== confirmPassword) {
      setError([
        "Passwords do not match",
        "Please make sure both passwords are identical.",
      ]);
    } else {
      createAccountMutation.mutate({
        email,
        username,
        password,
        confirmPassword,
      });
    }
  }

  function handleBackToLogin() {
    navigate("/login");
  }

  return (
    <Card className="w-96">
      <CardHeader className="text-center">
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Join us. It only takes a moment.</CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="input-email">Email</FieldLabel>
          <Input
            id="input-email"
            type="email"
            placeholder="john.doe@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <br />
        <NewUsername username={username} setUsername={setUsername} />
        <br />
        <NewPassword password={password} setPassword={setPassword} />
        <br />
        <Field>
          <div className="flex items-center">
            <Label htmlFor="input-confirm-password">Confirm password</Label>
          </div>
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
              <AlertCircleIcon className="text-red-600 dark:text-red-400" />
              <AlertTitle>{error.at(0)}</AlertTitle>
              <AlertDescription>{error.at(1)}</AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2.5">
        <RippleButton
          className="w-full cursor-pointer"
          onClick={handleCreateAccount}
        >
          {createAccountMutation.isPending ? <Spinner /> : <>Create account</>}
          <RippleButtonRipples />
        </RippleButton>

        <div className="flex w-full items-center">
          <div className="flex-1 border-t border-gray-400" />
          <span className="mx-4 text-sm text-muted-foreground">
            or sign up with
          </span>
          <div className="flex-1 border-t border-gray-400" />
        </div>

        <div className="flex gap-2 justify-center">
          <RippleButton className="cursor-pointer" variant="outline">
            <img
              className="h-6 w-6 cursor-pointer"
              src={discordLogo}
              alt="Discord logo"
            />
            Discord
            <RippleButtonRipples />
          </RippleButton>

          <RippleButton
            className="cursor-pointer"
            variant="outline"
            onClick={() => {
              window.location.href = "http://localhost:5000/login_google";
            }}
          >
            <img
              className="h-5.5 w-5.5 cursor-pointer"
              src={googleLogo}
              alt="Google logo"
            />
            Google
            <RippleButtonRipples />
          </RippleButton>
        </div>

        <div className="flex items-center text-sm">
          <span>Already have an account?&nbsp;</span>
          <p
            className="ml-auto inline-block underline-offset-4 hover:underline cursor-pointer"
            onClick={handleBackToLogin}
          >
            Login here
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

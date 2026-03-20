import { useState, type ChangeEvent } from "react";
import discordLogo from "@/assets/logos/discord.svg";
import googleLogo from "@/assets/logos/google.svg";
import axios from "axios";

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
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { validateEmail } from "@/utils";
import { Spinner } from "../ui/spinner";

async function loginFunction(data: { email: string; password: string }) {
  const response = await fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function Login() {
  const prefillEmail: string = useLocation().state?.prefillEmail ?? "";
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<[string, string]>(["", ""]);
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => {
      return loginFunction(data);
    },

    onSuccess: () => {
      navigate("/dashboard");
    },

    onError: (error) => {
      const err = error as unknown as { error: string; description: string };
      setError([err.error ?? "Login failed", err.description ?? ""]);
    },
  });

  const loginTestMutation = useMutation({
    mutationFn: () =>
      axios.get(`http://127.0.0.1:5000/login_test_account`, {
        withCredentials: true,
      }),

    onSuccess: () => {
      navigate("/dashboard");
    },
  });

  async function handleLogin(): Promise<void> {
    if (!validateEmail(email)) {
      setError([
        "Invalid email address",
        "Please enter a valid email address (e.g., john.doe@gmail.com)",
      ]);
    } else if (password.length < 8) {
      setError([
        "Invalid password",
        "Password must be at least 8 characters long",
      ]);
    } else {
      loginMutation.mutate({
        email,
        password,
      });
    }
  }

  async function handleTestAccountLogin(): Promise<void> {
    loginTestMutation.mutate();
  }

  function handleForgotPassword() {
    navigate("/request_password_reset");
  }

  function handleRegister() {
    navigate("/create_account");
  }

  function handleEmailInput(e: ChangeEvent<HTMLInputElement>): void {
    setEmail(e.target.value);
  }

  function handlePasswordInput(e: ChangeEvent<HTMLInputElement>): void {
    setPassword(e.target.value);
  }

  return (
    <Card className="w-96">
      <CardHeader className="text-center">
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to continue where you left off.
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
        <br />
        <Field>
          <div className="flex items-center">
            <Label htmlFor="input-password">Password</Label>
            <p
              className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
              onClick={handleForgotPassword}
            >
              Forgot your password?
            </p>
          </div>
          <Input
            id="input-password"
            type="password"
            placeholder="**********"
            value={password}
            onChange={handlePasswordInput}
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
          variant="outline"
          onClick={handleLogin}
        >
          {loginMutation.isPending ? <Spinner /> : <>Login</>}
          <RippleButtonRipples />
        </RippleButton>

        <RippleButton
          className="w-full cursor-pointer"
          variant="outline"
          onClick={handleTestAccountLogin}
        >
          Login to test account
          <RippleButtonRipples />
        </RippleButton>

        <div className="flex w-full items-center">
          <div className="flex-1 border-t border-gray-400" />
          <span className="mx-4 text-sm text-muted-foreground">
            or login with
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

          <RippleButton className="cursor-pointer" variant="outline">
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
          <span>Don't have an account?&nbsp;</span>
          <p
            className="ml-auto inline-block underline-offset-4 hover:underline cursor-pointer"
            onClick={handleRegister}
          >
            Sign up here
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

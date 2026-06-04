import { useState } from "react";
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
import { API_BASE } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/use-document-title";

// ===== API FUNCTIONS =====
async function createAccountFunction(data: {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}) {
  const response = await fetch(`${API_BASE}/create_account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function CreateAccount() {
  useDocumentTitle("Create Account | CoinPulse");

  // ===== STATE VARIABLES =====
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");
  const [error, setError] = useState<[string, string]>(
    oauthError === "oauth_denied"
      ? ["Authentication denied", "OAuth sign-in was cancelled or denied."]
      : ["", ""],
  );
  const navigate = useNavigate();

  // ===== REACT QUERY HOOKS =====
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

  // ===== EVENT HANDLERS =====
  function handleCreateAccount(e?: React.FormEvent) {
    e?.preventDefault();
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
      {/* ===== HEADER ===== */}
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold tracking-tight">
          Create an account
        </CardTitle>
        <CardDescription>Join us. It only takes a moment.</CardDescription>
      </CardHeader>
      <form onSubmit={handleCreateAccount} className="flex flex-col gap-6">
        <CardContent className="flex flex-col gap-4">
          {/* ===== EMAIL FIELD ===== */}
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
          {/* ===== USERNAME FIELD ===== */}
          <NewUsername username={username} setUsername={setUsername} />
          {/* ===== PASSWORD FIELD ===== */}
          <NewPassword password={password} setPassword={setPassword} />
          {/* ===== CONFIRM PASSWORD FIELD ===== */}
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
          {/* ===== ERROR ALERT ===== */}
          {error.at(0) !== "" && error.at(1) !== "" && (
            <Alert className="max-w-md border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
              <AlertCircleIcon className="text-red-600 dark:text-red-400" />
              <AlertTitle>{error.at(0)}</AlertTitle>
              <AlertDescription>{error.at(1)}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2.5">
          {/* ===== SUBMIT BUTTON ===== */}
          <RippleButton
            className="w-full cursor-pointer"
            type="submit"
            disabled={
              createAccountMutation.isPending || createAccountMutation.isSuccess
            }
          >
            {createAccountMutation.isPending ? (
              <Spinner />
            ) : (
              <>Create account</>
            )}
            <RippleButtonRipples />
          </RippleButton>

          {/* ===== OAUTH DIVIDER ===== */}
          <div className="flex w-full items-center">
            <div className="flex-1 border-t border-border" />
            <span className="mx-4 text-sm text-muted-foreground">
              or sign up with
            </span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* ===== OAUTH BUTTONS ===== */}
          <div className="flex gap-2 justify-center">
            <RippleButton
              className="cursor-pointer"
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = `${API_BASE}/login_discord`;
              }}
            >
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
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = `${API_BASE}/login_google`;
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

          {/* ===== LOGIN LINK ===== */}
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
      </form>
    </Card>
  );
}

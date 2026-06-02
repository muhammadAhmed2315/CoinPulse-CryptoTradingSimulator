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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { validateEmail } from "@/utils";
import { Spinner } from "../ui/spinner";
import { prefetchDashboard } from "@/pages/Dashboard";
import { API_BASE, markAuthenticated } from "@/lib/api";

// ===== API FUNCTIONS =====
async function loginFunction(data: { email: string; password: string }) {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json();
    throw { status: response.status, ...body };
  }

  return await response.json();
}

export default function Login() {
  // ===== STATE VARIABLES =====
  const prefillEmail: string = useLocation().state?.prefillEmail ?? "";
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");
  const oauthErrorMessages: Record<string, [string, string]> = {
    oauth_denied: [
      "Authentication denied",
      "OAuth sign-in was cancelled or denied.",
    ],
    account_exists: [
      "Account already exists",
      "An account with this email already exists. Sign in with your email and password (or the provider you originally used).",
    ],
    email_unverified: [
      "Email not verified",
      "Your provider account's email isn't verified, so we can't sign you in with it.",
    ],
  };
  const [error, setError] = useState<[string, string]>(
    oauthError ? (oauthErrorMessages[oauthError] ?? ["", ""]) : ["", ""],
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ===== REACT QUERY HOOKS =====
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => {
      return loginFunction(data);
    },

    // Seed the auth cache from the login response so AuthContext flips to
    // authenticated synchronously. Blocking on a second /auth/me round-trip
    // here (the old invalidateQueries) kept the login button spinner stuck on
    // slow/cold deployments — the cookies are already set by /login, so the
    // extra fetch is unnecessary.
    onSuccess: (data: { user: { username: string; email: string } }) => {
      markAuthenticated();
      queryClient.setQueryData(["auth", "me"], data.user);
      prefetchDashboard(queryClient);
      navigate("/dashboard");
    },

    onError: (err: { status: number; error: string; description: string }) => {
      if (err.status === 403)
        navigate("/activation_email_sent", {
          state: { email: email },
        });
      else setError([err.error ?? "Login failed", err.description ?? ""]);
    },
  });

  const loginTestMutation = useMutation({
    mutationFn: () => {
      return loginFunction({
        email: "muhahmed3758@gmail.com",
        password: "Password123/",
      });
    },

    onSuccess: (data: { user: { username: string; email: string } }) => {
      markAuthenticated();
      queryClient.setQueryData(["auth", "me"], data.user);
      prefetchDashboard(queryClient);
      navigate("/dashboard");
    },
  });

  // ===== EVENT HANDLERS =====
  async function handleLogin(e?: React.FormEvent): Promise<void> {
    e?.preventDefault();
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

  return (
    <Card className="w-96">
      {/* ===== HEADER ===== */}
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription>
          Sign in to continue where you left off.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin} className="flex flex-col gap-6">
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
        {/* ===== PASSWORD FIELD ===== */}
        <Field>
          <div className="flex items-center">
            <Label htmlFor="input-password">Password</Label>
            <p
              className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
              onClick={() => navigate("/request_password_reset")}
            >
              Forgot your password?
            </p>
          </div>
          <Input
            id="input-password"
            type="password"
            placeholder="**********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        {/* ===== LOGIN BUTTON ===== */}
        <RippleButton className="w-full cursor-pointer" type="submit">
          {loginMutation.isPending ? <Spinner /> : <>Login</>}
          <RippleButtonRipples />
        </RippleButton>

        {/* ===== TEST LOGIN BUTTON ===== */}
        <RippleButton
          className="w-full cursor-pointer"
          variant="outline"
          type="button"
          onClick={handleTestAccountLogin}
        >
          Login to test account
          <RippleButtonRipples />
        </RippleButton>

        {/* ===== OAUTH DIVIDER ===== */}
        <div className="flex w-full items-center">
          <div className="flex-1 border-t border-border" />
          <span className="mx-4 text-sm text-muted-foreground">
            or login with
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* ===== OAUTH BUTTONS ===== */}
        <div className="flex gap-2 justify-center">
          <RippleButton
            className="cursor-pointer"
            variant="outline"
            type="button"
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
            variant="outline"
            type="button"
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

        {/* ===== SIGNUP LINK ===== */}
        <div className="flex items-center text-sm">
          <span>Don't have an account?&nbsp;</span>
          <p
            className="ml-auto inline-block underline-offset-4 hover:underline cursor-pointer"
            onClick={() => navigate("/create_account")}
          >
            Sign up here
          </p>
        </div>
      </CardFooter>
      </form>
    </Card>
  );
}

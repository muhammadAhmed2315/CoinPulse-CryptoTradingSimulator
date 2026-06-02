import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import AtSymbolIcon from "@/assets/icons/at-symbol.svg";
import { Separator } from "../ui/separator";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "../ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";
import NewUsername from "./NewUsername";
import { API_BASE, AUTH_ME_QUERY_KEY } from "@/lib/api";

export default function PickUsername() {
  // ===== STATE VARIABLES =====
  const { user, isLoading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<[string, string]>(["", ""]);
  const navigate = useNavigate();

  // ===== REACT QUERY HOOKS =====
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: { username: string }) =>
      axios.post(`${API_BASE}/pick_username`, data, {
        withCredentials: true,
      }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
      navigate("/dashboard");
    },

    onError: (err) => {
      const data = (
        err as AxiosError<{ error?: string; description?: string }>
      ).response?.data;
      setError([
        data?.error ?? "Couldn't set username",
        data?.description ?? "Please try again.",
      ]);
    },
  });

  // ===== SUBMIT HANDLER =====
  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    mutation.mutate({ username: username });
  }

  // ===== AUTH REDIRECTS =====
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.username) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center gap-3 text-center">
        {/* ===== ICON ===== */}
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={AtSymbolIcon} className="size-7 invert" />
        </div>

        {/* ===== HEADER ===== */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          GET STARTED
        </p>
        <p className="text-xl font-bold tracking-tight">Pick a Username</p>
        <Separator />

        {/* ===== INSTRUCTIONS ===== */}
        <p className="text-sm text-muted-foreground">
          Choose something unique. This is how others will find you.
        </p>

        {/* ===== USERNAME FORM ===== */}
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col items-center gap-3"
        >
          {/* ===== USERNAME FIELD ===== */}
          <NewUsername username={username} setUsername={setUsername} />

          {/* ===== ERROR ALERT ===== */}
          {error.at(0) !== "" && error.at(1) !== "" && (
            <Alert className="text-left border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
              <AlertCircleIcon className="text-red-600 dark:text-red-400" />
              <AlertTitle>{error.at(0)}</AlertTitle>
              <AlertDescription>{error.at(1)}</AlertDescription>
            </Alert>
          )}

          {/* ===== SUBMIT BUTTON ===== */}
          <RippleButton type="submit" className="w-full cursor-pointer">
            {mutation.isPending ? <Spinner /> : <>Continue</>}
            <RippleButtonRipples />
          </RippleButton>
        </form>
      </div>
    </Card>
  );
}

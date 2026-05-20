import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import AtSymbolIcon from "@/assets/icons/at-symbol.svg";
import { Separator } from "../ui/separator";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "../ui/spinner";
import NewUsername from "./NewUsername";

// TODO:
// - Username validation needs to be done here

export default function PickUsername() {
  // ===== STATE VARIABLES =====
  const { user, isLoading, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  // ===== REACT QUERY HOOKS =====
  const mutation = useMutation({
    mutationFn: (data: { username: string }) =>
      axios.post("http://localhost:5000/pick_username", data, {
        withCredentials: true,
      }),

    onSuccess: () => {
      navigate("/dashboard");
    },
  });

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
      <div className="flex flex-col items-center">
        {/* ===== ICON ===== */}
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={AtSymbolIcon} className="size-7 invert" />
        </div>

        {/* ===== HEADER ===== */}
        <p>GET STARTED</p>
        <p className="text-[22px] font-extrabold">Pick a Username</p>
        <Separator />

        {/* ===== INSTRUCTIONS ===== */}
        <p>Choose something unique. This is how others will find you.</p>

        {/* ===== USERNAME FIELD ===== */}
        <NewUsername username={username} setUsername={setUsername} />

        {/* ===== SUBMIT BUTTON ===== */}
        <RippleButton
          className="cursor-pointer"
          onClick={() => mutation.mutate({ username: username })}
        >
          {mutation.isPending ? <Spinner /> : <>Continue</>}
          <RippleButtonRipples />
        </RippleButton>
      </div>
    </Card>
  );
}

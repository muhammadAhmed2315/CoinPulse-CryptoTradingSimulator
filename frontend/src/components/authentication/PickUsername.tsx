import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import AtSymbolIcon from "@/assets/icons/at-symbol.svg";
import { Separator } from "../ui/separator";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState, type ChangeEvent } from "react";

// TODO:
// - Username validation needs to be done here

export default function PickUsername() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const PickUsernameMutation = useMutation({
    mutationFn: (data: { username: string }) =>
      axios.post("http://localhost:5000/pick_username", data, {
        withCredentials: true,
      }),

    onSuccess: () => {
      navigate("/dashboard");
    },
  });

  function handleUsernameChange(e: ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value);
  }

  function handleSubmit() {
    PickUsernameMutation.mutate({ username: username });
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={AtSymbolIcon} className="size-7 invert" />
        </div>

        <p>GET STARTED</p>
        <p className="text-[22px] font-extrabold">Pick a Username</p>
        <Separator />

        <p>Choose something unique. This is how others will find you.</p>

        <Input
          placeholder="@ username"
          value={username}
          onChange={handleUsernameChange}
        />

        <RippleButton className="cursor-pointer" onClick={handleSubmit}>
          Continue
          <RippleButtonRipples />
        </RippleButton>
      </div>
    </Card>
  );
}

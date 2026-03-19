import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import TickIcon from "@/assets/icons/tick.svg";
import { Separator } from "../ui/separator";
import DotGreen from "@/assets/dot-green.svg";
import { useLocation, useNavigate } from "react-router-dom";

export default function EmailVerificationSuccessful() {
  const navigate = useNavigate();
  const email = useLocation().state?.email;

  console.log(email);

  function handleLogin() {
    // TODO: This should go straight to the dashboard, you'll have to update the
    //      "/verify_email" endpoint so that it returns an authentication token and you
    //      can instantly log the user in
    navigate("/login", { state: { prefillEmail: email } });
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={TickIcon} className="size-7 invert" />
        </div>

        <p>ALL DONE</p>
        <p className="text-[22px] font-extrabold">
          Email Verification Successful
        </p>
        <Separator />

        <div className="flex items-center gap-2 mt-2">
          <img src={DotGreen} className="size-2" />
          <p className="font-bold text-[#22c55e]">Verified</p>
        </div>

        <p className="text-center text-sm">
          Your email adress <b>{email}</b> has been successfully verified.
        </p>

        <p className="text-sm">You can now access your account.</p>

        <RippleButton className="w-full cursor-pointer" onClick={handleLogin}>
          Log in
          <RippleButtonRipples />
        </RippleButton>
      </div>
    </Card>
  );
}

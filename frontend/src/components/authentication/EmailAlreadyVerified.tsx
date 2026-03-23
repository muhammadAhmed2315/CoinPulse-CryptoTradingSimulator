import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import ClockIcon from "@/assets/icons/clock.svg";
import { Separator } from "../ui/separator";
import DotBlue from "@/assets/dot-blue.svg";
import { useLocation, useNavigate } from "react-router-dom";

export default function EmailAlreadyVerified() {
  const navigate = useNavigate();
  const email = useLocation().state?.email;

  // Redirect if page was accessed directly without the required state (e.g. bookmark, refresh)
  if (!email) {
    navigate("/login", { replace: true });
    return null;
  }

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
          <img src={ClockIcon} className="size-7 invert" />
        </div>

        <p>ALREADY DONE</p>
        <p className="text-[22px] font-extrabold text-center">
          This email has already been verified
        </p>
        <Separator />

        <div className="flex items-center gap-2 mt-2 bg-[#d6e4f6] rounded-xl pl-2 pr-2 pt-1 pb-1">
          <img src={DotBlue} className="size-2" />
          <p className="font-bold text-[#3266ad]">Already verified</p>
        </div>

        <p className="text-center text-sm">
          Your email adress <b>{email}</b> was already verified. No further
          action is needed.
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

import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import ChainIcon from "@/assets/icons/broken-chain.svg";
import { Separator } from "../ui/separator";
import DotRed from "@/assets/dot-red.svg";
import { useLocation, useNavigate } from "react-router-dom";

// TODO:
// - Styling: Bottom feels a bit empty, maybe add another button or a contact support
//            link?

export default function AuthenticationPageNotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={ChainIcon} className="size-7 " />
        </div>

        <p>404</p>
        <p className="text-[22px] font-extrabold">Page Not Found</p>
        <Separator />

        <div className="flex items-center gap-2 mt-2 bg-[#fde8e8] rounded-xl pl-2 pr-2 pt-1 pb-1">
          <img src={DotRed} className="size-2" />
          <p className="font-bold text-[#b91c1c]">{location.pathname}</p>
        </div>

        <p className="text-center">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <br />

        <RippleButton
          className="w-full cursor-pointer"
          onClick={() => navigate("/login")}
        >
          ← Back to login
          <RippleButtonRipples />
        </RippleButton>
        <br />
      </div>
    </Card>
  );
}

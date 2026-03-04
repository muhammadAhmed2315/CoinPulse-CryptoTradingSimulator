import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MailIcon from "@/assets/icons/mail.svg";
import { Separator } from "../ui/separator";
import DotGreen from "@/assets/dot-green.svg";
import { useNavigate } from "react-router-dom";

export default function VerificationSent() {
  const navigate = useNavigate();

  function handleChangeEmail() {
    navigate("/login");
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={MailIcon} className="size-7 invert" />
        </div>

        <p>ONE MORE STEP</p>
        <p className="text-[22px] font-extrabold">Verify your email address</p>
        <Separator />

        <p>We've sent a verification link to</p>

        <div className="flex items-center gap-2">
          <img src={DotGreen} className="size-2" />
          <p className="font-bold">example@gmail.com</p>
        </div>

        <p>
          Click the link in your inbox to complete sign-up. Check your{" "}
          <b>spam folder</b> if you don't see it.
        </p>

        <Button className="cursor-pointer">↻ Resend verification email</Button>
        <div className="flex">
          <p>Wrong address?</p>
          <b className="cursor-pointer" onClick={handleChangeEmail}>
            Change email
          </b>
        </div>
      </div>
    </Card>
  );
}

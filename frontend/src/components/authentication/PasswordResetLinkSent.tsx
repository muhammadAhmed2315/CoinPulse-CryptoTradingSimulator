import { Card } from "@/components/ui/card";
import TickIcon from "@/assets/icons/tick.svg";
import { Separator } from "../ui/separator";
import { useLocation, useNavigate } from "react-router-dom";

// TODO:
// - Clicking contact support should open an email client

export default function PasswordResetLinkSent() {
  const navigate = useNavigate();
  const email = useLocation().state?.email;

  function handleBackToLogin() {
    navigate("/login");
  }

  function handleRequestEmail() {
    navigate("/request_password_reset", { state: { email: email } });
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={TickIcon} className="size-7 invert" />
        </div>

        <p className="text-[22px] font-extrabold">Check your inbox</p>

        <p>
          If there's an account associated with <b>{email}</b>, you'll receive a
          link to reset your password shortly. Be sure to check your spam folder
          too.
        </p>

        <p>This link will expire in 1 hour.</p>

        <Separator />

        <div className="flex flex-col items-center">
          <a
            className="inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
            onClick={handleBackToLogin}
          >
            ← Back to login
          </a>
          <div>
            <span>Didn't receive an email? </span>
            <span
              className="hover:underline cursor-pointer"
              onClick={handleRequestEmail}
            >
              Send again
            </span>
          </div>
          <div>
            <span>Need help? </span>
            <span className="hover:underline cursor-pointer">
              Contact support
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

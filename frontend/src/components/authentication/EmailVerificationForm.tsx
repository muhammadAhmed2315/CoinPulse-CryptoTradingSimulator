import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import { Card } from "@/components/ui/card";
import InfoIcon from "@/assets/icons/info.svg";
import { Separator } from "../ui/separator";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import MailIcon from "@/assets/icons/mail.svg";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Field, FieldLabel } from "../ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { useState, type ChangeEvent } from "react";
import { validateEmail } from "@/utils";
import { AlertCircleIcon } from "lucide-react";
import { Spinner } from "../ui/spinner";

async function requestVerificationEmail(email: string) {
  const response = await fetch(
    "http://127.0.0.1:5000/retry_verification_from_email",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
      credentials: "include",
    },
  );

  if (!response.ok) throw await response.json();

  return await response.json();
}

export default function EmailVerificationForm() {
  const [email, setEmail] = useState("");
  const [errorVisible, setErrorVisible] = useState(false);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => {
      return requestVerificationEmail(email);
    },

    onSuccess: () => {
      navigate("/activation_email_sent", {
        state: { email: email, canResend: false },
      });
    },
  });

  async function handleEmailSubmit(): Promise<void> {
    if (!validateEmail(email)) {
      setErrorVisible(true);
    } else {
      setErrorVisible(false);
      mutation.mutate();
    }
  }

  function handleEmailInput(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
  }

  return (
    <Card className="w-100 p-9">
      <div className="flex flex-col items-center">
        <div className="size-14 bg-black flex items-center justify-center rounded-xl">
          <img src={InfoIcon} className="size-7 invert" />
        </div>

        <p>SOMETHING WENT WRONG</p>
        <p className="text-[22px] font-extrabold">Request a new link</p>
        <Separator />

        <p>
          That link is no longer valid — it may have expired or already been
          used. Enter your email below and we'll send you a fresh one.
        </p>

        <Field>
          <FieldLabel htmlFor="input-email">Email</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <img src={MailIcon} className="size-4 opacity-50" />
            </InputGroupAddon>
            <InputGroupInput
              id="input-email"
              type="email"
              placeholder="john.doe@gmail.com"
              value={email}
              onChange={handleEmailInput}
            />
          </InputGroup>
        </Field>

        {errorVisible && (
          <Alert className="max-w-md border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-50">
            <AlertCircleIcon className="text-red-600 dark:text-red-400" />
            <AlertTitle>Invalid email address</AlertTitle>
            <AlertDescription>
              Please enter a valid email address (e.g., john.doe@gmail.com)
            </AlertDescription>
          </Alert>
        )}

        <RippleButton
          className="w-full cursor-pointer"
          onClick={handleEmailSubmit}
        >
          {mutation.isPending ? <Spinner /> : <>Send new link</>}
          <RippleButtonRipples />
        </RippleButton>
        <div className="flex text-sm underline-offset-4 ">
          Need help?&nbsp;
          <a className="hover:underline cursor-pointer">Contact support</a>
        </div>
      </div>
    </Card>
  );
}

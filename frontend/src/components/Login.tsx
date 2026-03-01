import { useState, type ChangeEvent } from "react";
import discordLogo from "@/assets/logos/discord.svg";
import googleLogo from "@/assets/logos/google.svg";

import { Button } from "@/components/ui/button";
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
import { Label } from "./ui/label";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleEmailInput(e: ChangeEvent<HTMLInputElement>): void {
    setEmail(e.target.value);
  }

  function handlePasswordInput(e: ChangeEvent<HTMLInputElement>): void {
    setPassword(e.target.value);
  }

  return (
    <Card className="w-96">
      <CardHeader className="text-center">
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to continue where you left off.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="input-email">Email</FieldLabel>
          <Input
            id="input-email"
            type="email"
            placeholder="john.doe@gmail.com"
            value={email}
            onChange={handleEmailInput}
          />
        </Field>
        <br />
        <Field>
          <div className="flex items-center">
            <Label htmlFor="input-password">Password</Label>
            <a
              href="#"
              className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input
            id="input-password"
            type="password"
            placeholder="**********"
            value={password}
            onChange={handlePasswordInput}
          />
        </Field>
      </CardContent>
      <CardFooter className="flex flex-col gap-2.5">
        <Button className="w-full cursor-pointer" variant="outline">
          Login
        </Button>

        <Button className="w-full cursor-pointer" variant="outline">
          Login to test account
        </Button>

        <div className="flex w-full items-center">
          <div className="flex-1 border-t border-gray-400" />
          <span className="mx-4 text-sm text-muted-foreground">
            or login with
          </span>
          <div className="flex-1 border-t border-gray-400" />
        </div>

        <div className="flex gap-2 justify-center">
          <Button className="cursor-pointer" variant="outline">
            <img
              className="h-6 w-6 cursor-pointer"
              src={discordLogo}
              alt="Discord logo"
            />
            Discord
          </Button>

          <Button className="cursor-pointer" variant="outline">
            <img
              className="h-5.5 w-5.5 cursor-pointer"
              src={googleLogo}
              alt="Google logo"
            />
            Google
          </Button>
        </div>

        <div className="flex items-center">
          <a
            href="#"
            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
          >
            Don't have an account? Sign up here
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}

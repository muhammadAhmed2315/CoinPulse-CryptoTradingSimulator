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

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleEmailInput(e: ChangeEvent<HTMLInputElement>): void {
    setEmail(e.target.value);
  }

  function handleUsernameInput(e: ChangeEvent<HTMLInputElement>): void {
    setUsername(e.target.value);
  }

  function handlePasswordInput(e: ChangeEvent<HTMLInputElement>): void {
    setPassword(e.target.value);
  }

  function handleConfirmPasswordInput(e: ChangeEvent<HTMLInputElement>): void {
    setConfirmPassword(e.target.value);
  }

  return (
    <Card className="w-96">
      <CardHeader className="text-center">
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Join us. It only takes a moment.</CardDescription>
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
          <FieldLabel htmlFor="input-username">Username</FieldLabel>
          <Input
            id="input-username"
            type="text"
            placeholder="JohnDoe2315"
            value={username}
            onChange={handleUsernameInput}
          />
        </Field>
        <br />
        <Field>
          <div className="flex items-center">
            <Label htmlFor="input-password">Password</Label>
          </div>
          <Input
            id="input-password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={handlePasswordInput}
          />
        </Field>
        <br />
        <Field>
          <div className="flex items-center">
            <Label htmlFor="input-confirm-password">Confirm password</Label>
          </div>
          <Input
            id="input-confirm-password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={handleConfirmPasswordInput}
          />
        </Field>
      </CardContent>
      <CardFooter className="flex flex-col gap-2.5">
        <Button className="w-full cursor-pointer" variant="outline">
          Create account
        </Button>

        <div className="flex w-full items-center">
          <div className="flex-1 border-t border-gray-400" />
          <span className="mx-4 text-sm text-muted-foreground">
            or sign up with
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
            Already have an account? Login here
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}

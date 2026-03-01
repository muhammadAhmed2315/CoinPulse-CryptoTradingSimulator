import { useState, type ChangeEvent } from "react";

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

export default function ResetPassword() {
  const [password, setPassword] = useState("");

  function handlePasswordInput(e: ChangeEvent<HTMLInputElement>): void {
    setPassword(e.target.value);
  }

  return (
    <Card className="w-96">
      <CardHeader className="text-center">
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>
          Choose something strong. You won't be able to reuse your previous
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="input-password">New password</FieldLabel>
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
          <FieldLabel htmlFor="input-confirm-password">
            Confirm password
          </FieldLabel>
          <Input
            id="input-confirm-password"
            type="password"
            placeholder="Re-enter password"
            value={password}
            onChange={handlePasswordInput}
          />
        </Field>
      </CardContent>
      <CardFooter className="flex flex-col gap-2.5">
        <Button className="w-full cursor-pointer" variant="outline">
          Set new password
        </Button>
        <div className="flex items-center">
          <a
            href="#"
            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
          >
            ← Back to sign in
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}

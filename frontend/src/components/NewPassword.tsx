import { type Dispatch, type SetStateAction } from "react";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import DotRed from "@/assets/dot-red.svg";
import DotGreen from "@/assets/dot-green.svg";
import { PASSWORD_RULES, validatePassword } from "@/utils";

type NewPasswordProps = {
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
};

export default function NewPassword({
  password,
  setPassword,
}: NewPasswordProps) {
  const failedLabels = new Set(validatePassword(password));

  return (
    <>
      <Field className="pb-2">
        <FieldLabel htmlFor="input-password">New password</FieldLabel>
        <Input
          id="input-password"
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {PASSWORD_RULES.map(({ label }) => (
        <div key={label} className="flex gap-2">
          <img src={failedLabels.has(label) ? DotRed : DotGreen} />
          <p
            className={
              failedLabels.has(label) ? "text-red-400" : "text-green-400"
            }
          >
            {label}
          </p>
        </div>
      ))}
    </>
  );
}

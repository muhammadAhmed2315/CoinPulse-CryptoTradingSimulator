import { type Dispatch, type SetStateAction } from "react";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { validatePasswordRule } from "@/utils";

type NewPasswordProps = {
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
};

export default function NewPassword({
  password,
  setPassword,
}: NewPasswordProps) {
  return (
    <>
      <Field className="pb-2">
        <FieldLabel htmlFor="input-password">Password</FieldLabel>
        <Input
          id="input-password"
          type="password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FieldDescription>
          Your password needs:{" "}
          <span
            className={
              validatePasswordRule(password, "At least 8 characters")
                ? "text-green-400"
                : "text-red-400"
            }
          >
            8+ characters
          </span>
          , an{" "}
          <span
            className={
              validatePasswordRule(password, "At least one uppercase letter")
                ? "text-green-400"
                : "text-red-400"
            }
          >
            uppercase letter
          </span>
          , a{" "}
          <span
            className={
              validatePasswordRule(password, "At least one lowercase letter")
                ? "text-green-400"
                : "text-red-400"
            }
          >
            lowercase letter
          </span>
          , a{" "}
          <span
            className={
              validatePasswordRule(password, "At least one number")
                ? "text-green-400"
                : "text-red-400"
            }
          >
            number
          </span>
          , and a{" "}
          <span
            className={
              validatePasswordRule(password, "At least one special character")
                ? "text-green-400"
                : "text-red-400"
            }
          >
            special character
          </span>
          .
        </FieldDescription>
      </Field>
    </>
  );
}

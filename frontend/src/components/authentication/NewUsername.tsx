import { type Dispatch, type SetStateAction } from "react";
import { validateUsernameRule } from "@/utils";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

type NewUsernameProps = {
  username: string;
  setUsername: Dispatch<SetStateAction<string>>;
};

export default function NewUsername({
  username,
  setUsername,
}: NewUsernameProps) {
  return (
    <>
      <Field className="pb-2">
        <FieldLabel htmlFor="input-username">Username</FieldLabel>
        <Input
          id="input-username"
          type="text"
          placeholder="@username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <FieldDescription>
          Your username needs:{" "}
          <span
            className={
              validateUsernameRule(username, "At least 3 characters")
                ? "text-green-400"
                : "text-red-400"
            }
          >
            at least 3 characters
          </span>
          ,{" "}
          <span
            className={
              validateUsernameRule(username, "No more than 20 characters")
                ? "text-green-400"
                : "text-red-400"
            }
          >
            no more than 20
          </span>
          , a{" "}
          <span
            className={
              validateUsernameRule(username, "First character must be a letter")
                ? "text-green-400"
                : "text-red-400"
            }
          >
            letter to start
          </span>
          , and{" "}
          <span
            className={
              validateUsernameRule(username, "Only letters and numbers")
                ? "text-green-400"
                : "text-red-400"
            }
          >
            only letters and numbers
          </span>
          .
        </FieldDescription>
      </Field>
    </>
  );
}

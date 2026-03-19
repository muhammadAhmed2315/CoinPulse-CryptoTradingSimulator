import {
  RippleButton,
  RippleButtonRipples,
} from "@/components/animate-ui/components/buttons/ripple";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "../ui/label";

export default function InvalidResetLinkPage() {
  return (
    <Card className="w-96">
      <CardHeader className="text-center">
        <CardTitle>Reset link invalid</CardTitle>
        <CardDescription>
          This password reset link can't be used. This usually happens because:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-6 space-y-2 text-sm">
          <li>
            <Label>The link has already been used to reset your password</Label>
          </li>
          <li>
            <Label>
              The link expired — reset links are valid for 15 minutes
            </Label>
          </li>
          <li>
            <Label>The link was copied incorrectly from your email</Label>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-2.5">
        <RippleButton className="w-full cursor-pointer" variant="outline">
          Reset password reset email
          <RippleButtonRipples />
        </RippleButton>
        <div className="flex w-full items-center justify-between">
          <p className="text-sm underline-offset-4 hover:underline cursor-pointer">
            Need help? Contact support
          </p>

          <p className="text-sm underline-offset-4 hover:underline cursor-pointer">
            ← Back to login
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

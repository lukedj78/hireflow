import { Suspense } from "react";
import { resetPassword } from "@/lib/server/password-actions";

function ResetPasswordContent({ token }: { token: string | null }) {
  return (
    <div>
      <h1>Reset Password</h1>
      <form action={resetPassword}>
        <input type="hidden" name="token" value={token || ""} />
        <input type="password" name="password" placeholder="New Password" />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage({ searchParams }: { searchParams: { token: string | null } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent token={searchParams.token} />
    </Suspense>
  );
}

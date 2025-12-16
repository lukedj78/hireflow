import { Suspense } from "react";
import { verifyEmailAction } from "@/lib/server/verification-actions";

async function verifyToken(token: string | null) {
  if (!token) {
    return "Invalid or missing verification token.";
  }
  const result = await verifyEmailAction(token);
  if (result.error) {
    return result.error;
  }
  return "Email verified successfully. You can now sign in.";
}

function VerifyEmailContent({ message }: { message: string }) {
  return (
    <div>
      <h1>Email Verification</h1>
      <p>{message}</p>
    </div>
  );
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token: string | null } }) {
  const message = await verifyToken(searchParams.token);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent message={message} />
    </Suspense>
  );
}

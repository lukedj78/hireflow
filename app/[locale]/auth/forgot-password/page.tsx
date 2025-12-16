import { sendPasswordResetEmail } from "@/lib/server/password-actions";

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1>Forgot Password</h1>
      <form action={sendPasswordResetEmail}>
        <input type="email" name="email" placeholder="Email" />
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
}

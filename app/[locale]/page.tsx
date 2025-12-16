import { auth } from "@/lib/auth";
import { signOut } from "@/lib/server/auth-actions";
import { headers } from "next/headers";
import Link from "next/link";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    return (
      <div>
        <h1>Welcome, {session.user.name}</h1>
        <p>Email: {session.user.email}</p>
        <form action={signOut}>
          <button type="submit">Sign Out</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to Hireflow</h1>
      <Link href="/auth/sign-in">Sign In</Link>
      <br />
      <Link href="/auth/sign-up">Sign Up</Link>
    </div>
  );
}

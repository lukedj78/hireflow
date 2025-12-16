"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  await auth.api.signInEmail({
    body: {
      email,
      password,
    },
    headers: await headers(),
  });

  redirect("/");
}

export async function signUp(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
    headers: await headers(),
  });

  redirect("/");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export async function unlinkAccountAction(providerId: string) {
    return await auth.api.unlinkAccount({
        body: {
            providerId
        },
        headers: await headers()
    })
}

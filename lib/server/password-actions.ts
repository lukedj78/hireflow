"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function sendPasswordResetEmail(formData: FormData) {
  const email = formData.get("email") as string;
  await auth.api.requestPasswordReset({
    body: { email },
    headers: await headers(),
  });
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  await auth.api.resetPassword({
    body: { token, newPassword: password },
    headers: await headers(),
  });
  redirect("/auth/sign-in");
}

"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

/**
 * Esegue l'accesso dell'utente utilizzando email e password.
 * Reindirizza alla home page in caso di successo.
 */
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

/**
 * Registra un nuovo utente con nome, email e password.
 * Reindirizza alla home page dopo la registrazione.
 */
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

/**
 * Esegue il logout dell'utente corrente e reindirizza alla home page.
 */
export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

/**
 * Scollega un account provider (es. Google, GitHub) dal profilo dell'utente corrente.
 */
export async function unlinkAccountAction(providerId: string) {
    return await auth.api.unlinkAccount({
        body: {
            providerId
        },
        headers: await headers()
    })
}

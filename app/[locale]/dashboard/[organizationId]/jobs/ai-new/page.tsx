import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ClientPage from "./client-page";

interface PageProps {
  params: Promise<{
    locale: string;
    organizationId: string;
  }>;
}

export default async function AiJobCreationPage({ params }: PageProps) {
  const { organizationId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/sign-in");
  }


  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage organizationId={organizationId} />
    </Suspense>
  );
}

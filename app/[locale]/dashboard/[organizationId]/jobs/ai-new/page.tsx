import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ClientPage from "./client-page";
import { checkOrgPermission } from "@/lib/server/permissions-check";

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

  try {
      await checkOrgPermission(organizationId, { jobPosting: ["create"] });
  } catch {
      redirect(`/dashboard/${organizationId}/jobs`);
  }


  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage organizationId={organizationId} />
    </Suspense>
  );
}

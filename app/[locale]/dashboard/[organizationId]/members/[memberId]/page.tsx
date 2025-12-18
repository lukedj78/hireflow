import { getOrganizationMemberAction } from "@/lib/server/organization-actions"
import { notFound } from "next/navigation"
import MemberClientPage from "./client-page"
import { PageLayout } from "@/components/page-layout"

export default async function MemberPage({ params }: { params: Promise<{ organizationId: string, memberId: string }> }) {
  const { organizationId, memberId } = await params
  const member = await getOrganizationMemberAction(organizationId, memberId)

  if (!member) {
    notFound()
  }

  return (
    <PageLayout>
      <MemberClientPage member={member} organizationId={organizationId} />
    </PageLayout>
  )
}

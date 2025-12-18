import DashboardLoading from "@/components/loading"
import { PageLayout } from "@/components/page-layout"
import { useTranslations } from "next-intl"
import { Suspense } from "react"

export default function OrganizationDashboardPage({ params }: { params: { organizationId: string } }) {
  return (
    <PageLayout>
      <Suspense fallback={<DashboardLoading />}>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Welcome to your organization dashboard.</p>
      </Suspense>
    </PageLayout>
  )
}

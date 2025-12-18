import { listOrganizationsAction } from "@/lib/server/organization-actions"
import AdminOrganizationsClientPage from "./client-page"
import { Suspense } from "react"
import DashboardLoading from "@/components/loading"
import { PageLayout } from "@/components/page-layout"

export default async function AdminOrganizationsPage() {
    const orgs = await listOrganizationsAction({ limit: 100 })

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <AdminOrganizationsClientPage initialOrgs={orgs || []} />
            </Suspense>
        </PageLayout>
    )
}

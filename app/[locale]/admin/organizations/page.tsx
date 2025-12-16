import { listOrganizationsAction } from "@/lib/server/organization-actions"
import AdminOrganizationsClientPage from "./client-page"
import { Suspense } from "react"
import DashboardLoading from "@/components/loading"

export default async function AdminOrganizationsPage() {
    const orgs = await listOrganizationsAction({ limit: 100 })

    return (
        <Suspense fallback={<DashboardLoading />}>
            <AdminOrganizationsClientPage initialOrgs={orgs || []} />
        </Suspense>
    )
}

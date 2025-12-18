import { listUsersAction } from "@/lib/server/admin-actions"
import AdminUsersClientPage, { AdminUser } from "./client-page"
import { Suspense } from "react"
import DashboardLoading from "@/components/loading"
import { PageLayout } from "@/components/page-layout"

export default async function AdminUsersPage() {
    const res = await listUsersAction()
    const users = (res?.users || []) as unknown as AdminUser[]
    
    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading/>}>
                <AdminUsersClientPage initialUsers={users} />
            </Suspense>
        </PageLayout>
    )
}

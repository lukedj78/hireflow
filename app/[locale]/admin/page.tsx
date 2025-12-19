import { getAdminStatsAction } from "@/lib/server/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, BuildingsIcon, ShieldCheckIcon, CreditCardIcon } from "@phosphor-icons/react/dist/ssr";
import { PageLayout } from "@/components/page-layout";
import { RecentUsersTable } from "./recent-users-table";

export default async function AdminDashboardPage() {
    const stats = await getAdminStatsAction();

    return (
        <PageLayout>
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of the platform statistics.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.users}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered users on the platform
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                        <BuildingsIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.organizations}</div>
                        <p className="text-xs text-muted-foreground">
                            Active organizations
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Teams</CardTitle>
                        <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.teams}</div>
                        <p className="text-xs text-muted-foreground">
                            Total teams created
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                        <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.premiumUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Subscribed users
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium">Recent Signups</h3>
                <RecentUsersTable users={stats.recentUsers} />
            </div>
        </PageLayout>
    );
}

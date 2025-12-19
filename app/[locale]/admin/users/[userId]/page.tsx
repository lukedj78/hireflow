import { PageLayout } from "@/components/page-layout";
import { getUserAction } from "@/lib/server/admin-actions";
import { notFound } from "next/navigation";
import AdminUserDetailClientPage from "./client-page";

interface PageProps {
    params: Promise<{
        userId: string;
    }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
    const { userId } = await params;
    const user = await getUserAction(userId);

    if (!user) {
        notFound();
    }

    return (
        <PageLayout>
            <AdminUserDetailClientPage user={user} />
        </PageLayout>
    );
}

import { getNotificationsAction } from "@/lib/server/notification-actions";
import { NotificationList } from "@/components/notifications/notification-list";
import { Notification } from "@/components/notifications/notification-bell";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";

interface PageProps {
    params: Promise<{
        organizationId: string;
        locale: string;
    }>;
}

export default async function NotificationsPage({ params }: PageProps) {
    const { organizationId } = await params;
    const notifications = await getNotificationsAction(organizationId);

    // Serialize dates for Client Component
    const serializedNotifications = notifications.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt ? n.readAt.toISOString() : null,
    }));

    return (
        <PageLayout>
            <PageHeader title="Notifications" />
            <NotificationList 
                initialNotifications={serializedNotifications as unknown as Notification[]} 
                organizationId={organizationId}
            />
        </PageLayout>
    );
}

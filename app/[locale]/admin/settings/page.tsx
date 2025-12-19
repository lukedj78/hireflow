import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { getUserSettingsAction } from "@/lib/server/settings-actions";
import AdminSettingsClientPage from "./client-page";

export default async function AdminSettingsPage() {
    const settings = await getUserSettingsAction();

    // Default values if settings is null (though action handles it, good for safety)
    const initialSettings = settings || {
        emailNotifications: true,
        inAppNotifications: true
    };

    return (
        <PageLayout>
            <PageHeader 
                title="Settings" 
                description="Manage your account and notification preferences" 
            />
            <AdminSettingsClientPage initialSettings={initialSettings} />
        </PageLayout>
    );
}

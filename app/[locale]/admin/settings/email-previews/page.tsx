import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import EmailPreviewsClientPage from "./client-page";

export default function EmailPreviewsPage() {
    return (
        <PageLayout>
            <PageHeader 
                title="Email Previews" 
                description="Preview and test system email templates." 
            />
            <EmailPreviewsClientPage />
        </PageLayout>
    );
}

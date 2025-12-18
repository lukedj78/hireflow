import { findMatchingCandidatesAction } from "@/lib/server/ai-actions";
import SuggestionsClientPage from "./client-page";
import { PageLayout } from "@/components/page-layout";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { GenerateEmbeddingButton } from "./generate-embedding-button";
import { PageHeader } from "@/components/page-header";

type Params = Promise<{ organizationId: string; jobId: string }>;

export default async function SuggestionsPage(props: { params: Params }) {
    const params = await props.params;
    const { organizationId, jobId } = params;

    const result = await findMatchingCandidatesAction(jobId);

    if (!result.success) {
        const isMissingEmbedding = result.error?.includes("embedding");

        return (
            <PageLayout>
                <PageHeader
                    title="AI Suggested Candidates"
                    description="Based on semantic matching between the job description and candidate profiles."
                    backHref={`/dashboard/${organizationId}/jobs/${jobId}`}
                />
                <Empty className="border border-dashed">
                    <EmptyMedia variant="icon">
                        <WarningCircleIcon className="text-destructive h-8 w-8" />
                    </EmptyMedia>
                    <EmptyHeader>
                        <EmptyTitle>Error</EmptyTitle>
                        <EmptyDescription>
                            {result.error || "Failed to load suggestions. Please try again later."}
                        </EmptyDescription>
                    </EmptyHeader>
                    {isMissingEmbedding && (
                        <div className="mt-4">
                            <GenerateEmbeddingButton jobId={jobId} />
                        </div>
                    )}
                </Empty>

            </PageLayout>
        );
    }

    const candidates = result.data || [];

    return (
        <PageLayout>
            <SuggestionsClientPage
                candidates={candidates}
                jobId={jobId}
                organizationId={organizationId}
            />
        </PageLayout>
    );
}

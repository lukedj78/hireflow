import { findMatchingCandidatesAction } from "@/lib/server/ai-actions";
import SuggestionsClientPage from "./client-page";
import { PageLayout } from "@/components/page-layout";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr";
import { GenerateEmbeddingButton } from "./generate-embedding-button";

type Params = Promise<{ jobId: string }>;

export default async function SuggestionsPage(props: { params: Params }) {
    const params = await props.params;
    const { jobId } = params;
    
    const result = await findMatchingCandidatesAction(jobId);
    
    if (!result.success) {
        const isMissingEmbedding = result.error?.includes("embedding");

        return (
            <PageLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <h1 className="text-2xl font-bold tracking-tight">AI Suggested Candidates</h1>
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
                </div>
            </PageLayout>
        );
    }

    const candidates = result.data || [];
    
    return (
        <PageLayout>
            <SuggestionsClientPage 
                candidates={candidates} 
                jobId={jobId} 
            />
        </PageLayout>
    );
}

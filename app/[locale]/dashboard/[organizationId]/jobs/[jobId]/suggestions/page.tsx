import { findMatchingCandidatesAction } from "@/lib/server/ai-actions";
import SuggestionsClientPage from "./client-page";
import { PageLayout } from "@/components/page-layout";

type Params = Promise<{ jobId: string }>;

export default async function SuggestionsPage(props: { params: Params }) {
    const params = await props.params;
    const { jobId } = params;
    
    let candidates: Awaited<ReturnType<typeof findMatchingCandidatesAction>> = [];
    try {
        candidates = await findMatchingCandidatesAction(jobId);
    } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        // We might want to show an error state or just empty list
        // For now, let's keep it empty or maybe throw if critical
    }

    return (
        <PageLayout>
            <SuggestionsClientPage candidates={candidates} jobId={jobId} />
        </PageLayout>
    );
}

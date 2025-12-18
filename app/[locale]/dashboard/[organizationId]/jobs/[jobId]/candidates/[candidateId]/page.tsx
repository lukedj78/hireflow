import { getCandidateByIdAction } from "@/lib/server/candidate-actions";
import { notFound } from "next/navigation";
import CandidateClientPage from "./client-page";

type Params = Promise<{ organizationId: string; jobId: string; candidateId: string }>;

export default async function CandidatePage(props: { params: Params }) {
    const params = await props.params;
    const { organizationId, jobId, candidateId } = params;

    const result = await getCandidateByIdAction(candidateId);

    if (!result.success || !result.data) {
        notFound();
    }

    return (
        <CandidateClientPage 
            candidate={result.data} 
            organizationId={organizationId} 
            jobId={jobId} 
        />
    );
}

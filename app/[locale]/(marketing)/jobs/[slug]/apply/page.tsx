import { getJobBySlugAction } from "@/lib/server/jobs-actions";
import { notFound } from "next/navigation";
import ApplyClientPage from "./client-page";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ApplyPage({ params }: PageProps) {
    const { slug } = await params;
    const result = await getJobBySlugAction(slug);

    if (!result.success || !result.data) {
        notFound();
    }

    return <ApplyClientPage job={result.data} />;
}

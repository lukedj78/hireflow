import { getJobBySlugAction } from "@/lib/server/jobs-actions";
import { notFound } from "next/navigation";
import JobClientPage from "./client-page";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const result = await getJobBySlugAction(slug);

    if (!result.success || !result.data) {
        return {
            title: "Job Not Found",
        };
    }

    const job = result.data;

    return {
        title: `${job.title} at ${job.organization.name}`,
        description: job.description?.slice(0, 160),
    };
}

export default async function JobPage({ params }: PageProps) {
    const { slug } = await params;
    const result = await getJobBySlugAction(slug);

    if (!result.success || !result.data) {
        notFound();
    }

    return <JobClientPage job={result.data} />;
}

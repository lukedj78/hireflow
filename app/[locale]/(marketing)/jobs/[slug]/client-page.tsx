"use client";

import { JobPosting, organization } from "@/lib/db/schema";
import { buttonVariants } from "@/components/ui/button";
import { MapPinIcon, BriefcaseIcon, CurrencyDollarIcon, BuildingsIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { JobDescription } from "@/components/job-description";
import { PageLayout } from "@/components/page-layout";

type JobWithOrg = JobPosting & {
    organization: typeof organization.$inferSelect;
};

interface JobClientPageProps {
    job: JobWithOrg;
}

export default function JobClientPage({ job }: JobClientPageProps) {
    return (
        <PageLayout>
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">{job.title}</h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <BuildingsIcon className="w-4 h-4" />
                        {job.organization.name}
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4" />
                        {job.location}
                    </div>
                    <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-4 h-4" />
                        <span className="capitalize">{job.type}</span>
                    </div>
                    {job.salaryRange && (
                        <div className="flex items-center gap-2">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            {job.salaryRange}
                        </div>
                    )}
                </div>
            </div>
            <JobDescription
                description={job.description || ""}
                isAiGenerated={!!job.parsedRequirements}
            />

            <div className="mt-8 pt-8 border-t flex justify-end">
                <Link href={`/jobs/${job.slug}/apply`} className={buttonVariants({ size: "lg" })}>
                    Apply for this position
                </Link>
            </div>
        </PageLayout>
    );
}

import { getPublicJobsAction } from "@/lib/server/jobs-actions";
import JobsClientPage from "./client-page";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Jobs - HireFlow",
    description: "Find your next opportunity with HireFlow",
};

export default async function JobsPage() {
    const result = await getPublicJobsAction();
    const jobs = result.success && result.data ? result.data : [];

    return <JobsClientPage jobs={jobs} />;
}

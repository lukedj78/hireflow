import { getCandidateProfileAction } from "@/lib/server/candidate-actions";
import { PageLayout } from "@/components/page-layout";
import ResumeClientPage from "./client-page";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CandidateResumePage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "candidate") {
        redirect("/dashboard");
    }

    const candidateProfile = await getCandidateProfileAction();

    return (
        <PageLayout>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Resume</h1>
                    <p className="text-muted-foreground">
                        Upload and manage your resume.
                    </p>
                </div>
            </div>

            <ResumeClientPage candidateProfile={candidateProfile} />
        </PageLayout>
    );
}

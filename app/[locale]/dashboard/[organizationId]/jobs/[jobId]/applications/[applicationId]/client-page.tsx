"use client";

import { Application, Candidate, JobPosting, Interview, User, CandidateFile } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnvelopeIcon, PhoneIcon, CalendarIcon, DownloadIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateApplicationStatusAction } from "@/lib/server/application-actions";
import { triggerCandidateParsingAction, generateMatchAnalysisAction } from "@/lib/server/ai-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SparkleIcon, CircleNotchIcon, ThumbsUpIcon, ThumbsDownIcon, TargetIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { ScheduleInterviewDialog } from "@/components/interviews/schedule-interview-dialog";
import { InterviewList } from "@/components/interviews/interview-list";

type ApplicationWithRelations = Application & {
    candidate: Omit<Candidate, "embedding"> & {
        files?: CandidateFile[];
    };
    jobPosting: Omit<JobPosting, "embedding">;
};

type InterviewWithOrganizer = Interview & {
    organizer: User;
};

type ApplicationStatus = "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";

export default function ApplicationDetailClientPage({ 
    application,
    interviews = [] 
}: { 
    application: ApplicationWithRelations,
    interviews?: InterviewWithOrganizer[]
}) {
    const router = useRouter();
    const [isParsing, setIsParsing] = useState(false);
    const [isMatching, setIsMatching] = useState(false);

    async function handleStatusChange(newStatus: string | null) {
        if (!newStatus) return;
        try {
            await updateApplicationStatusAction(application.id, newStatus as ApplicationStatus);
            toast.success("Status updated");
            router.refresh();
        } catch {
            toast.error("Failed to update status");
        }
    }

    async function handleParseCV() {
        setIsParsing(true);
        try {
            await triggerCandidateParsingAction(application.candidate.id);
            toast.success("AI Analysis triggered. Updates will appear shortly.");
            // Refresh after a short delay to catch fast updates or just to show we triggered it
            router.refresh(); 
        } catch (error) {
            toast.error("Failed to trigger analysis");
        } finally {
            setIsParsing(false);
        }
    }

    async function handleGenerateMatch() {
        setIsMatching(true);
        try {
            await generateMatchAnalysisAction(application.id);
            toast.success("Match analysis generated successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to generate match analysis");
        } finally {
            setIsMatching(false);
        }
    }

    return (
        <PageLayout>
            <PageHeader
                title={application.candidate.name}
                description={`Applying for ${application.jobPosting.title}`}
                backHref={`/dashboard/${application.jobPosting.organizationId}/jobs/${application.jobPostingId}/applications`}
                actions={
                    <ScheduleInterviewDialog 
                        applicationId={application.id} 
                        candidateId={application.candidateId} 
                        jobId={application.jobPostingId} 
                    />
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <div className="flex items-center gap-2">
                                        <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
                                        <a href={`mailto:${application.candidate.email}`} className="hover:underline">
                                            {application.candidate.email}
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                    <div className="flex items-center gap-2">
                                        <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                                        <span>{application.candidate.phone || "N/A"}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Applied Date</p>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        <span>{format(new Date(application.createdAt), "PPP")}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {application.candidate.resumeUrl && (
                                <div className="pt-4">
                                    <Button variant="outline" size="sm" render={
                                        <a href={application.candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                                            <DownloadIcon className="h-4 w-4" />
                                            Download Resume
                                        </a>
                                    }>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <SparkleIcon className="h-5 w-5 text-purple-500" />
                                CV Analysis
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={handleParseCV} disabled={isParsing}>
                                {isParsing ? <CircleNotchIcon className="h-4 w-4 animate-spin mr-2" /> : <SparkleIcon className="h-4 w-4 mr-2" />}
                                {application.candidate.summary ? "Re-analyze" : "Analyze CV"}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {application.candidate.summary ? (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Summary</h3>
                                        <p className="text-sm text-muted-foreground">{application.candidate.summary}</p>
                                    </div>
                                    {application.candidate.skills && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    try {
                                                        const skills = typeof application.candidate.skills === 'string' 
                                                            ? JSON.parse(application.candidate.skills) 
                                                            : application.candidate.skills;
                                                        if (Array.isArray(skills)) {
                                                            return skills.map((skill: string, i: number) => (
                                                                <Badge key={i} variant="secondary">{skill}</Badge>
                                                            ));
                                                        }
                                                        return null;
                                                    } catch (e) {
                                                        return null;
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <SparkleIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No CV analysis available yet.</p>
                                    <p className="text-sm">Click &quot;Analyze CV&quot; to extract insights.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {application.aiScore && (
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Insights</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Match Score</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={application.aiScore > 80 ? "default" : application.aiScore > 50 ? "secondary" : "destructive"}>
                                            {application.aiScore}% Match
                                        </Badge>
                                    </div>
                                </div>
                                {application.aiFeedback && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-2">Analysis</p>
                                        <p className="text-sm leading-relaxed">{application.aiFeedback}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <InterviewList interviews={interviews} />
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TargetIcon className="h-5 w-5 text-blue-600" />
                                Match Analysis
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={handleGenerateMatch} disabled={isMatching || !application.candidate.summary}>
                                {isMatching ? <CircleNotchIcon className="h-4 w-4 animate-spin mr-2" /> : <TargetIcon className="h-4 w-4 mr-2" />}
                                {application.aiScore ? "Re-evaluate" : "Evaluate Match"}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!application.candidate.summary ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    <p className="text-sm">Parse the CV first to enable match analysis.</p>
                                </div>
                            ) : application.aiScore !== null && application.aiScore !== undefined ? (
                                <>
                                    <div className="flex items-center justify-center py-4">
                                        <div className="relative flex items-center justify-center">
                                            <svg className="h-32 w-32 transform -rotate-90">
                                                <circle
                                                    className="text-muted/20"
                                                    strokeWidth="8"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="58"
                                                    cx="64"
                                                    cy="64"
                                                />
                                                <circle
                                                    className={
                                                        application.aiScore >= 80 ? "text-green-500" :
                                                        application.aiScore >= 50 ? "text-yellow-500" : "text-red-500"
                                                    }
                                                    strokeWidth="8"
                                                    strokeDasharray={365}
                                                    strokeDashoffset={365 - (365 * application.aiScore) / 100}
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="58"
                                                    cx="64"
                                                    cy="64"
                                                />
                                            </svg>
                                            <div className="absolute text-center">
                                                <span className="text-3xl font-bold">{application.aiScore}</span>
                                                <span className="text-sm text-muted-foreground block">% Match</span>
                                            </div>
                                        </div>
                                    </div>

                                    {application.aiFeedback && (
                                        <div className="bg-muted/30 p-4 rounded-lg">
                                            <h4 className="font-semibold mb-2">Summary</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {application.aiFeedback}
                                            </p>
                                        </div>
                                    )}

                                    {(() => {
                                        try {
                                            const analysis = application.aiAnalysis && typeof application.aiAnalysis === 'string'
                                                ? JSON.parse(application.aiAnalysis)
                                                : null;

                                            if (!analysis) return null;

                                            return (
                                                <div className="grid grid-cols-1 gap-4">
                                                    {analysis.pros && analysis.pros.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-success">
                                                                <ThumbsUpIcon className="h-4 w-4" /> Pros
                                                            </h4>
                                                            <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                                                                {analysis.pros.map((item: string, i: number) => (
                                                                    <li key={i}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    
                                                    {analysis.cons && analysis.cons.length > 0 && (
                                                        <div>
                                                            <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-destructive">
                                                                <ThumbsDownIcon className="h-4 w-4" /> Cons
                                                            </h4>
                                                            <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
                                                                {analysis.cons.map((item: string, i: number) => (
                                                                    <li key={i}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } catch (e) {
                                            return null;
                                        }
                                    })()}
                                </>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <TargetIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No match analysis generated yet.</p>
                                    <p className="text-sm">Click &quot;Evaluate Match&quot; to analyze fit.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Application Status</CardTitle>
                            <CardDescription>Manage the progress of this application</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select 
                                defaultValue={application.status} 
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="applied">Applied</SelectItem>
                                    <SelectItem value="screening">Screening</SelectItem>
                                    <SelectItem value="interview">Interview</SelectItem>
                                    <SelectItem value="offer">Offer</SelectItem>
                                    <SelectItem value="hired">Hired</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="text-sm text-muted-foreground">
                                <p>Current status: <span className="font-medium text-foreground capitalize">{application.status}</span></p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}

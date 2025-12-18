"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { EnvelopeIcon, PhoneIcon, FileTextIcon, BriefcaseIcon, GraduationCapIcon, CalendarIcon, ArrowLeftIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import type { Candidate } from "@/lib/db/schema";
import { PageLayout } from "@/components/page-layout";
import Link from "next/link";

// Helper types for parsed JSON content
interface ExperienceItem {
    role?: string;
    title?: string;
    company?: string;
    employer?: string;
    startDate?: string;
    start_date?: string;
    endDate?: string;
    end_date?: string;
    description?: string;
    responsibilities?: string;
}

interface EducationItem {
    institution?: string;
    school?: string;
    degree?: string;
    field?: string;
    startDate?: string;
    start_date?: string;
    endDate?: string;
    end_date?: string;
}

// When passed from Server Component, Dates are serialized to strings
interface SerializedCandidate extends Omit<Candidate, "createdAt" | "updatedAt" | "resumeLastUpdatedAt" | "embedding"> {
    createdAt: string | Date;
    updatedAt: string | Date;
    resumeLastUpdatedAt: string | Date | null;
}

interface CandidateClientPageProps {
    candidate: SerializedCandidate;
    organizationId: string;
    jobId: string;
}

export default function CandidateClientPage({ candidate, organizationId, jobId }: CandidateClientPageProps) {
    
    // Helper to safely parse JSON
    const safeParse = <T,>(data: string | null | undefined | object, fallback: T): T => {
        if (!data) return fallback;
        if (typeof data === 'object') return data as T;
        try {
            return JSON.parse(data as string);
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            return fallback;
        }
    };

    const skills = safeParse<string[]>(candidate.skills, []);
    const experience = safeParse<ExperienceItem[]>(candidate.experience, []);
    const education = safeParse<EducationItem[]>(candidate.education, []);

    return (
        <PageLayout>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between mb-8">
                <div className="flex items-start gap-4">
                    <Link 
                        href={`/dashboard/${organizationId}/jobs/${jobId}/suggestions`}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Link>
                    
                    <div className="flex gap-4">
                        <Avatar className="h-16 w-16 border-2 border-border">
                            <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                {candidate.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{candidate.name}</h1>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-muted-foreground text-sm">
                                <div className="flex items-center gap-1.5">
                                    <EnvelopeIcon className="h-3.5 w-3.5" />
                                    <span>{candidate.email}</span>
                                </div>
                                {candidate.phone && (
                                    <div className="flex items-center gap-1.5">
                                        <PhoneIcon className="h-3.5 w-3.5" />
                                        <span>{candidate.phone}</span>
                                    </div>
                                )}
                                {candidate.yearsOfExperience !== null && (
                                    <div className="flex items-center gap-1.5">
                                        <BriefcaseIcon className="h-3.5 w-3.5" />
                                        <span>{candidate.yearsOfExperience} Years Exp.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3 ml-12 md:ml-0">
                    {candidate.resumeUrl && (
                        <Button variant="outline">
                            <Link className="flex items-center gap-2" href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                                <FileTextIcon className="h-4 w-4" />
                                View Resume
                            </Link>
                        </Button>
                    )}
                    <Button>Invite to Apply</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Professional Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {candidate.summary || "No summary available."}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Experience */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BriefcaseIcon className="h-5 w-5 text-muted-foreground" />
                                Work Experience
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {experience.length > 0 ? (
                                experience.map((exp, index) => (
                                    <div key={index} className="relative pl-4 border-l-2 border-muted last:border-0 pb-6 last:pb-0">
                                        <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-muted-foreground/50" />
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                                            <h3 className="font-semibold text-base">{exp.role || exp.title || "Unknown Role"}</h3>
                                            <span className="text-xs text-muted-foreground font-medium">
                                                {exp.startDate || exp.start_date || ""} - {exp.endDate || exp.end_date || "Present"}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-muted-foreground mb-2">
                                            {exp.company || exp.employer || "Unknown Company"}
                                        </div>
                                        <p className="text-sm text-muted-foreground/80 whitespace-pre-line">
                                            {exp.description || exp.responsibilities || ""}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No experience listed.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Education */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <GraduationCapIcon className="h-5 w-5 text-muted-foreground" />
                                Education
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {education.length > 0 ? (
                                education.map((edu, index) => (
                                    <div key={index} className="flex flex-col gap-1 pb-4 border-b last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-sm">{edu.institution || edu.school || "Unknown Institution"}</h3>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {edu.startDate || edu.start_date ? `${edu.startDate} - ` : ""}{edu.endDate || edu.end_date || ""}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {edu.degree || "Degree"} {edu.field ? `in ${edu.field}` : ""}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No education listed.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Skills */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Skills</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {skills.length > 0 ? (
                                    skills.map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="font-normal">
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No skills listed.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Seniority Level</div>
                                <div className="font-medium">{candidate.seniority || "Not specified"}</div>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Resume Updated</div>
                                <div className="font-medium flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    {candidate.resumeLastUpdatedAt ? format(new Date(candidate.resumeLastUpdatedAt), "MMM d, yyyy") : "Never"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}

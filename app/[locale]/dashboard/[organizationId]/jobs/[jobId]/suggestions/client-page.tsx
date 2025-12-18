"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Envelope, Briefcase, GraduationCap, FileText } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SuggestedCandidate = {
    id: string;
    name: string;
    email: string;
    skills: string | null;
    experience: string | null;
    summary: string | null;
    resumeUrl: string | null;
    similarity: number;
};

interface SuggestionsClientPageProps {
    candidates: SuggestedCandidate[];
    jobId: string;
}

export default function SuggestionsClientPage({ candidates, jobId }: SuggestionsClientPageProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">AI Suggested Candidates</h1>
                <p className="text-muted-foreground">
                    Based on semantic matching between the job description and candidate profiles.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {candidates.map((candidate) => {
                    // Convert cosine distance to similarity percentage
                    // Cosine distance is between 0 (identical) and 2 (opposite).
                    // Usually for embeddings it's 0 to 1 if normalized? 
                    // Let's assume lower distance = higher similarity.
                    // A simple approximation: (1 - distance) * 100
                    // Or just display the raw score if we are not sure about the range.
                    // But typically vector_distance_cos in many DBs is 1 - cosine_similarity.
                    // So 0 means identical (100% match).
                    
                    const matchScore = Math.round((1 - candidate.similarity) * 100);
                    const safeScore = Math.max(0, matchScore); // Ensure no negative

                    let skills = [];
                    try {
                        skills = candidate.skills ? JSON.parse(candidate.skills) : [];
                    } catch (e) {
                        if (typeof candidate.skills === 'string') skills = [candidate.skills];
                    }

                    return (
                        <Card key={candidate.id} className="flex flex-col">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>{candidate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base font-semibold leading-none">
                                                {candidate.name}
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-1 truncate max-w-[180px]">
                                                {candidate.email}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={safeScore > 75 ? "default" : safeScore > 50 ? "secondary" : "outline"}>
                                        {safeScore}% Match
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4 text-sm">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                        <span>Relevance Score</span>
                                        <span>{safeScore}/100</span>
                                    </div>
                                    <Progress value={safeScore} className="h-1.5" />
                                </div>

                                {candidate.summary && (
                                    <div className="text-muted-foreground line-clamp-3 text-xs">
                                        {candidate.summary}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1 mt-auto">
                                    {Array.isArray(skills) && skills.slice(0, 3).map((skill: string) => (
                                        <Badge key={skill} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {Array.isArray(skills) && skills.length > 3 && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                            +{skills.length - 3}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t">
                                    <Link
                                        href={`mailto:${candidate.email}`}
                                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                                    >
                                        <Mail className="w-3 h-3 mr-2" />
                                        Contact
                                    </Link>
                                    {candidate.resumeUrl && (
                                        <Link
                                            href={candidate.resumeUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}
                                        >
                                            <FileText className="w-3 h-3 mr-2" />
                                            Resume
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {candidates.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <p>No matching candidates found yet.</p>
                        <p className="text-sm">Try improving the job description to generate a better embedding.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

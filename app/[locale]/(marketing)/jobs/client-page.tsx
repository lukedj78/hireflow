"use client";

import { JobPosting, organization } from "@/lib/db/schema";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Briefcase, Calendar, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Organization = typeof organization.$inferSelect;
type JobWithOrganization = JobPosting & { organization: Organization };

interface JobsClientPageProps {
    jobs: JobWithOrganization[];
}

export default function JobsClientPage({ jobs }: JobsClientPageProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Explore Open Positions</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Find your next career opportunity among the best companies hiring with HireFlow.
                </p>
            </div>

            <div className="mb-8 max-w-md mx-auto">
                <Input
                    placeholder="Search by job title, company, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
            </div>

            <div className="grid gap-4">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <span className="flex items-center gap-1 font-medium text-foreground">
                                                <Building2 className="w-4 h-4" />
                                                {job.organization.name}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                                            </span>
                                        </div>
                                        <CardTitle className="text-xl">
                                            <Link href={`/jobs/${job.slug}`} className="hover:underline hover:text-blue-600 transition-colors">
                                                {job.title}
                                            </Link>
                                        </CardTitle>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {job.location || "Remote"}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" />
                                                <span className="capitalize">{job.type}</span>
                                            </div>
                                            {job.salaryRange && (
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {job.salaryRange}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link 
                                            href={`/jobs/${job.slug}`}
                                            className={cn(buttonVariants({ variant: "outline" }))}
                                        >
                                            View Details
                                        </Link>
                                        <Link 
                                            href={`/jobs/${job.slug}/apply`}
                                            className={cn(buttonVariants({ variant: "default" }))}
                                        >
                                            Apply Now
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p className="text-lg">No jobs found matching your criteria.</p>
                        <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">
                            Clear search
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

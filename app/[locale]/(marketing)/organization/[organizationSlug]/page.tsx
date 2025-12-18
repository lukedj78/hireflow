import { getPublicOrganizationBySlug } from "@/lib/server/organization-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Briefcase, Calendar, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface OrganizationPageProps {
    params: Promise<{
        organizationSlug: string;
        locale: string;
    }>;
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
    const { organizationSlug } = await params;
    const org = await getPublicOrganizationBySlug(organizationSlug);

    if (!org) {
        notFound();
    }

    // Cast metadata safely
    const metadata = org.metadata as Record<string, unknown> | null;
    const website = metadata?.website as string | undefined;
    const description = metadata?.description as string | undefined;

    return (
        <div className="container mx-auto py-12 px-4 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-12 text-center md:text-left">
                <Avatar className="w-24 h-24 border-2 border-border">
                    <AvatarImage src={org.logo || ""} alt={org.name} />
                    <AvatarFallback className="text-2xl">{org.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">{org.name}</h1>
                    {website && (
                         <Link href={website} target="_blank" className="text-blue-600 hover:underline flex items-center justify-center md:justify-start gap-2">
                            <Globe className="w-4 h-4" />
                            Visit Website
                        </Link>
                    )}
                    {description && (
                        <p className="text-muted-foreground max-w-2xl">{description}</p>
                    )}
                </div>
            </div>

            {/* Jobs */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Open Positions</h2>
                <div className="grid gap-4">
                    {org.jobPostings.length > 0 ? (
                        org.jobPostings.map((job) => (
                            <Card key={job.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
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
                        <div className="text-center py-12 border rounded-lg bg-muted/20">
                            <p className="text-muted-foreground">No open positions at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

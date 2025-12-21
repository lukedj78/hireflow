"use client";

import { JobPosting, organization } from "@/lib/db/schema";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, Briefcase, Calendar, Building2, Filter, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Organization = typeof organization.$inferSelect;
type JobWithOrganization = JobPosting & { organization: Organization };

interface JobsClientPageProps {
    jobs: JobWithOrganization[];
}

export default function JobsClientPage({ jobs }: JobsClientPageProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

    // Extract unique values for filters
    const uniqueTypes = useMemo(() => {
        const types = new Set(jobs.map(job => job.type));
        return Array.from(types).sort();
    }, [jobs]);

    const uniqueLocations = useMemo(() => {
        const locations = new Set(jobs.map(job => job.location || "Remote"));
        return Array.from(locations).sort();
    }, [jobs]);

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = 
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.location?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.type);
        
        const jobLocation = job.location || "Remote";
        const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(jobLocation);

        return matchesSearch && matchesType && matchesLocation;
    });

    const toggleType = (type: string) => {
        setSelectedTypes(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleLocation = (location: string) => {
        setSelectedLocations(prev => 
            prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
        );
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedTypes([]);
        setSelectedLocations([]);
    };

    const hasActiveFilters = searchTerm || selectedTypes.length > 0 || selectedLocations.length > 0;

    const renderFilters = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Job Type</h3>
                <div className="space-y-3">
                    {uniqueTypes.map(type => (
                        <div key={type} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`type-${type}`} 
                                checked={selectedTypes.includes(type)}
                                onCheckedChange={() => toggleType(type)}
                            />
                            <Label 
                                htmlFor={`type-${type}`} 
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                            >
                                {type}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
            
            <Separator />
            
            <div>
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                        {uniqueLocations.map(location => (
                            <div key={location} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`location-${location}`} 
                                    checked={selectedLocations.includes(location)}
                                    onCheckedChange={() => toggleLocation(location)}
                                />
                                <Label 
                                    htmlFor={`location-${location}`} 
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {location}
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {hasActiveFilters && (
                <>
                    <Separator />
                    <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={clearFilters}
                    >
                        <X className="h-4 w-4" />
                        Clear Filters
                    </Button>
                </>
            )}
        </div>
    );

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-4">Explore Open Positions</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Find your next career opportunity among the best companies hiring with HireFlow.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Mobile Filter Sheet */}
                <div className="lg:hidden mb-4">
                    <Sheet>
                        <SheetTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
                            <Filter className="h-4 w-4" />
                            Filters
                        </SheetTrigger>
                        <SheetContent side="left">
                            <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                                <SheetDescription>
                                    Narrow down your job search
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6">
                                {renderFilters()}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Desktop Sidebar */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-8">
                        {renderFilters()}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="mb-6">
                        <Input
                            placeholder="Search by job title, company, or keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
                            </p>
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
                                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                    <p className="text-lg font-medium">No jobs found matching your criteria.</p>
                                    <p className="text-sm mt-1 mb-4">Try adjusting your search or filters.</p>
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear all filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

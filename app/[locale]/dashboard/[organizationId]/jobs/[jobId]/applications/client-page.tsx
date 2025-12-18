"use client";

import { Application, Candidate, JobPosting } from "@/lib/db/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateApplicationStatusAction, deleteApplicationAction } from "@/lib/server/application-actions";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { buttonVariants, Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon, TrashIcon, FileTextIcon, EyeIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

type ApplicationWithCandidate = Application & {
    candidate: Candidate;
};

type ApplicationStatus = "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";

interface ApplicationsClientPageProps {
    job: JobPosting;
    applications: ApplicationWithCandidate[];
}

export default function ApplicationsClientPage({ job, applications }: ApplicationsClientPageProps) {
    const router = useRouter();

    async function handleStatusChange(applicationId: string, newStatus: string) {
        try {
            await updateApplicationStatusAction(applicationId, newStatus as ApplicationStatus);
            toast.success("Status updated");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update status");
        }
    }

    async function handleDelete(applicationId: string) {
        try {
            await deleteApplicationAction(applicationId);
            toast.success("Application deleted");
            router.refresh();
        } catch {
            toast.error("Failed to delete application");
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "applied": return <Badge variant="secondary">Applied</Badge>;
            case "screening": return <Badge className="bg-yellow-500 hover:bg-yellow-600">Screening</Badge>;
            case "interview": return <Badge className="bg-blue-500 hover:bg-blue-600">Interview</Badge>;
            case "offer": return <Badge className="bg-purple-500 hover:bg-purple-600">Offer</Badge>;
            case "hired": return <Badge className="bg-green-500 hover:bg-green-600">Hired</Badge>;
            case "rejected": return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Link 
                    href={`/dashboard/organization/jobs/${job.id}`}
                    className={buttonVariants({ variant: "ghost", size: "icon" })}
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Applications for {job.title}</h1>
                    <p className="text-muted-foreground">{applications.length} applications received</p>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Applied</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Change Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No applications yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            applications.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell>
                                        <div className="font-medium">{app.candidate.name}</div>
                                        <div className="text-sm text-muted-foreground">{app.candidate.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(app.status)}
                                    </TableCell>
                                    <TableCell>
                                        <Select 
                                            defaultValue={app.status} 
                                            onValueChange={(val) => val && handleStatusChange(app.id, val)}
                                        >
                                            <SelectTrigger className="w-[140px]">
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
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {app.candidate.resumeUrl && (
                                                <a 
                                                    href={app.candidate.resumeUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className={buttonVariants({ variant: "ghost", size: "icon" })}
                                                    title="View Resume"
                                                >
                                                    <FileTextIcon className="h-4 w-4" />
                                                </a>
                                            )}
                                            <Link 
                                                href={`/dashboard/organization/jobs/${job.id}/applications/${app.id}`}
                                                className={buttonVariants({ variant: "ghost", size: "icon" })}
                                                title="View Details"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </Link>
                                            <AlertDialog>
                                                <AlertDialogTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-destructive hover:text-destructive hover:bg-destructive/10")}>
                                                    <TrashIcon className="h-4 w-4" />
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the application for {app.candidate.name}.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(app.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

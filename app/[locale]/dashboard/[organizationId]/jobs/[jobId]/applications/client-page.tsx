"use client";

import { Application, Candidate, JobPosting, candidateFile } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateApplicationStatusAction, deleteApplicationAction } from "@/lib/server/application-actions";
import { getResumeDownloadUrlAction } from "@/lib/server/file-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { TrashIcon, FileTextIcon, EyeIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { InferSelectModel } from "drizzle-orm";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ApplicationWithCandidate = Application & {
    candidate: Omit<Candidate, "embedding"> & {
        files?: InferSelectModel<typeof candidateFile>[];
        embedding?: unknown;
    };
};

type ApplicationStatus = "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";

interface ApplicationsClientPageProps {
    job: JobPosting;
    applications: ApplicationWithCandidate[];
}

export default function ApplicationsClientPage({ job, applications }: ApplicationsClientPageProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);

    const handleStatusChange = (applicationId: string, newStatus: string) => {
        startTransition(async () => {
            const result = await updateApplicationStatusAction(applicationId, newStatus as ApplicationStatus);
            if (!result.success) {
                toast.error(result.error);
            } else {
                toast.success("Status updated");
                router.refresh();
            }
        });
    };

    async function handleDelete() {
        if (!applicationToDelete) return;
        try {
            await deleteApplicationAction(applicationToDelete);
            toast.success("Application deleted");
            router.refresh();
        } catch {
            toast.error("Failed to delete application");
        } finally {
            setApplicationToDelete(null);
        }
    }

    const handleViewResume = async (candidate: ApplicationWithCandidate['candidate']) => {
        try {
            const fileKey = candidate.files?.[0]?.fileKey;

            if (fileKey) {
                const result = await getResumeDownloadUrlAction(fileKey);
                if (result.success) {
                    window.open(result.url, '_blank');
                } else {
                    toast.error(result.error || "Failed to generate download link");
                }
            } else if (candidate.resumeUrl) {
                window.open(candidate.resumeUrl, '_blank');
            } else {
                toast.error("No resume found");
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to open resume");
        }
    };

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

    const columns: ColumnDef<ApplicationWithCandidate>[] = [
        {
            accessorKey: "candidate",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Candidate" />
            ),
            cell: ({ row }) => {
                const app = row.original;
                return (
                    <div>
                        <Link
                            href={`/dashboard/${job.organizationId}/jobs/${job.id}/applications/${app.id}`}
                            className="font-medium hover:underline"
                        >
                            {app.candidate.name}
                        </Link>
                        <div className="text-sm text-muted-foreground">{app.candidate.email}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Applied" />
            ),
            cell: ({ row }) => {
                return formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true });
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            id: "changeStatus",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Change Status" />
            ),
            cell: ({ row }) => {
                 const app = row.original;
                 return (
                     <Select
                        defaultValue={app.status}
                        onValueChange={(val) => handleStatusChange(app.id, val as ApplicationStatus)}
                        disabled={isPending}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="screening">Screening</SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="offer">Offer</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                 )
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                 const app = row.original;
                 return (
                     <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <DotsThreeIcon className="h-4 w-4" />
                            </Button>
                        }/>
                        <DropdownMenuContent align="end" className="w-full">
                            <DropdownMenuItem onClick={() => handleViewResume(app.candidate)}>
                                <FileTextIcon className="h-4 w-4" />
                                View Resume
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => router.push(`/dashboard/${job.organizationId}/jobs/${job.id}/applications/${app.id}`)}>
                                <EyeIcon className="h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-destructive" onClick={() => setApplicationToDelete(app.id)}>
                                <TrashIcon className="h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                 )
            }
        }
    ]

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Applications for ${job.title}`}
                description={`${applications.length} applications received`}
                backHref={`/dashboard/${job.organizationId}/jobs/${job.id}`}
            />
            
            <DataTable columns={columns} data={applications} />

            <AlertDialog open={!!applicationToDelete} onOpenChange={(open) => !open && setApplicationToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Application?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the application.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

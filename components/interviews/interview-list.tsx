"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon, MapPinIcon, LinkIcon, TrashIcon, UserIcon, PencilIcon, ClipboardTextIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { deleteInterviewAction } from "@/lib/server/interview-actions";
import { Interview, User } from "@/lib/db/schema";
import { EditInterviewDialog } from "./edit-interview-dialog";
import { InterviewReportDialog } from "./interview-report-dialog";

type InterviewWithOrganizer = Interview & {
    organizer: User;
};

interface InterviewListProps {
    interviews: InterviewWithOrganizer[];
}

export function InterviewList({ interviews }: InterviewListProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingInterview, setEditingInterview] = useState<InterviewWithOrganizer | null>(null);
    const [reportingInterview, setReportingInterview] = useState<InterviewWithOrganizer | null>(null);

    const handleDelete = async (interviewId: string) => {
        setIsDeleting(interviewId);
        try {
            const result = await deleteInterviewAction(interviewId);
            if (result.success) {
                toast.success("Interview cancelled successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to cancel interview");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsDeleting(null);
        }
    };

    if (interviews.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Interviews</CardTitle>
                    <CardDescription>No interviews scheduled yet.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Scheduled Interviews</h3>
            {interviews.map((interview) => (
                <Card key={interview.id}>
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(interview.startTime), "PPP")}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <ClockIcon className="h-3 w-3" />
                                    {format(new Date(interview.startTime), "p")} - {format(new Date(interview.endTime), "p")}
                                </CardDescription>
                            </div>
                            <Badge variant={
                                interview.status === "completed" ? "default" :
                                interview.status === "cancelled" ? "destructive" :
                                "secondary"
                            }>
                                {interview.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-3">
                        {interview.location && (
                            <div className="flex items-center gap-2">
                                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{interview.location}</span>
                            </div>
                        )}
                        {interview.meetingLink && (
                            <div className="flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                <a 
                                    href={interview.meetingLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline truncate max-w-[300px]"
                                >
                                    {interview.meetingLink}
                                </a>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <UserIcon className="h-4 w-4" />
                            <span>Organizer: {interview.organizer.name}</span>
                        </div>
                        
                        {interview.notes && (
                            <div className="bg-muted/50 p-2 rounded text-xs mt-2">
                                <span className="font-semibold block mb-1">Notes:</span>
                                {interview.notes}
                            </div>
                        )}

                        <div className="pt-2 flex justify-end gap-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setReportingInterview(interview)}
                            >
                                <ClipboardTextIcon className="h-4 w-4 mr-2" />
                                Report
                            </Button>

                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setEditingInterview(interview)}
                            >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                            </Button>

                            <AlertDialog>
                                <AlertDialogTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-destructive hover:text-destructive hover:bg-destructive/10")}>
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Cancel
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Interview?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the scheduled interview. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => handleDelete(interview.id)}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            {isDeleting === interview.id ? "Cancelling..." : "Yes, Cancel"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {editingInterview && (
                <EditInterviewDialog 
                    interview={editingInterview} 
                    open={!!editingInterview} 
                    onOpenChange={(open) => !open && setEditingInterview(null)} 
                />
            )}

            {reportingInterview && (
                <InterviewReportDialog
                    interview={reportingInterview}
                    open={!!reportingInterview}
                    onOpenChange={(open) => !open && setReportingInterview(null)}
                />
            )}
        </div>
    );
}
